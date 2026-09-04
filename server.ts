import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing for JSON and beacon text
  app.use(express.json());
  app.use(express.text({ type: ["text/plain", "application/json"] }));

  // In-memory real-time presence tracking
  interface PresenceSession {
    lastSeen: number;
    userId?: string;
    username?: string;
    name?: string;
    ip?: string;
  }

  const activeSessions = new Map<string, PresenceSession>();

  const pruneSessions = () => {
    const cutoff = Date.now() - 15000; // Inactive after 15 seconds without heartbeat
    for (const [id, session] of activeSessions.entries()) {
      if (session.lastSeen < cutoff) {
        activeSessions.delete(id);
      }
    }
  };

  // 1. Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 2. Client presence heartbeat (sent every ~6s by active clients)
  app.post("/api/presence/heartbeat", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { clientId, userId, username, name } = body || {};
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "local";
    const id = clientId || `${ip}-${userId || "anon"}`;

    activeSessions.set(id, {
      lastSeen: Date.now(),
      userId: userId ? String(userId) : undefined,
      username: username || undefined,
      name: name || undefined,
      ip,
    });

    pruneSessions();
    const onlineCount = Math.max(1, activeSessions.size);
    res.json({
      success: true,
      onlineCount,
      timestamp: Date.now(),
    });
  });

  // 3. Client leave notification (beacon or unload)
  app.post("/api/presence/leave", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { clientId } = body || {};
    if (clientId) {
      activeSessions.delete(clientId);
    }
    pruneSessions();
    res.json({
      success: true,
      onlineCount: Math.max(1, activeSessions.size),
    });
  });

  // 4. Get active online count
  app.get("/api/presence/count", (req, res) => {
    pruneSessions();
    res.json({
      onlineCount: Math.max(1, activeSessions.size),
      timestamp: Date.now(),
    });
  });

  // 5. Get active users list (for admin dashboard inspection)
  app.get("/api/presence/users", (req, res) => {
    pruneSessions();
    const users = Array.from(activeSessions.entries()).map(([id, session]) => ({
      id,
      userId: session.userId,
      username: session.username,
      name: session.name,
      lastSeen: session.lastSeen,
    }));
    res.json({
      onlineCount: Math.max(1, activeSessions.size),
      users,
    });
  });

  // Automatic background session prune every 10 seconds
  setInterval(pruneSessions, 10000);

  // Persistent Shared Video Storage (Server-backed so all users see admin-added videos)
  const VIDEOS_STORE_FILE = path.join(process.cwd(), "videos-store.json");

  function getStoredVideos(): any[] {
    try {
      if (fs.existsSync(VIDEOS_STORE_FILE)) {
        const raw = fs.readFileSync(VIDEOS_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // ensure no legacy dummy videos
          return parsed.filter((v: any) => !["vid_1", "vid_2", "vid_3", "vid_4", "vid_5"].includes(v.id));
        }
      }
    } catch (err) {
      console.error("Error reading stored videos:", err);
    }
    return [];
  }

  function saveStoredVideos(videos: any[]) {
    try {
      fs.writeFileSync(VIDEOS_STORE_FILE, JSON.stringify(videos, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored videos:", err);
    }
  }

  // 6. Get all shared videos
  app.get("/api/videos", (req, res) => {
    const videos = getStoredVideos();
    res.json({ success: true, videos });
  });

  // 7. Add a new video (Admin uploaded)
  app.post("/api/videos", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { title, category, duration, reward, thumbnailUrl, videoUrl, views } = body || {};
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, error: "Title and Video URL are required" });
    }

    const videos = getStoredVideos();
    const newVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      category: category || "all",
      duration: Number(duration) || 30,
      reward: Number(reward) || 3,
      thumbnailUrl:
        thumbnailUrl ||
        "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&q=80&w=400",
      videoUrl: String(videoUrl).trim(),
      views: views || "0",
      watched: false,
      createdAt: Date.now(),
    };

    videos.unshift(newVideo);
    saveStoredVideos(videos);
    res.json({ success: true, video: newVideo, videos });
  });

  // 8. Delete a video (Admin deleted)
  app.delete("/api/videos/:id", (req, res) => {
    const { id } = req.params;
    let videos = getStoredVideos();
    videos = videos.filter((v: any) => v.id !== id);
    saveStoredVideos(videos);
    res.json({ success: true, videos });
  });

  // 9. Increment view count for a video when reward is claimed
  app.post("/api/videos/:id/view", (req, res) => {
    const { id } = req.params;
    let videos = getStoredVideos();
    let updatedVideo: any = null;
    videos = videos.map((v: any) => {
      if (v.id === id) {
        let currentViews = 0;
        if (typeof v.viewCount === "number") {
          currentViews = v.viewCount;
        } else if (typeof v.views === "number") {
          currentViews = v.views;
        } else if (typeof v.views === "string") {
          const parsed = parseInt(v.views.replace(/[^0-9]/g, ""), 10);
          currentViews = isNaN(parsed) ? 0 : parsed;
        }
        const newCount = currentViews + 1;
        updatedVideo = {
          ...v,
          viewCount: newCount,
          views: newCount,
        };
        return updatedVideo;
      }
      return v;
    });
    saveStoredVideos(videos);
    res.json({ success: true, video: updatedVideo, videos });
  });

  // Persistent Shared Tasks Storage (Admin configured tasks and links)
  const TASKS_STORE_FILE = path.join(process.cwd(), "tasks-store.json");

  function getStoredTasks(): any[] | null {
    try {
      if (fs.existsSync(TASKS_STORE_FILE)) {
        const raw = fs.readFileSync(TASKS_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading stored tasks:", err);
    }
    return null;
  }

  function saveStoredTasks(tasksList: any[]) {
    try {
      fs.writeFileSync(TASKS_STORE_FILE, JSON.stringify(tasksList, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored tasks:", err);
    }
  }

  // Get all tasks
  app.get("/api/tasks", (req, res) => {
    const tasks = getStoredTasks();
    res.json({ success: true, tasks });
  });

  // Save/update tasks and links (Admin updated)
  app.post("/api/tasks", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { tasks: tasksList } = body || {};
    if (Array.isArray(tasksList)) {
      saveStoredTasks(tasksList);
      res.json({ success: true, tasks: tasksList });
    } else {
      res.status(400).json({ success: false, error: "tasks array is required" });
    }
  });

  // Persistent Shared Leaderboard Storage
  const LEADERBOARD_STORE_FILE = path.join(process.cwd(), "leaderboard-store.json");

  interface LeaderboardEntry {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    balance: number;
    totalEarned: number;
    referralsCount: number;
    tasksCompleted: number;
    updatedAt: number;
  }

  function getStoredLeaderboard(): LeaderboardEntry[] {
    try {
      if (fs.existsSync(LEADERBOARD_STORE_FILE)) {
        const raw = fs.readFileSync(LEADERBOARD_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // ensure no dummy entries
          return parsed.filter((item) => item && item.id && item.name && item.name !== "SSDR");
        }
      }
    } catch (err) {
      console.error("Error reading stored leaderboard:", err);
    }
    return [];
  }

  function saveStoredLeaderboard(data: LeaderboardEntry[]) {
    try {
      fs.writeFileSync(LEADERBOARD_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored leaderboard:", err);
    }
  }

  // 9. Sync user stats to shared real leaderboard
  app.post("/api/leaderboard/sync", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { id, name, username, avatarUrl, balance, totalEarned, referralsCount, tasksCompleted } = body || {};
    if (!id || !name) {
      return res.status(400).json({ success: false, error: "id and name are required" });
    }

    const leaderboard = getStoredLeaderboard();
    const existingIndex = leaderboard.findIndex((item) => item.id === id);
    const entry: LeaderboardEntry = {
      id: String(id),
      name: String(name),
      username: username ? String(username) : undefined,
      avatarUrl: avatarUrl ? String(avatarUrl) : undefined,
      balance: Math.max(0, Number(balance) || 0),
      totalEarned: Math.max(0, Number(totalEarned) || 0),
      referralsCount: Math.max(0, Number(referralsCount) || 0),
      tasksCompleted: Math.max(0, Number(tasksCompleted) || 0),
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = { ...leaderboard[existingIndex], ...entry };
    } else {
      leaderboard.push(entry);
    }

    saveStoredLeaderboard(leaderboard);
    res.json({ success: true, entry });
  });

  // 10. Get leaderboard rankings
  app.get("/api/leaderboard", (req, res) => {
    const category = (req.query.category as string) || "refs"; // "refs" | "earnings" | "unlocks"
    const period = (req.query.period as string) || "daily";
    const currentUserId = req.query.userId as string;

    const allEntries = getStoredLeaderboard();

    // Sort according to requested category
    const sorted = [...allEntries];
    if (category === "earnings") {
      sorted.sort((a, b) => b.balance - a.balance || b.totalEarned - a.totalEarned);
    } else if (category === "unlocks") {
      sorted.sort((a, b) => b.tasksCompleted - a.tasksCompleted || b.referralsCount - a.referralsCount);
    } else {
      // Default: refs
      sorted.sort((a, b) => b.referralsCount - a.referralsCount || b.balance - a.balance);
    }

    const rankings = sorted.map((item, index) => ({
      rank: index + 1,
      ...item,
      isCurrentUser: currentUserId ? item.id === currentUserId : false,
    }));

    const userRank = currentUserId ? rankings.find((r) => r.id === currentUserId) || null : null;

    res.json({
      success: true,
      category,
      period,
      totalParticipants: rankings.length,
      userRank,
      rankings,
    });
  });

  // Vite middleware setup (SPA fallback)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

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

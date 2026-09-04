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
    const totalUsers = getTotalUserCount();
    res.json({
      success: true,
      onlineCount,
      totalUsers,
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
      totalUsers: getTotalUserCount(),
    });
  });

  // 4. Get active online count & total registered users
  app.get("/api/presence/count", (req, res) => {
    pruneSessions();
    res.json({
      onlineCount: Math.max(1, activeSessions.size),
      totalUsers: getTotalUserCount(),
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

  // Persistent Shared Adsterra & Monetag Configuration
  const AD_CONFIG_STORE_FILE = path.join(process.cwd(), "ad-config-store.json");

  function getStoredAdConfig(): any {
    try {
      if (fs.existsSync(AD_CONFIG_STORE_FILE)) {
        const raw = fs.readFileSync(AD_CONFIG_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading stored ad config:", err);
    }
    return null;
  }

  function saveStoredAdConfig(config: any) {
    try {
      fs.writeFileSync(AD_CONFIG_STORE_FILE, JSON.stringify(config, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored ad config:", err);
    }
  }

  // Get current global Adsterra / Monetag ad config
  app.get("/api/ad-config", (req, res) => {
    const config = getStoredAdConfig();
    res.json({ success: true, config });
  });

  // Save updated global Adsterra / Monetag ad config (Admin updated)
  app.post("/api/ad-config", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { config } = body || {};
    if (config && typeof config === "object") {
      saveStoredAdConfig(config);
      res.json({ success: true, config });
    } else {
      res.status(400).json({ success: false, error: "config object is required" });
    }
  });

  // Persistent Shared Announcement / Notice Store
  const ANNOUNCEMENT_STORE_FILE = path.join(process.cwd(), "announcement-store.json");

  interface BroadcastAnnouncement {
    id: string;
    title: string;
    message: string;
    badge?: string;
    linkUrl?: string;
    linkText?: string;
    actionType?: "notice" | "event" | "ad" | "task";
    enabled: boolean;
    updatedAt: number;
  }

  const DEFAULT_ANNOUNCEMENT: BroadcastAnnouncement = {
    id: "notice_default",
    title: "🎉 মেগা রিওয়ার্ড ইভেন্ট চলছে!",
    message: "সকল টাস্ক সম্পন্ন করে প্রতিদিন ১০০+ টাকা পর্যন্ত আয় করুন। সাথে বন্ধুদের রেফার করে পান নিশ্চিত ৩০% লাইফটাইম কমিশন!",
    badge: "মেগা অফার 🔥",
    linkUrl: "",
    linkText: "বিস্তারিত দেখুন",
    actionType: "event",
    enabled: true,
    updatedAt: Date.now(),
  };

  function getStoredAnnouncement(): BroadcastAnnouncement {
    try {
      if (fs.existsSync(ANNOUNCEMENT_STORE_FILE)) {
        const raw = fs.readFileSync(ANNOUNCEMENT_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_ANNOUNCEMENT, ...parsed };
        }
      }
    } catch (err) {
      console.error("Error reading stored announcement:", err);
    }
    return DEFAULT_ANNOUNCEMENT;
  }

  function saveStoredAnnouncement(announcement: BroadcastAnnouncement) {
    try {
      fs.writeFileSync(ANNOUNCEMENT_STORE_FILE, JSON.stringify(announcement, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored announcement:", err);
    }
  }

  // Get current global broadcast announcement
  app.get("/api/announcement", (req, res) => {
    const announcement = getStoredAnnouncement();
    res.json({ success: true, announcement });
  });

  // Save updated broadcast announcement (Admin)
  app.post("/api/announcement", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { announcement } = body || {};
    if (announcement && typeof announcement === "object") {
      const updated: BroadcastAnnouncement = {
        id: announcement.id || `notice_${Date.now()}`,
        title: announcement.title || "",
        message: announcement.message || "",
        badge: announcement.badge || "",
        linkUrl: announcement.linkUrl || "",
        linkText: announcement.linkText || "",
        actionType: announcement.actionType || "notice",
        enabled: Boolean(announcement.enabled),
        updatedAt: Date.now(),
      };
      saveStoredAnnouncement(updated);
      res.json({ success: true, announcement: updated });
    } else {
      res.status(400).json({ success: false, error: "announcement object is required" });
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

  // Persistent Shared System Settings Store
  const SYSTEM_SETTINGS_STORE_FILE = path.join(process.cwd(), "system-settings-store.json");

  function getStoredSystemSettings(): any {
    try {
      if (fs.existsSync(SYSTEM_SETTINGS_STORE_FILE)) {
        const raw = fs.readFileSync(SYSTEM_SETTINGS_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading stored system settings:", err);
    }
    return null;
  }

  function saveStoredSystemSettings(settings: any) {
    try {
      fs.writeFileSync(SYSTEM_SETTINGS_STORE_FILE, JSON.stringify(settings, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing stored system settings:", err);
    }
  }

  // 11. Get current system settings
  app.get("/api/system-settings", (req, res) => {
    const settings = getStoredSystemSettings();
    res.json({ success: true, settings });
  });

  // 12. Save system settings (Admin)
  app.post("/api/system-settings", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { settings } = body || {};
    if (settings && typeof settings === "object") {
      saveStoredSystemSettings(settings);
      res.json({ success: true, settings });
    } else {
      res.status(400).json({ success: false, error: "settings object is required" });
    }
  });

  // Registered Telegram Users Store
  const TELEGRAM_USERS_FILE = path.join(process.cwd(), "telegram-users-store.json");
  const REFERRALS_STORE_FILE = path.join(process.cwd(), "referrals-store.json");

  function getStoredTelegramUsers(): Record<string, { chatId: number | string; firstName: string; username?: string; registeredAt: number }> {
    try {
      if (fs.existsSync(TELEGRAM_USERS_FILE)) {
        const raw = fs.readFileSync(TELEGRAM_USERS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading telegram users store:", err);
    }
    return {};
  }

  function saveStoredTelegramUsers(users: Record<string, any>) {
    try {
      fs.writeFileSync(TELEGRAM_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing telegram users store:", err);
    }
  }

  function getStoredReferrals(): Record<string, any[]> {
    try {
      if (fs.existsSync(REFERRALS_STORE_FILE)) {
        const raw = fs.readFileSync(REFERRALS_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading referrals store:", err);
    }
    return {};
  }

  function saveStoredReferrals(store: Record<string, any[]>) {
    try {
      fs.writeFileSync(REFERRALS_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing referrals store:", err);
    }
  }

  function getTotalUserCount(): number {
    try {
      const tgUsers = Object.keys(getStoredTelegramUsers()).length;
      const lbUsers = getStoredLeaderboard().length;
      let refCount = 0;
      const refStore = getStoredReferrals();
      Object.values(refStore).forEach((arr) => {
        if (Array.isArray(arr)) refCount += arr.length;
      });
      return Math.max(1, tgUsers, lbUsers, refCount);
    } catch {
      return 1;
    }
  }

  // 15. Register Referred User API
  app.post("/api/referrals/register", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { refCode, userId, name, username, telegramId } = body || {};
    if (!refCode || !name) {
      return res.status(400).json({ success: false, error: "refCode and name are required" });
    }

    const cleanCode = String(refCode).trim().toUpperCase();
    const store = getStoredReferrals();
    const list = store[cleanCode] || [];

    const existingIndex = list.findIndex(
      (r: any) => (userId && r.id === userId) || (telegramId && r.telegramId === telegramId)
    );

    const nowStr = new Date().toLocaleDateString("bn-BD");

    if (existingIndex >= 0) {
      // update existing
      list[existingIndex].name = name;
      list[existingIndex].username = username ? (username.startsWith("@") ? username : `@${username}`) : list[existingIndex].username;
    } else {
      // add new referred friend with real details
      const newRefUser = {
        id: userId || `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        telegramId: telegramId || null,
        name: String(name).trim(),
        username: username ? (username.startsWith("@") ? username : `@${username}`) : "@user",
        joinedDate: nowStr,
        daysActive: 1,
        tasksCompleted: 1,
        status: "pending",
        rewardAmount: 100,
        isTransferredToMain: false,
        createdAt: Date.now(),
      };
      list.unshift(newRefUser);
    }

    store[cleanCode] = list;
    saveStoredReferrals(store);
    res.json({ success: true, referrals: list });
  });

  // 16. Get Referrals by Ref Code API
  app.get("/api/referrals", (req, res) => {
    const refCode = req.query.refCode as string;
    if (!refCode) {
      return res.status(400).json({ success: false, error: "refCode is required" });
    }
    const cleanCode = String(refCode).trim().toUpperCase();
    const store = getStoredReferrals();
    const list = store[cleanCode] || [];
    res.json({ success: true, referrals: list });
  });

  // 13. Register Telegram User
  app.post("/api/register-telegram-user", (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { chatId, firstName, username } = body || {};
    if (!chatId) {
      return res.status(400).json({ success: false, error: "chatId is required" });
    }
    const users = getStoredTelegramUsers();
    users[String(chatId)] = {
      chatId,
      firstName: firstName || "User",
      username: username || "",
      registeredAt: Date.now(),
    };
    saveStoredTelegramUsers(users);
    res.json({ success: true, registeredCount: Object.keys(users).length });
  });

  // 14. Send Telegram Notification API
  app.post("/api/notify-telegram", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { type, title, reward, message, link } = body || {};

    const sysSettings = getStoredSystemSettings() || {};
    const botToken = sysSettings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const channelId = sysSettings.telegramChannelUsername || sysSettings.telegramChannelUrl;

    if (type === "task" && sysSettings.notifyOnNewTask === false) {
      return res.json({ success: true, message: "Task notifications disabled in settings" });
    }
    if (type === "video" && sysSettings.notifyOnNewVideo === false) {
      return res.json({ success: true, message: "Video notifications disabled in settings" });
    }

    // Construct high-impact Telegram formatted HTML message
    let text = "";
    if (type === "task") {
      text = `<b>🔥 নতুন ইনকাম টাস্ক যুক্ত হয়েছে! (New Task Alert)</b>\n\n` +
        `<b>📌 শিরোনাম:</b> ${title || "নতুন টাস্ক"}\n` +
        `<b>💰 রিওয়ার্ড:</b> ৳${reward ? Number(reward).toFixed(2) : "2.50"} BDT\n\n` +
        `🚀 এখনই অ্যাপটি চালু করে টাস্ক সম্পন্ন করুন এবং ইনস্ট্যান্ট ক্যাশ ইনকাম করুন!`;
    } else if (type === "video") {
      text = `<b>🎬 নতুন মুভি/ক্লিপ ভিডিও যুক্ত হয়েছে! (New Video)</b>\n\n` +
        `<b>📌 ভিডিও শিরোনাম:</b> ${title || "নতুন ভিডিও"}\n` +
        `<b>🎁 বোনাস:</b> ৳${reward ? Number(reward).toFixed(2) : "3.00"} BDT\n\n` +
        `▶️ সম্পূর্ণ ভিডিও দেখে ক্যাশ টাকা অ্যাকাউন্টে যোগ করে নিন!`;
    } else {
      text = `<b>📢 অফিশিয়াল ঘোষণা (Announcement)</b>\n\n` +
        `<b>${title || "জরুরি আপডেট"}</b>\n` +
        `${message || "স্মার্ট আর্নিং বিডি অ্যাপে নতুন আপডেট এসেছে।"}`;
    }

    let dispatchedCount = 0;

    // Send to Telegram Channel and Users if Bot Token exists
    if (botToken) {
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "🚀 অ্যাপ চালু করে ইনকাম করুন (Open App)",
              url: link || sysSettings.telegramChannelUrl || "https://t.me",
            },
          ],
        ],
      };

      // 1. Send to Official Telegram Channel / Group
      if (channelId) {
        let cleanChannel = String(channelId).trim();
        if (cleanChannel.startsWith("https://t.me/")) {
          cleanChannel = "@" + cleanChannel.replace("https://t.me/", "").replace("/", "");
        }
        try {
          await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: cleanChannel,
              text,
              parse_mode: "HTML",
              reply_markup: replyMarkup,
            }),
          });
          dispatchedCount++;
        } catch (err) {
          console.error("Error sending notification to channel:", err);
        }
      }

      // 2. Send direct notification to registered users
      const users = getStoredTelegramUsers();
      const userList = Object.values(users);

      for (const u of userList) {
        if (!u.chatId) continue;
        try {
          await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: u.chatId,
              text,
              parse_mode: "HTML",
              reply_markup: replyMarkup,
            }),
          });
          dispatchedCount++;
        } catch (e) {
          // Ignore individual user dispatch errors
        }
      }
    }

    res.json({
      success: true,
      message: botToken
        ? `নোটিফিকেশন সফলভাবে পাঠানো হয়েছে (${dispatchedCount} টি চ্যানেল/ইউজার)`
        : "টেলিগ্রাম বট টোকেন সেট করা নেই, তাই অ্যাপের নোটিফিকেশন কিউ প্রসেস হয়েছে।",
      dispatchedCount,
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

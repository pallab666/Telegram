import os

server_ts = """
import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

let db: any;
try {
  const rawConfig = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8");
  const firebaseConfig = JSON.parse(rawConfig);
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
} catch (e) {
  console.error("Firebase config missing", e);
}

async function getStoredData(key: string, defaultValue: any) {
  if (!db) return defaultValue;
  try {
    const snap = await getDoc(doc(db, "app_data", key));
    if (snap.exists()) return snap.data().value;
  } catch (err) {
    console.error("Firebase read error", err);
  }
  return defaultValue;
}

async function saveStoredData(key: string, value: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, "app_data", key), { value });
  } catch (err) {
    console.error("Firebase write error", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.text({ type: ["text/plain", "application/json"] }));

  interface PresenceSession {
    lastSeen: number;
    userId?: string;
    username?: string;
    name?: string;
    ip?: string;
  }

  const activeSessions = new Map<string, PresenceSession>();

  const pruneSessions = () => {
    const cutoff = Date.now() - 15000;
    for (const [id, session] of activeSessions.entries()) {
      if (session.lastSeen < cutoff) {
        activeSessions.delete(id);
      }
    }
  };

  const getTotalUserCount = async () => {
    try {
      const tgUsers = Object.keys(await getStoredData('telegramUsers', {})).length;
      const refStore = await getStoredData('referrals', {});
      let refCount = 0;
      Object.values(refStore).forEach((arr: any) => {
        if (Array.isArray(arr)) refCount += arr.length;
      });
      return Math.max(1, tgUsers, refCount);
    } catch {
      return 1;
    }
  };

  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/presence/heartbeat", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
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
    res.json({
      success: true,
      onlineCount: Math.max(1, activeSessions.size),
      totalUsers: await getTotalUserCount(),
      timestamp: Date.now(),
    });
  });

  app.post("/api/presence/leave", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { clientId } = body || {};
    if (clientId) activeSessions.delete(clientId);
    pruneSessions();
    res.json({
      success: true,
      onlineCount: Math.max(1, activeSessions.size),
      totalUsers: await getTotalUserCount(),
    });
  });

  app.get("/api/presence/count", async (req, res) => {
    pruneSessions();
    res.json({
      onlineCount: Math.max(1, activeSessions.size),
      totalUsers: await getTotalUserCount(),
      timestamp: Date.now(),
    });
  });

  app.get("/api/presence/users", async (req, res) => {
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

  setInterval(pruneSessions, 10000);

  // Videos
  app.get("/api/videos", async (req, res) => {
    const videos = await getStoredData('videos', []);
    res.json({ success: true, videos });
  });

  app.post("/api/videos", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { title, category, duration, reward, thumbnailUrl, videoUrl, views } = body || {};
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, error: "Title and Video URL are required" });
    }
    const videos = await getStoredData('videos', []);
    const newVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      category: category || "all",
      duration: Number(duration) || 30,
      reward: Number(reward) || 3,
      thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&q=80&w=400",
      videoUrl: String(videoUrl).trim(),
      views: views || "0",
      watched: false,
      createdAt: Date.now(),
    };
    videos.unshift(newVideo);
    await saveStoredData('videos', videos);
    res.json({ success: true, video: newVideo, videos });
  });

  app.delete("/api/videos/:id", async (req, res) => {
    const { id } = req.params;
    let videos = await getStoredData('videos', []);
    videos = videos.filter((v: any) => v.id !== id);
    await saveStoredData('videos', videos);
    res.json({ success: true, videos });
  });

  app.post("/api/videos/:id/view", async (req, res) => {
    const { id } = req.params;
    let videos = await getStoredData('videos', []);
    let updatedVideo: any = null;
    videos = videos.map((v: any) => {
      if (v.id === id) {
        let currentViews = 0;
        if (typeof v.viewCount === "number") currentViews = v.viewCount;
        else if (typeof v.views === "number") currentViews = v.views;
        else if (typeof v.views === "string") {
          const parsed = parseInt(v.views.replace(/[^0-9]/g, ""), 10);
          currentViews = isNaN(parsed) ? 0 : parsed;
        }
        const newCount = currentViews + 1;
        updatedVideo = { ...v, viewCount: newCount, views: newCount };
        return updatedVideo;
      }
      return v;
    });
    await saveStoredData('videos', videos);
    res.json({ success: true, video: updatedVideo });
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    const tasks = await getStoredData('tasks', []);
    res.json({ success: true, tasks });
  });

  app.post("/api/tasks", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body && Array.isArray(body.tasks)) {
      await saveStoredData('tasks', body.tasks);
      return res.json({ success: true, tasks: body.tasks });
    }
    return res.status(400).json({ success: false });
  });

  // Ad Config
  app.get("/api/ad-config", async (req, res) => {
    const config = await getStoredData('adConfig', null);
    res.json({ success: true, config });
  });

  app.post("/api/ad-config", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body && body.config) {
      await saveStoredData('adConfig', body.config);
      return res.json({ success: true, config: body.config });
    }
    return res.status(400).json({ success: false });
  });

  // Announcement
  app.get("/api/announcement", async (req, res) => {
    const announcement = await getStoredData('announcement', null);
    res.json({ success: true, announcement });
  });

  app.post("/api/announcement", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body && body.announcement) {
      await saveStoredData('announcement', body.announcement);
      return res.json({ success: true, announcement: body.announcement });
    }
    return res.status(400).json({ success: false });
  });

  // System Settings
  app.get("/api/system-settings", async (req, res) => {
    const settings = await getStoredData('systemSettings', null);
    res.json({ success: true, settings });
  });

  app.post("/api/system-settings", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body && body.settings) {
      await saveStoredData('systemSettings', body.settings);
      return res.json({ success: true, settings: body.settings });
    }
    return res.status(400).json({ success: false });
  });

  // Withdrawals
  app.get("/api/withdrawals", async (req, res) => {
    const withdrawals = await getStoredData('withdrawals', []);
    res.json({ success: true, withdrawals });
  });

  app.post("/api/withdrawals", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { amount, method, accountNumber, accountType, userId, username, name } = body || {};
    if (!amount || !method || !accountNumber) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }
    const withdrawals = await getStoredData('withdrawals', []);
    const newW = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toLocaleDateString("bn-BD"),
      method: String(method),
      accountNumber: String(accountNumber),
      accountType: accountType || "Personal",
      amount: Number(amount),
      status: "Pending",
      userId: userId || "Unknown",
      username: username || "Unknown",
      name: name || "Unknown User",
      createdAt: Date.now(),
    };
    withdrawals.unshift(newW);
    await saveStoredData('withdrawals', withdrawals);
    res.json({ success: true, withdrawal: newW, withdrawals });
  });

  app.post("/api/withdrawals/:id/approve", async (req, res) => {
    const { id } = req.params;
    let withdrawals = await getStoredData('withdrawals', []);
    withdrawals = withdrawals.map((w: any) => w.id === id ? { ...w, status: "Paid" } : w);
    await saveStoredData('withdrawals', withdrawals);
    res.json({ success: true, withdrawals });
  });

  app.post("/api/withdrawals/:id/reject", async (req, res) => {
    const { id } = req.params;
    let withdrawals = await getStoredData('withdrawals', []);
    withdrawals = withdrawals.map((w: any) => w.id === id ? { ...w, status: "Rejected" } : w);
    await saveStoredData('withdrawals', withdrawals);
    res.json({ success: true, withdrawals });
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const leaderboard = await getStoredData('leaderboard', []);
    res.json({ success: true, leaderboard });
  });

  app.post("/api/leaderboard", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body && Array.isArray(body.leaderboard)) {
      await saveStoredData('leaderboard', body.leaderboard);
      return res.json({ success: true, leaderboard: body.leaderboard });
    }
    return res.status(400).json({ success: false });
  });

  // Referrals
  app.post("/api/referrals/register", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { refCode, userId, name, username, telegramId } = body || {};
    if (!refCode || !name) {
      return res.status(400).json({ success: false, error: "refCode and name are required" });
    }
    const cleanCode = String(refCode).trim().toUpperCase();
    const store = await getStoredData('referrals', {});
    const list = store[cleanCode] || [];
    const existingIndex = list.findIndex((r: any) => (userId && r.id === userId) || (telegramId && r.telegramId === telegramId));
    if (existingIndex >= 0) {
      list[existingIndex].name = name;
      if (username) list[existingIndex].username = username.startsWith("@") ? username : `@${username}`;
    } else {
      list.unshift({
        id: userId || `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        telegramId: telegramId || null,
        name: String(name).trim(),
        username: username ? (username.startsWith("@") ? username : `@${username}`) : "@user",
        joinedDate: new Date().toLocaleDateString("bn-BD"),
        daysActive: 1,
        tasksCompleted: 1,
        status: "pending",
        rewardAmount: 100,
        isTransferredToMain: false,
        createdAt: Date.now(),
      });
    }
    store[cleanCode] = list;
    await saveStoredData('referrals', store);
    res.json({ success: true, referrals: list });
  });

  app.get("/api/referrals", async (req, res) => {
    const refCode = req.query.refCode as string;
    if (!refCode) return res.status(400).json({ success: false, error: "refCode is required" });
    const store = await getStoredData('referrals', {});
    const list = store[String(refCode).trim().toUpperCase()] || [];
    res.json({ success: true, referrals: list });
  });

  // Telegram Users
  app.post("/api/register-telegram-user", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { chatId, firstName, username } = body || {};
    if (!chatId) return res.status(400).json({ success: false, error: "chatId is required" });
    const users = await getStoredData('telegramUsers', {});
    users[String(chatId)] = {
      chatId,
      firstName: firstName || "User",
      username: username || "",
      registeredAt: Date.now(),
    };
    await saveStoredData('telegramUsers', users);
    res.json({ success: true, registeredCount: Object.keys(users).length });
  });

  // Notifications
  app.post("/api/notify-telegram", async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { type, title, reward, message, link } = body || {};
    const sysSettings = (await getStoredData('systemSettings', null)) || {};
    const botToken = sysSettings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const channelId = sysSettings.telegramChannelUsername || sysSettings.telegramChannelUrl;
    
    if (type === "task" && sysSettings.notifyOnNewTask === false) return res.json({ success: true, message: "Task notifications disabled in settings" });
    if (type === "video" && sysSettings.notifyOnNewVideo === false) return res.json({ success: true, message: "Video notifications disabled in settings" });

    let text = "";
    if (type === "task") {
      text = `<b>🔥 নতুন ইনকাম টাস্ক যুক্ত হয়েছে! (New Task Alert)</b>\n\n<b>📌 শিরোনাম:</b> ${title || "নতুন টাস্ক"}\n<b>💰 রিওয়ার্ড:</b> ৳${reward ? Number(reward).toFixed(2) : "2.50"} BDT\n\n🚀 এখনই অ্যাপটি চালু করে টাস্ক সম্পন্ন করুন এবং ইনস্ট্যান্ট ক্যাশ ইনকাম করুন!`;
    } else if (type === "video") {
      text = `<b>🎬 নতুন মুভি/ক্লিপ ভিডিও যুক্ত হয়েছে! (New Video)</b>\n\n<b>📌 ভিডিও শিরোনাম:</b> ${title || "নতুন ভিডিও"}\n<b>🎁 বোনাস:</b> ৳${reward ? Number(reward).toFixed(2) : "3.00"} BDT\n\n▶️ সম্পূর্ণ ভিডিও দেখে ক্যাশ টাকা অ্যাকাউন্টে যোগ করে নিন!`;
    } else {
      text = `<b>📢 অফিশিয়াল ঘোষণা (Announcement)</b>\n\n<b>${title || "জরুরি আপডেট"}</b>\n${message || "স্মার্ট আর্নিং বিডি অ্যাপে নতুন আপডেট এসেছে।"}`;
    }

    let dispatchedCount = 0;
    if (botToken) {
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const replyMarkup = { inline_keyboard: [[{ text: "🚀 অ্যাপ চালু করে ইনকাম করুন (Open App)", url: link || sysSettings.telegramChannelUrl || "https://t.me" }]] };
      
      if (channelId) {
        let cleanChannel = String(channelId).trim();
        if (cleanChannel.startsWith("https://t.me/")) cleanChannel = "@" + cleanChannel.replace("https://t.me/", "").replace("/", "");
        try {
          await fetch(tgUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: cleanChannel, text, parse_mode: "HTML", reply_markup: replyMarkup }) });
          dispatchedCount++;
        } catch (err) {}
      }
      
      const users = await getStoredData('telegramUsers', {});
      for (const u of Object.values(users) as any[]) {
        if (!u.chatId) continue;
        try {
          await fetch(tgUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: u.chatId, text, parse_mode: "HTML", reply_markup: replyMarkup }) });
          dispatchedCount++;
        } catch (e) {}
      }
    }
    res.json({ success: true, message: botToken ? `Sent to ${dispatchedCount}` : "No bot token", dispatchedCount });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => { console.log(`Server running on http://0.0.0.0:${PORT}`); });
}

startServer();
"""

with open("server.ts", "w") as f:
    f.write(server_ts)


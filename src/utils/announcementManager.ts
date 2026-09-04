export interface BroadcastAnnouncement {
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

const STORAGE_KEY = "smart_earning_broadcast_announcement";
const SEEN_ID_KEY = "smart_earning_seen_announcement_id";

export const DEFAULT_ANNOUNCEMENT: BroadcastAnnouncement = {
  id: "notice_default_v1",
  title: "🎉 মেগা রিওয়ার্ড ইভেন্ট চলছে!",
  message:
    "সকল টাস্ক সম্পন্ন করে প্রতিদিন ১০০+ টাকা পর্যন্ত আয় করুন। সাথে বন্ধুদের রেফার করে পান নিশ্চিত ৩০% লাইফটাইম কমিশন!",
  badge: "মেগা অফার 🔥",
  linkUrl: "",
  linkText: "টাস্ক দেখুন",
  actionType: "event",
  enabled: true,
  updatedAt: Date.now(),
};

export function getLocalAnnouncement(): BroadcastAnnouncement {
  if (typeof window === "undefined") return DEFAULT_ANNOUNCEMENT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_ANNOUNCEMENT, ...parsed };
      }
    }
  } catch (e) {
    console.error("Failed to parse announcement from localStorage", e);
  }
  return DEFAULT_ANNOUNCEMENT;
}

export function saveLocalAnnouncement(announcement: BroadcastAnnouncement) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcement));
  } catch (e) {}

  // Sync with server so all users receive the announcement
  try {
    fetch("/api/announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement }),
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to push announcement to server:", err);
  }
}

export async function fetchAnnouncementFromServer(): Promise<BroadcastAnnouncement> {
  try {
    const res = await fetch(`/api/announcement?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.announcement) {
        saveLocalAnnouncement(data.announcement);
        return data.announcement;
      }
    }
  } catch (err) {
    console.warn("Could not fetch announcement from server, using local:", err);
  }
  return getLocalAnnouncement();
}

export function isAnnouncementDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seenId = localStorage.getItem(SEEN_ID_KEY);
    return seenId === id;
  } catch (e) {
    return false;
  }
}

export function markAnnouncementDismissed(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_ID_KEY, id);
  } catch (e) {}
}

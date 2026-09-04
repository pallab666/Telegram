/**
 * Real-time Online Users Presence System
 * Tracks actual connected clients/users via server heartbeat,
 * BroadcastChannel inter-tab synchronization, and unload beacons.
 */

interface PresenceUserPayload {
  userId?: string | number;
  username?: string;
  name?: string;
}

// Generate or retrieve a persistent client/tab identifier for this browser session
function getOrCreateClientId(): string {
  try {
    let id = sessionStorage.getItem('smart_earning_client_id');
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('smart_earning_client_id', id);
    }
    return id;
  } catch {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Local presence store for inter-tab sync
const LOCAL_TABS_KEY = 'smart_earning_active_local_tabs';

function recordLocalTabPresence(clientId: string) {
  try {
    const raw = localStorage.getItem(LOCAL_TABS_KEY);
    const tabs: Record<string, number> = raw ? JSON.parse(raw) : {};
    tabs[clientId] = Date.now();
    // Prune tabs not seen in 15 seconds
    const cutoff = Date.now() - 15000;
    for (const [id, lastSeen] of Object.entries(tabs)) {
      if (lastSeen < cutoff) {
        delete tabs[id];
      }
    }
    localStorage.setItem(LOCAL_TABS_KEY, JSON.stringify(tabs));
    return Object.keys(tabs).length;
  } catch {
    return 1;
  }
}

function removeLocalTabPresence(clientId: string) {
  try {
    const raw = localStorage.getItem(LOCAL_TABS_KEY);
    if (!raw) return 1;
    const tabs: Record<string, number> = JSON.parse(raw);
    delete tabs[clientId];
    localStorage.setItem(LOCAL_TABS_KEY, JSON.stringify(tabs));
    return Math.max(1, Object.keys(tabs).length);
  } catch {
    return 1;
  }
}

function getLocalActiveTabCount(): number {
  try {
    const raw = localStorage.getItem(LOCAL_TABS_KEY);
    if (!raw) return 1;
    const tabs: Record<string, number> = JSON.parse(raw);
    const cutoff = Date.now() - 15000;
    const active = Object.values(tabs).filter((t) => t >= cutoff);
    return Math.max(1, active.length);
  } catch {
    return 1;
  }
}

export interface PresenceTrackerOptions extends PresenceUserPayload {
  onCountChange: (count: number) => void;
  onTotalUsersChange?: (total: number) => void;
}

/**
 * Initializes real-time presence tracking for the current user/tab
 */
export function initPresenceTracker(options: PresenceTrackerOptions): () => void {
  const clientId = getOrCreateClientId();
  let isDestroyed = false;
  let broadcastChannel: BroadcastChannel | null = null;

  // Track locally first
  const initialLocalCount = recordLocalTabPresence(clientId);
  options.onCountChange(initialLocalCount);

  // Setup BroadcastChannel if supported for immediate multi-tab updates
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel('smart_earning_presence_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'ONLINE_COUNT_UPDATE' && typeof event.data.count === 'number') {
          options.onCountChange(Math.max(1, event.data.count));
          if (typeof event.data.totalUsers === 'number' && options.onTotalUsersChange) {
            options.onTotalUsersChange(Math.max(1, event.data.totalUsers));
          }
        } else if (event.data?.type === 'PING') {
          // Respond to tab ping
          recordLocalTabPresence(clientId);
        }
      };
      broadcastChannel.postMessage({ type: 'PING' });
    } catch {
      // Ignore BroadcastChannel errors
    }
  }

  // Heartbeat function to sync with backend server
  const sendHeartbeat = async () => {
    if (isDestroyed) return;

    recordLocalTabPresence(clientId);

    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          userId: options.userId,
          username: options.username,
          name: options.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.onlineCount === 'number') {
          const count = Math.max(1, data.onlineCount);
          options.onCountChange(count);
          if (typeof data.totalUsers === 'number' && options.onTotalUsersChange) {
            options.onTotalUsersChange(Math.max(1, data.totalUsers));
          }
          broadcastChannel?.postMessage({
            type: 'ONLINE_COUNT_UPDATE',
            count,
            totalUsers: data.totalUsers,
          });
          return;
        }
      }
    } catch {
      // Backend not yet ready or offline; fallback to active local tabs
      const localCount = getLocalActiveTabCount();
      options.onCountChange(localCount);
    }
  };

  // Immediate first heartbeat
  sendHeartbeat();

  // Heartbeat interval every 6 seconds
  const intervalId = setInterval(sendHeartbeat, 6000);

  // Window visibility listener: when tab gains focus, ping immediately
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Leave handler on tab close or navigation
  const handleUnload = () => {
    removeLocalTabPresence(clientId);
    const payload = JSON.stringify({ clientId });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/presence/leave', blob);
    } else {
      fetch('/api/presence/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  // Listen to storage event as backup cross-tab sync
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_TABS_KEY) {
      const localCount = getLocalActiveTabCount();
      options.onCountChange(localCount);
    }
  };
  window.addEventListener('storage', handleStorage);

  // Cleanup function
  return () => {
    isDestroyed = true;
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {
        // Ignore
      }
    }
    handleUnload();
  };
}

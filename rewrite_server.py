import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add Firebase imports
firebase_imports = """
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
"""

content = content.replace('const activeSessions = new Map<string, PresenceSession>();', firebase_imports + '\n  const activeSessions = new Map<string, PresenceSession>();')

# Replace the specific file-based functions
def remove_func(name):
    global content
    pattern = r'(//.*?Store.*?[\r\n]+)?const ' + name.replace('getStored', '').upper() + r'_[A-Z_]+ = path\.join[^\n]+;[\r\n]+function ' + name + r'\(\)[^}]+}[^}]+}[\r\n]+'
    # Actually simpler: just replace everything between 'function getStoredXXX' and the end of 'saveStoredXXX'
    pass

# We will just rewrite the API handlers to use await getStoredData and await saveStoredData.
# First, change app.get/post/delete to async
content = re.sub(r'app\.(get|post|delete)\("([^"]+)", \(req, res\) => {', r'app.\1("\2", async (req, res) => {', content)

# Now replace the calls
# Videos
content = re.sub(r'getStoredVideos\(\)', r"(await getStoredData('videos', []))", content)
content = re.sub(r'saveStoredVideos\(([^)]+)\)', r"await saveStoredData('videos', \1)", content)

# Tasks
content = re.sub(r'getStoredTasks\(\)', r"(await getStoredData('tasks', []))", content)
content = re.sub(r'saveStoredTasks\(([^)]+)\)', r"await saveStoredData('tasks', \1)", content)

# AdConfig
content = re.sub(r'getStoredAdConfig\(\)', r"(await getStoredData('adConfig', null))", content)
content = re.sub(r'saveStoredAdConfig\(([^)]+)\)', r"await saveStoredData('adConfig', \1)", content)

# Announcement
content = re.sub(r'getStoredAnnouncement\(\)', r"(await getStoredData('announcement', null))", content)
content = re.sub(r'saveStoredAnnouncement\(([^)]+)\)', r"await saveStoredData('announcement', \1)", content)

# System Settings
content = re.sub(r'getStoredSystemSettings\(\)', r"(await getStoredData('systemSettings', null))", content)
content = re.sub(r'saveStoredSystemSettings\(([^)]+)\)', r"await saveStoredData('systemSettings', \1)", content)

# Withdrawals
content = re.sub(r'getStoredWithdrawals\(\)', r"(await getStoredData('withdrawals', []))", content)
content = re.sub(r'saveStoredWithdrawals\(([^)]+)\)', r"await saveStoredData('withdrawals', \1)", content)

# Referrals
content = re.sub(r'getStoredReferrals\(\)', r"(await getStoredData('referrals', {}))", content)
content = re.sub(r'saveStoredReferrals\(([^)]+)\)', r"await saveStoredData('referrals', \1)", content)

# Telegram Users
content = re.sub(r'getStoredTelegramUsers\(\)', r"(await getStoredData('telegramUsers', {}))", content)
content = re.sub(r'saveStoredTelegramUsers\(([^)]+)\)', r"await saveStoredData('telegramUsers', \1)", content)

with open('server.ts', 'w') as f:
    f.write(content)

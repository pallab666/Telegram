export function generateUniqueReferralCode(info?: { telegramId?: number; username?: string; name?: string }): string {
  if (info?.username && info.username.trim().length >= 3) {
    const clean = info.username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 3) return clean.slice(0, 10);
  }
  if (info?.telegramId) {
    return `REF${info.telegramId}`;
  }
  if (info?.name) {
    const firstName = info.name.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (firstName.length >= 3) {
      const randDigits = Math.floor(100 + Math.random() * 900);
      return `${firstName}${randDigits}`;
    }
  }
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SE${randomNum}`;
}

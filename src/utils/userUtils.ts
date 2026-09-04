export function generateUniqueReferralCode(info?: { telegramId?: number; username?: string; name?: string }): string {
  if (info?.telegramId) {
    if (info.username && info.username.trim().length >= 2) {
      const cleanUser = info.username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanUser.length >= 2) {
        return `${cleanUser}_${info.telegramId}`;
      }
    }
    if (info.name && info.name.trim().length >= 2) {
      const cleanName = info.name.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanName.length >= 2) {
        return `${cleanName}_${info.telegramId}`;
      }
    }
    return `REF_${info.telegramId}`;
  }

  if (info?.username && info.username.trim().length >= 2) {
    const clean = info.username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 2) {
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      return `${clean}_${randDigits}`;
    }
  }

  if (info?.name) {
    const firstName = info.name.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (firstName.length >= 2) {
      const randDigits = Math.floor(10000 + Math.random() * 90000);
      return `${firstName}_${randDigits}`;
    }
  }

  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SE_${randomNum}`;
}

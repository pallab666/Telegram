import { openAdLink } from './telegram';

export interface AdminAdConfig {
  adsterraUrl1: string;
  adsterraUrl2: string;
  monetagUrl1: string;
  monetagUrl2: string;
  rotationStrategy: 'alternate' | 'random' | 'adsterra_only' | 'monetag_only' | 'cycle_all';
  triggerOnVideo: boolean;
  triggerOnSpin: boolean;
  triggerOnTask: boolean;
  minWithdraw: number;
  adminPin: string;
  adsterraImpressions: number;
  monetagImpressions: number;
  lastAdIndex: number;
}

export const DEFAULT_AD_CONFIG: AdminAdConfig = {
  adsterraUrl1: 'https://example.com/adsterra1',
  adsterraUrl2: 'https://example.com/adsterra2',
  monetagUrl1: 'https://example.com/monetag1',
  monetagUrl2: 'https://example.com/monetag2',
  rotationStrategy: 'cycle_all',
  triggerOnVideo: true,
  triggerOnSpin: true,
  triggerOnTask: false,
  minWithdraw: 1000,
  adminPin: '3048',
  adsterraImpressions: 0,
  monetagImpressions: 0,
  lastAdIndex: 0,
};

const STORAGE_KEY = 'smart_earning_ad_config';

export function getAdConfig(): AdminAdConfig {
  if (typeof window === 'undefined') return DEFAULT_AD_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old configs if necessary
      return { 
        ...DEFAULT_AD_CONFIG, 
        ...parsed,
        minWithdraw: parsed.minWithdraw === 50 ? 1000 : (parsed.minWithdraw || 1000),
        adsterraUrl1: parsed.adsterraUrl1 || parsed.adsterraUrl || DEFAULT_AD_CONFIG.adsterraUrl1,
        monetagUrl1: parsed.monetagUrl1 || parsed.monetagUrl || DEFAULT_AD_CONFIG.monetagUrl1,
      };
    }
  } catch (e) {
    console.error('Failed to parse ad config', e);
  }
  return DEFAULT_AD_CONFIG;
}

export function saveAdConfig(config: AdminAdConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save ad config', e);
  }
}

/**
 * Smart Ad Dispatcher:
 * Intelligently cycles between 4 Ad IDs (2 Adsterra + 2 Monetag)
 * to prevent duplicate ad impression penalties for users in the same location/IP.
 */
export function triggerSmartAd(triggerPoint: 'video' | 'spin' | 'task' = 'video'): {
  served: boolean;
  network?: 'adsterra' | 'monetag';
  url?: string;
} {
  const config = getAdConfig();

  // Check if ad trigger is enabled for this event
  if (triggerPoint === 'video' && !config.triggerOnVideo) return { served: false };
  if (triggerPoint === 'spin' && !config.triggerOnSpin) return { served: false };
  if (triggerPoint === 'task' && !config.triggerOnTask) return { served: false };

  // Gather available URLs
  const urls = [
    { type: 'adsterra' as const, url: config.adsterraUrl1 },
    { type: 'monetag' as const, url: config.monetagUrl1 },
    { type: 'adsterra' as const, url: config.adsterraUrl2 },
    { type: 'monetag' as const, url: config.monetagUrl2 },
  ].filter(u => u.url && u.url.trim().length > 5);

  if (urls.length === 0) {
    return { served: false };
  }

  // Find next ad
  let nextIndex = config.lastAdIndex + 1;
  if (nextIndex >= urls.length) {
    nextIndex = 0;
  }
  
  const selectedAd = urls[nextIndex];
  
  // Apply rotation strategies if specific ones are chosen instead of cycle_all
  let finalAd = selectedAd;
  
  if (config.rotationStrategy === 'adsterra_only') {
    const adsterraUrls = urls.filter(u => u.type === 'adsterra');
    if (adsterraUrls.length > 0) {
      const idx = (config.lastAdIndex + 1) % adsterraUrls.length;
      finalAd = adsterraUrls[idx];
    }
  } else if (config.rotationStrategy === 'monetag_only') {
    const monetagUrls = urls.filter(u => u.type === 'monetag');
    if (monetagUrls.length > 0) {
      const idx = (config.lastAdIndex + 1) % monetagUrls.length;
      finalAd = monetagUrls[idx];
    }
  } else if (config.rotationStrategy === 'random') {
    const randomIndex = Math.floor(Math.random() * urls.length);
    finalAd = urls[randomIndex];
  }

  // Update counters and last served
  const updatedConfig: AdminAdConfig = {
    ...config,
    lastAdIndex: nextIndex,
    adsterraImpressions: finalAd.type === 'adsterra' ? config.adsterraImpressions + 1 : config.adsterraImpressions,
    monetagImpressions: finalAd.type === 'monetag' ? config.monetagImpressions + 1 : config.monetagImpressions,
  };
  saveAdConfig(updatedConfig);

  // Open the chosen ad network direct link
  openAdLink(finalAd.url);

  return {
    served: true,
    network: finalAd.type,
    url: finalAd.url,
  };
}

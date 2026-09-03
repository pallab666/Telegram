import { openAdLink } from './telegram';

export interface AdminAdConfig {
  adsterraUrl: string;
  monetagUrl: string;
  rotationStrategy: 'alternate' | 'random' | 'adsterra_only' | 'monetag_only';
  triggerOnVideo: boolean;
  triggerOnSpin: boolean;
  triggerOnTask: boolean;
  minWithdraw: number;
  adminPin: string;
  adsterraImpressions: number;
  monetagImpressions: number;
  lastServedNetwork: 'adsterra' | 'monetag';
}

export const DEFAULT_AD_CONFIG: AdminAdConfig = {
  adsterraUrl: 'https://www.profitablecpmrate.com/r03h02w7b?key=adsterra_direct_demo',
  monetagUrl: 'https://otieuhoo.net/4/8392104?key=monetag_direct_demo',
  rotationStrategy: 'alternate',
  triggerOnVideo: true,
  triggerOnSpin: true,
  triggerOnTask: false,
  minWithdraw: 50,
  adminPin: '7788',
  adsterraImpressions: 0,
  monetagImpressions: 0,
  lastServedNetwork: 'monetag',
};

const STORAGE_KEY = 'smart_earning_ad_config';

export function getAdConfig(): AdminAdConfig {
  if (typeof window === 'undefined') return DEFAULT_AD_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_AD_CONFIG, ...parsed };
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
 * Intelligently alternates or rotates between Adsterra & Monetag
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

  const hasAdsterra = !!config.adsterraUrl && config.adsterraUrl.trim().length > 5;
  const hasMonetag = !!config.monetagUrl && config.monetagUrl.trim().length > 5;

  if (!hasAdsterra && !hasMonetag) {
    return { served: false };
  }

  let selectedNetwork: 'adsterra' | 'monetag' = 'adsterra';

  if (hasAdsterra && hasMonetag) {
    if (config.rotationStrategy === 'adsterra_only') {
      selectedNetwork = 'adsterra';
    } else if (config.rotationStrategy === 'monetag_only') {
      selectedNetwork = 'monetag';
    } else if (config.rotationStrategy === 'random') {
      selectedNetwork = Math.random() < 0.5 ? 'adsterra' : 'monetag';
    } else {
      // 'alternate' (Auto 50/50 round-robin to solve same location issue)
      selectedNetwork = config.lastServedNetwork === 'adsterra' ? 'monetag' : 'adsterra';
    }
  } else if (hasAdsterra) {
    selectedNetwork = 'adsterra';
  } else {
    selectedNetwork = 'monetag';
  }

  const targetUrl = selectedNetwork === 'adsterra' ? config.adsterraUrl : config.monetagUrl;

  // Update counters and last served
  const updatedConfig: AdminAdConfig = {
    ...config,
    lastServedNetwork: selectedNetwork,
    adsterraImpressions:
      selectedNetwork === 'adsterra'
        ? config.adsterraImpressions + 1
        : config.adsterraImpressions,
    monetagImpressions:
      selectedNetwork === 'monetag'
        ? config.monetagImpressions + 1
        : config.monetagImpressions,
  };

  saveAdConfig(updatedConfig);

  // Open the chosen ad network direct link
  openAdLink(targetUrl);

  return {
    served: true,
    network: selectedNetwork,
    url: targetUrl,
  };
}

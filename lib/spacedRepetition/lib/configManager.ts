// lib/spacedRepetition/lib/configManager.ts

import { SRSConfig } from '../types';
import { DEFAULT_CONFIG } from '../config';

export interface UserConfigOverride {
  beta: number;
  stabilityMultiplier: number;
  riskThreshold: number;
  maxConsecutiveEasy: number;
}

const CONFIG_STORAGE_KEY = 'srs_config_override';

export function saveUserConfig(config: UserConfigOverride): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function loadUserConfig(): UserConfigOverride | null {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load user SRS config:', error);
    return null;
  }
}

export function clearUserConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export function getMergedConfig(): SRSConfig {
  const userConfig = loadUserConfig();

  if (!userConfig) {
    return DEFAULT_CONFIG;
  }

  // Apply user overrides to default config
  return {
    ...DEFAULT_CONFIG,
    beta: userConfig.beta,
    hardGrowth: DEFAULT_CONFIG.hardGrowth * userConfig.stabilityMultiplier,
    goodGrowth: DEFAULT_CONFIG.goodGrowth * userConfig.stabilityMultiplier,
    easyGrowth: DEFAULT_CONFIG.easyGrowth * userConfig.stabilityMultiplier,
    // failShrink is not multiplied - it stays constant
    failShrink: DEFAULT_CONFIG.failShrink,
    riskThreshold: userConfig.riskThreshold,
    maxConsecutiveEasy: userConfig.maxConsecutiveEasy,
  };
}

export function getDefaultUserConfig(): UserConfigOverride {
  return {
    beta: DEFAULT_CONFIG.beta,
    stabilityMultiplier: 1.0,
    riskThreshold: DEFAULT_CONFIG.riskThreshold,
    maxConsecutiveEasy: DEFAULT_CONFIG.maxConsecutiveEasy,
  };
}
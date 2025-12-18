// lib/spacedRepetition/lib/configManager.ts

import { SRSConfig } from '../types';
import { DEFAULT_CONFIG } from '../config';

export interface UserConfigOverride {
  targetLearningCount?: number;
  learningSteps?: number[];
  maxGraduatingIntervalDays?: number;
  minInterleaveCount?: number;
  almostDueThresholdMs?: number;
}

const CONFIG_STORAGE_KEY = 'srs_config_v4';  // v4 for 5-step learning box

export function saveUserConfig(config: UserConfigOverride): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

export function loadUserConfig(): UserConfigOverride | null {
  if (typeof window === 'undefined') {
    return null;
  }

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
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
}

export function getMergedConfig(): SRSConfig {
  const userConfig = loadUserConfig();

  if (!userConfig) {
    return DEFAULT_CONFIG;
  }

  // Apply user overrides to default config
  return {
    targetLearningCount: userConfig.targetLearningCount ?? DEFAULT_CONFIG.targetLearningCount,
    learningSteps: userConfig.learningSteps ?? DEFAULT_CONFIG.learningSteps,
    maxGraduatingIntervalDays: userConfig.maxGraduatingIntervalDays ?? DEFAULT_CONFIG.maxGraduatingIntervalDays,
    minInterleaveCount: userConfig.minInterleaveCount ?? DEFAULT_CONFIG.minInterleaveCount,
    almostDueThresholdMs: userConfig.almostDueThresholdMs ?? DEFAULT_CONFIG.almostDueThresholdMs,
  };
}

export function getDefaultUserConfig(): UserConfigOverride {
  return {
    targetLearningCount: DEFAULT_CONFIG.targetLearningCount,
    learningSteps: DEFAULT_CONFIG.learningSteps,
    maxGraduatingIntervalDays: DEFAULT_CONFIG.maxGraduatingIntervalDays,
    minInterleaveCount: DEFAULT_CONFIG.minInterleaveCount,
    almostDueThresholdMs: DEFAULT_CONFIG.almostDueThresholdMs,
  };
}

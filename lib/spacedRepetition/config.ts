// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  beta: 0.3,
  hardGrowth: 0.2,
  goodGrowth: 0.6,
  easyGrowth: 1.4,
  failShrink: 0.5,
  riskThreshold: 0.1,
  maxConsecutiveEasy: 5,
  minStability: 0.1,
  maxStability: 365
};
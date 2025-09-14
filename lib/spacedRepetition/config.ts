// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  // Memory decay parameters
  beta: 1.0,           // Exponential decay curve
  minStability: 1,     // Minimum 1 step stability

  // Stability growth factors
  hardGrowth: 0.15,    // 15% growth for "hard"
  goodGrowth: 0.45,    // 45% growth for "good"
  easyGrowth: 8,       // 800% growth for "easy"

  // Failure parameters
  failShrink: 0.7,     // 70% reduction on failure

  // Card introduction
  introRiskThreshold: 0.30,       // Introduce when avg risk < 30%
  consecutiveEasyThreshold: 4      // Introduce after 4 easy grades
};
// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  // Risk calculation exponent - higher values make forgetting curve steeper
  // beta=1 means linear decay, beta<1 slower decay, beta>1 faster decay
  beta: 0.9,

  // Stability multipliers for different grades (how much memory strength changes)
  hardGrowth: 0.1,    // Hard: slight increase in stability (20% growth)
  goodGrowth: 0.4,    // Good: moderate increase in stability (60% growth)
  easyGrowth: 1,    // Easy: large increase in stability (100% growth)
  failShrink: 0.4,    // Fail: reduce stability by half (40% of original)

  // Card introduction thresholds
  riskThreshold: 0.45,      // Introduce new card when highest risk drops below 45%
  maxConsecutiveEasy: 4,   // Introduce new card after 5 consecutive easy grades

  // Stability bounds (in days)
  minStability: 1,  // Minimum interval between reviews (0.1 days = 2.4 hours)
  maxStability: 365,   // Maximum interval between reviews (1 year)
  initialStability: 1  // Starting stability for new cards (1 day)
};
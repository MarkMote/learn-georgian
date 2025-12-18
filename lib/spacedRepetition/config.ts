// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  // Learning box settings (soft target - can exceed if user wants to keep learning)
  targetLearningCount: 5,
  learningSteps: [
    1 * 60 * 1000,                // Step 0: 1 minute
    2 * 60 * 1000,                // Step 1: 2 minutes
    4 * 60 * 1000,                // Step 2: 4 minutes
    8 * 60 * 1000,                // Step 3: 8 minutes
    16 * 60 * 1000,               // Step 4: 16 minutes
  ],                              // After step 4, card moves to consolidation

  // Consolidation: same-day spacing before graduation
  consolidationSteps: [
    30 * 60 * 1000,               // Step 0: 30 minutes
    60 * 60 * 1000,               // Step 1: 1 hour
  ],                              // After step 1, card graduates to FSRS

  // Cap first FSRS interval to prevent newly graduated cards from being scheduled too far out
  maxGraduatingIntervalDays: 1,   // First FSRS review within 1 day max

  // Interleaving: must show at least 2 other cards before repeating
  minInterleaveCount: 2,

  // Practice mode: consider cards "almost due" if within 4 hours
  almostDueThresholdMs: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
};

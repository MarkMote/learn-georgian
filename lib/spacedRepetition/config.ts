// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  // Learning box settings
  targetLearningCount: 5,         // Keep 5 cards in the learning box
  learningSteps: [
    1 * 60 * 1000,                // Step 0: 1 minute
    10 * 60 * 1000,               // Step 1: 10 minutes
  ],                              // After step 1, card graduates to review

  // Interleaving: must show at least 2 other cards before repeating
  minInterleaveCount: 2,

  // Practice mode: consider cards "almost due" if within 4 hours
  almostDueThresholdMs: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
};

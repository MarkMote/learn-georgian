// lib/spacedRepetition/index.ts

// Export types
export type {
  WordData,
  CardState,
  DeckState,
  SRSConfig,
  Grade,
  DifficultyRating
} from './types';

// Export configuration
export { DEFAULT_CONFIG } from './config';

// Export main SRS functions
export { initializeDeck } from './initializeDeck';
export { updateStateOnGrade } from './updateStateOnGrade';
export { selectNextCard } from './selectNextCard';
export { introduceNewCard } from './introduceNewCard';
export { calculateDeckStats } from './calculateDeckStats';

// Export shared utility functions
export { calculateRisk } from './lib/calculateRisk';
export { updateStability } from './lib/updateStability';
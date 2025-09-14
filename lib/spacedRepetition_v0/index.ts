// lib/spacedRepetition/index.ts

// Main public API for spaced repetition system

// Export types
export type {
  Grade,
  Card,
  Deck,
  SRSConfig,
  ReviewSession,
  SessionAction,
  DeckStats,
  ReviewResult
} from './legacyTypes';

// Export configuration
export { DEFAULT_CONFIG } from './legacyTypes';

// Export core algorithm functions
export {
  reviewCard,
  createCard,
  processReview,
  calculateDeckStats,
  selectNextCard,
  forgettingRisk
} from './lib/algorithm';

// Export session management
export {
  initializeSession,
  processSessionAction,
  saveSession,
  loadSession,
  clearSession
} from './lib/session';
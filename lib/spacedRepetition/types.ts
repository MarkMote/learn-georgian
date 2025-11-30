// lib/spacedRepetition/types.ts

// Static word content - never changes
export interface WordData {
  key: string;
  word_key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
  priority: string;
  group: string;
  ExampleEnglish1?: string;
  ExampleGeorgian1?: string;
  tips?: string;
}

// Individual card SRS state
export interface CardState {
  key: string;           // Links to WordData.key
  stability: number;     // Memory strength (days until 90% recall)
  lastReviewStep: number;
  reviewCount: number;
  lapseCount: number;
  introducedAtStep: number;
  lastGrade?: Grade;     // Last grade given (0-3), optional for backwards compatibility
}

// Deck aggregate state
export interface DeckState {
  currentStep: number;
  currentCardKey: string | null;
  consecutiveEasyCount: number;
  stats: {
    averageRisk: number;
    cardsAtRisk: number;
  };
}

// SRS Configuration
export interface SRSConfig {
  // Memory model parameters
  beta: number;           // Forgetting curve steepness (default: 0.3)

  // Stability growth factors
  hardGrowth: number;     // Grade 1 (default: 0.2)
  goodGrowth: number;     // Grade 2 (default: 0.6)
  easyGrowth: number;     // Grade 3 (default: 1.4)

  // Failure handling
  failShrink: number;     // Grade 0 stability reduction (default: 0.5)

  // Card introduction
  riskThreshold: number;  // When to introduce new cards (default: 0.1)
  maxConsecutiveEasy: number; // Force new card after N easy (default: 5)

  // Limits
  minStability: number;   // Minimum card stability (default: 0.1)
  maxStability: number;   // Maximum card stability (default: 365)
  initialStability: number; // Starting stability for new cards (default: 1.0)
}

export type Grade = 0 | 1 | 2 | 3; // fail | hard | good | easy
export type DifficultyRating = "fail" | "hard" | "good" | "easy";
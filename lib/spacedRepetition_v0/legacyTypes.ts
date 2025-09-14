// lib/spacedRepetition/types.ts

// Core types for spaced repetition system
export type Grade = 0 | 1 | 2 | 3;

// Default configuration for legacy system
export const DEFAULT_CONFIG: SRSConfig = {
  // Memory model parameters
  beta: 0.3,

  // Stability growth factors
  hardGrowth: 0.2,
  goodGrowth: 0.6,
  easyGrowth: 1.4,

  // Failure handling
  failShrink: 0.5,

  // Card introduction
  introRiskThreshold: 0.30,
  consecutiveEasyThreshold: 4,

  // Limits
  minStability: 0.1,
  maxStability: 365
}; // fail, hard, good, easy

export interface Card<T = any> {
  id: string;
  data: T;
  stability: number;    // S >= 1, represents memory strength
  lastReviewStep: number;
  reviewCount: number;
  lapseCount: number;
  introducedAtStep: number;
}

export interface Deck<T = any> {
  cards: Card<T>[];
  currentStep: number;
}

export interface SRSConfig {
  // Memory decay parameters
  beta: number;         // 0.9-1.0, decay curve shape
  minStability: number; // minimum stability value

  // Stability growth factors
  hardGrowth: number;   // growth factor for "hard" grade
  goodGrowth: number;   // growth factor for "good" grade
  easyGrowth: number;   // growth factor for "easy" grade

  // Failure parameters
  failShrink: number;   // shrink factor on failure (0-1)

  // Card introduction
  introRiskThreshold: number;  // max average risk for introducing new cards
  consecutiveEasyThreshold: number; // consecutive easy grades to force introduction
}

export interface ReviewResult<T> {
  updatedCard: Card<T>;
  shouldIntroduceNew: boolean;
  nextCardId: string | null;
}

export interface DeckStats {
  totalCards: number;
  averageRisk: number;
  cardsAtRisk: number; // cards with >50% forgetting risk
}

// Session types for managing review state
export interface ReviewSession<T> {
  deck: Deck<T>;
  config: SRSConfig;
  currentCardId: string | null;
  consecutiveEasyCount: number;
  availableItems: T[]; // items not yet in deck
  stats: DeckStats;
}

// Actions for state updates
export type SessionAction<T> =
  | { type: 'GRADE_CARD'; grade: Grade }
  | { type: 'INTRODUCE_CARD'; item: T }
  | { type: 'SELECT_NEXT_CARD' }
  | { type: 'RESET_SESSION' }
  | { type: 'LOAD_SESSION'; session: ReviewSession<T> };
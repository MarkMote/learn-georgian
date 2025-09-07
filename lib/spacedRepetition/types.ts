export type DifficultyRating = "fail" | "hard" | "good" | "easy";

export interface ReviewCard<T = any> {
  data: T;
  rating: number; // 0-3 score
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  exampleIndex?: number; // For cards with multiple examples
}

export interface SpacedRepetitionConfig {
  // Ease factor bounds
  minEaseFactor: number;
  maxEaseFactor: number;
  initialEaseFactor: number;
  
  // Interval bounds
  minInterval: number;
  maxInterval: number;
  
  // Cognitive load settings
  cognitiveLoadThreshold: number;
  cognitiveLoadScalingFactor: number;
  cognitiveLoadBaseThreshold: number;
  
  // Introduction triggers
  performanceThreshold: number; // Average score needed to introduce new cards
  
  // Ease factor adjustments per rating
  easeAdjustments: {
    fail: number;
    hard: number;
    good: number;
    easy: number;
  };
  
  // Interval multipliers
  intervalMultipliers: {
    easy: number;
  };
}

export interface CardPriorityParams {
  lastSeenWeight: number;
  intervalWeight: number;
  ratingWeight: number;
}

export interface ReviewSessionState<T> {
  cards: ReviewCard<T>[];
  currentIndex: number;
  sessionStats?: {
    cardsReviewed: number;
    correctCount: number;
    failCount: number;
  };
}
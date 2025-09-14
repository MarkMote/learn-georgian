// Import and re-export from core types
import type { WordData, DifficultyRating } from '../../../lib/spacedRepetition/types';
export type { WordData, DifficultyRating };

export type ReviewMode = "normal" | "reverse" | "examples" | "examples-reverse";

export type ExampleMode = "off" | "on" | "tap" | "tap-en" | "tap-ka";

export interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  exampleIndex?: number; // For tracking which example is being shown
}
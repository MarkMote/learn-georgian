// app/morphology/deck/types.ts

export type MorphologyData = {
  markerType: string;
  marker: string;
  meaning: string;
  example1: string;
  example2: string;
  key: string; // unique key for the marker
};

export type DifficultyRating = "fail" | "hard" | "good" | "easy";

export interface KnownMarkerState {
  data: MorphologyData;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: number;
  lastReview: number;
  difficulty: DifficultyRating;
}

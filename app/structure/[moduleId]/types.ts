// app/structure/[moduleId]/types.ts

// Frame data from frames.csv
export type FrameData = {
  frame_id: string;
  stage_id: string;
  frame_name: string;
  slot_map: string;
  usage_summary: string;
  deep_grammar: string;
};

// Example data from frame_examples.csv (the flashcards)
export type FrameExampleData = {
  example_id: string;
  frame_id: string;
  english: string;
  georgian: string;
  context: string;
  usage_tip: string;
};

// Review modes for the deck
export type ReviewMode = "normal" | "reverse";

// Difficulty ratings for SRS
export type DifficultyRating = "easy" | "good" | "hard" | "fail";

// State for tracking each example in the SRS system
export interface KnownExampleState {
  data: FrameExampleData;
  frame: FrameData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

// Module progress for the main page
export interface ModuleProgress {
  seenCount: number;
  knownCount: number;
  totalCount: number;
}

export type ReviewMode = "normal" | "reverse" | "examples" | "examples-reverse";
export type ExampleMode = "off" | "on" | "tap" | "tap-en" | "tap-ka";
export type ExplanationMode = "off" | "on";

export type ChunkData = {
  chunk_key: string; // Unique identifier
  chunk_en: string;
  chunk_ka: string;
  explanation: string;
  example_en: string;
  example_ka: string;
};

export interface KnownChunkState {
  data: ChunkData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

export type DifficultyRating = "easy" | "good" | "hard" | "fail";
export interface PlayLine {
  id: string;
  speaker: string;
  georgian: string;
  english: string;
  type: 'dialogue' | 'narration';
}

export interface PlayData {
  title: string;
  author: string;
  lines: PlayLine[];
}

export interface KnownLineState {
  data: PlayLine;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

export type DifficultyRating = "easy" | "good" | "hard" | "fail";
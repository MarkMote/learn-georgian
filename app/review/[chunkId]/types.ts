export type ReviewMode = "normal" | "reverse" | "examples" | "examples-reverse";

export type WordData = {
  word_key: string;
  key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
  priority: string;
  group: string;
  ExampleEnglish1?: string;
  ExampleGeorgian1?: string;
};

export interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  exampleIndex?: number; // For tracking which example is being shown
}

export type DifficultyRating = "easy" | "good" | "hard" | "fail";
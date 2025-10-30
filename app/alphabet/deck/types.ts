// app/alphabet/deck/types.ts

export type AlphabetData = {
  georgianLetter: string;
  englishLetter: string;
  ipaSymbol: string;
  explanation: string;
  georgianExample: string;
  englishExample: string;
  translation: string;
  key: string; // unique key for the letter
};

export type DifficultyRating = "fail" | "hard" | "good" | "easy";

export interface KnownLetterState {
  data: AlphabetData;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: number;
  lastReview: number;
  difficulty: DifficultyRating;
}

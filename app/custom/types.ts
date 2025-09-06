export interface CustomWord {
  front: string;
  back: string;
  examplePreview?: string;
  exampleRevealed?: string;
  key: string;
}

export interface CustomWordData {
  data: CustomWord;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export type CustomReviewMode = 'normal' | 'reverse' | 'examples' | 'examples-reverse';
export type CustomExampleMode = "off" | "on" | "tap" | "tap-en" | "tap-ka";
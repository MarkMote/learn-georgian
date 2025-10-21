// app/admin/images/lib/promptGeneration.ts

import { WordData } from '@/lib/spacedRepetition/types';

/**
 * Generates a default prompt for image generation based on word data
 */
export function generateDefaultPrompt(word: WordData): string {
  // If there's an example sentence, use that for more context
  // if (word.ExampleEnglish1 && word.ExampleGeorgian1) {
  //   return `A simple, clear illustration depicting: ${word.ExampleEnglish1}`;
  // }

  // Otherwise, use the word itself with Georgian translation
  // return `A vivid, clear illustration of ${word.EnglishWord} (${word.GeorgianWord}).`;

  return `A vivid, clear illustration of the word ${word.EnglishWord} (${word.GeorgianWord}). Example: ${word.ExampleEnglish1}. Do not include any text in the image.`;
}

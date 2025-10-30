// app/alphabet/deck/utils/dataProcessing.ts

import Papa from 'papaparse';
import { AlphabetData, KnownLetterState } from '../types';

export function parseCSV(csvText: string): AlphabetData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any, index: number) => ({
    georgianLetter: row.georgianLetter || "",
    englishLetter: row.englishLetter || "",
    ipaSymbol: row.ipaSymbol || "",
    explanation: row.explanation || "",
    georgianExample: row.georgianExample || "",
    englishExample: row.englishExample || "",
    translation: row.translation || "",
    key: `letter_${index}`,
  }));
}

export function computePercentageScore(knownLetters: KnownLetterState[]): number {
  if (knownLetters.length === 0) return 0;

  const sum = knownLetters.reduce((acc, letter) => {
    if (letter.repetitions === 0) return acc;
    const baseScore = Math.min(letter.repetitions, 5) * 20;
    const factorBonus = Math.max(0, (letter.easeFactor - 1.3) * 20);
    const score = Math.min(100, baseScore + factorBonus);
    return acc + score;
  }, 0);

  return Math.round(sum / knownLetters.length);
}

export function getLetterProgress(
  knownLetters: KnownLetterState[]
): { unlocked: number; total: number } {
  const unlocked = knownLetters.filter(letter => letter.repetitions > 0).length;
  return { unlocked, total: knownLetters.length };
}

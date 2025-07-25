import { WordData, KnownWordState, DifficultyRating } from "../types";

export function parseCSV(csvText: string): WordData[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  
  const rows = lines.slice(1);

  return rows.map((row) => {
    const cols = row.split(",");
    return {
      word_key: cols[0],
      key: cols[1],
      img_key: cols[2],
      EnglishWord: cols[3],
      PartOfSpeech: cols[4],
      GeorgianWord: cols[5],
      hint: cols[6],
      priority: cols[7] || "",
      group: cols[8] || "",
    };
  });
}

export function difficultyToScore(difficulty: DifficultyRating): number {
  switch (difficulty) {
    case "easy":
      return 3;
    case "good":
      return 2;
    case "hard":
      return 1;
    case "fail":
      return 0;
  }
}

export function getVerbHint(word: WordData): string | null {
  const pos = word.PartOfSpeech.toLowerCase();
  if (!pos.includes("verb") || pos.includes("adverb")) {
    return null;
  }
  
  if (word.key.endsWith("_inf")) {
    return "____";
  }

  const firstWord = word.GeorgianWord.split(" ")[0];
  return `${firstWord} ____`;
}

export function getVerbBaseKey(word: WordData): string | null {
  const pos = word.PartOfSpeech.toLowerCase();
  if (!pos.includes("verb") || pos.includes("adverb")) {
    return null;
  }

  if (word.key.endsWith("_inf")) {
    return word.key.slice(0, -4);
  }

  const underscoreIdx = word.key.indexOf("_p");
  if (underscoreIdx > -1) {
    return word.key.slice(0, underscoreIdx);
  }
  
  return word.key;
}

export function getUniqueWordKeys(allWords: WordData[]): string[] {
  const seen = new Set<string>();
  const uniqueKeys: string[] = [];
  
  for (const word of allWords) {
    if (!seen.has(word.word_key)) {
      seen.add(word.word_key);
      uniqueKeys.push(word.word_key);
    }
  }
  
  return uniqueKeys;
}

export function getWordsForChunk(allWords: WordData[], chunkId: string, chunkSize: number = 100): WordData[] {
  const chunkNumber = parseInt(chunkId, 10);
  if (isNaN(chunkNumber) || chunkNumber < 1) {
    return [];
  }
  
  const uniqueWordKeys = getUniqueWordKeys(allWords);
  const startIndex = (chunkNumber - 1) * chunkSize;
  const endIndex = startIndex + chunkSize;
  const chunkWordKeys = new Set(uniqueWordKeys.slice(startIndex, endIndex));
  
  return allWords.filter(word => chunkWordKeys.has(word.word_key));
}

export function calculateCardPriority(card: KnownWordState): number {
  // Add safeguards against extreme values
  const safeInterval = Math.min(Math.max(card.interval || 1, 1), 365);
  const safeLastSeen = Math.max(card.lastSeen || 0, 0);
  const safeRating = Math.min(Math.max(card.rating || 0, 0), 3);
  
  const normalizedRating = safeRating / 3;
  const overdueFactor = safeLastSeen / safeInterval;
  const difficultyFactor = 1 + (1 - normalizedRating) * 2;

  // Cap the maximum priority to prevent extreme values
  const maxPriority = 1000;
  
  if (overdueFactor >= 1) {
    return Math.min(overdueFactor * difficultyFactor, maxPriority);
  }
  
  // Add a small base priority to prevent cards from getting stuck at 0 priority
  // This ensures cards that are not overdue still have a chance to be selected
  const basePriority = 0.01;
  return basePriority + (0.1 * overdueFactor * difficultyFactor);
}

export function computeOverallScore(knownWords: KnownWordState[]): number {
  if (knownWords.length === 0) return 0;
  const sum = knownWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
  return sum / knownWords.length;
}

export function computePercentageScore(knownWords: KnownWordState[], chunkWords: WordData[]): number {
  if (chunkWords.length === 0) return 0;
  
  const uniqueWordKeys = getUniqueWordKeys(chunkWords);
  const totalPossibleWords = uniqueWordKeys.length;
  
  if (totalPossibleWords === 0) return 0;
  
  const knownWordKeys = new Set(knownWords.map(kw => kw.data.word_key));
  let totalScore = 0;
  let scoredWordCount = 0;
  
  uniqueWordKeys.forEach(wordKey => {
    if (knownWordKeys.has(wordKey)) {
      const wordsWithThisKey = knownWords.filter(kw => kw.data.word_key === wordKey);
      const bestRating = Math.max(...wordsWithThisKey.map(kw => kw.rating));
      totalScore += bestRating / 3;
      scoredWordCount++;
    }
  });
  
  const averageScoreOfIntroduced = scoredWordCount > 0 ? totalScore / scoredWordCount : 0;
  const wordCoverage = scoredWordCount / totalPossibleWords;
  
  return Math.round(averageScoreOfIntroduced * wordCoverage * 100);
}

export function getWordProgress(knownWords: KnownWordState[], chunkWords: WordData[]): { unlocked: number; total: number } {
  const uniqueWordKeys = getUniqueWordKeys(chunkWords);
  const total = uniqueWordKeys.length;
  
  const knownWordKeys = new Set(knownWords.map(kw => kw.data.word_key));
  const unlocked = uniqueWordKeys.filter(wordKey => knownWordKeys.has(wordKey)).length;
  
  return { unlocked, total };
}
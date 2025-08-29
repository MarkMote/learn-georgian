import Papa from "papaparse";
import { ChunkData, KnownChunkState, DifficultyRating } from "../types";

export function parseCSV(csvText: string): ChunkData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any, index: number) => ({
    chunk_key: `chunk_${index}`, // Generate unique key based on row index
    chunk_en: row.chunk_en || "",
    chunk_ka: row.chunk_ka || "",
    explanation: row.explanation || "",
    example_en: row.example_en || "",
    example_ka: row.example_ka || "",
  }));
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

export function getUniqueChunkKeys(allChunks: ChunkData[]): string[] {
  return allChunks.map(chunk => chunk.chunk_key);
}

export function getChunksForSet(allChunks: ChunkData[], chunkId: string, chunkSize: number = 50): ChunkData[] {
  const chunkNumber = parseInt(chunkId, 10);
  if (isNaN(chunkNumber) || chunkNumber < 1) {
    return [];
  }
  
  const startIndex = (chunkNumber - 1) * chunkSize;
  const endIndex = startIndex + chunkSize;
  
  return allChunks.slice(startIndex, endIndex);
}

export function calculateCardPriority(card: KnownChunkState): number {
  const safeInterval = Math.min(Math.max(card.interval || 1, 1), 365);
  const safeLastSeen = Math.max(card.lastSeen || 0, 0);
  const safeRating = Math.min(Math.max(card.rating || 0, 0), 3);
  
  const normalizedRating = safeRating / 3;
  const overdueFactor = safeLastSeen / safeInterval;
  const difficultyFactor = 1 + (1 - normalizedRating) * 2;

  const maxPriority = 1000;
  
  if (overdueFactor >= 1) {
    return Math.min(overdueFactor * difficultyFactor, maxPriority);
  }
  
  const basePriority = 0.01;
  return basePriority + (0.1 * overdueFactor * difficultyFactor);
}

export function computeOverallScore(knownChunks: KnownChunkState[]): number {
  if (knownChunks.length === 0) return 0;
  const sum = knownChunks.reduce((acc, kc) => acc + kc.rating / 3, 0);
  return sum / knownChunks.length;
}

export function computePercentageScore(knownChunks: KnownChunkState[], chunkSet: ChunkData[]): number {
  if (chunkSet.length === 0) return 0;
  
  const totalPossibleChunks = chunkSet.length;
  
  if (totalPossibleChunks === 0) return 0;
  
  const knownChunkKeys = new Set(knownChunks.map(kc => kc.data.chunk_key));
  let totalScore = 0;
  let scoredChunkCount = 0;
  
  chunkSet.forEach(chunk => {
    const knownChunk = knownChunks.find(kc => kc.data.chunk_key === chunk.chunk_key);
    if (knownChunk) {
      totalScore += knownChunk.rating / 3;
      scoredChunkCount++;
    }
  });
  
  const averageScoreOfIntroduced = scoredChunkCount > 0 ? totalScore / scoredChunkCount : 0;
  const chunkCoverage = scoredChunkCount / totalPossibleChunks;
  
  return Math.round(averageScoreOfIntroduced * chunkCoverage * 100);
}

export function getChunkProgress(knownChunks: KnownChunkState[], chunkSet: ChunkData[]): { unlocked: number; total: number } {
  const total = chunkSet.length;
  const knownChunkKeys = new Set(knownChunks.map(kc => kc.data.chunk_key));
  const unlocked = chunkSet.filter(chunk => knownChunkKeys.has(chunk.chunk_key)).length;
  
  return { unlocked, total };
}
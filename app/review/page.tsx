// app/review/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type WordData = {
  word_key: string;
  key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
  priority: string;
  group: string;
};

type ChunkProgress = {
  score: number; // 0-100
  unlockedCount: number;
  totalCount: number;
};

const CHUNK_SIZE = 50;

function parseCSV(csvText: string): WordData[] {
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

function getUniqueWordKeys(allWords: WordData[]): string[] {
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

function getChunkCount(allWords: WordData[]): number {
  const uniqueWordKeys = getUniqueWordKeys(allWords);
  return Math.ceil(uniqueWordKeys.length / CHUNK_SIZE);
}

function getWordsForChunk(allWords: WordData[], chunkNumber: number): WordData[] {
  const uniqueWordKeys = getUniqueWordKeys(allWords);
  const startIndex = (chunkNumber - 1) * CHUNK_SIZE;
  const endIndex = startIndex + CHUNK_SIZE;
  const chunkWordKeys = new Set(uniqueWordKeys.slice(startIndex, endIndex));
  return allWords.filter(word => chunkWordKeys.has(word.word_key));
}

function loadChunkProgress(chunkNumber: number, chunkWords: WordData[]): ChunkProgress {
  const uniqueWordKeys = getUniqueWordKeys(chunkWords);
  const totalCount = uniqueWordKeys.length;

  // Try to load from localStorage (using 'normal' mode as default)
  const storageKey = `srs_simple_${chunkNumber}_normal`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return { score: 0, unlockedCount: 0, totalCount };
    }

    const data = JSON.parse(stored);
    const cardStates = data.cardStates || {};

    // Count unlocked words and calculate score
    const knownWordKeys = new Set<string>();
    let totalScore = 0;

    // Map card keys back to word_keys
    for (const [cardKey, cardState] of Object.entries(cardStates)) {
      const word = chunkWords.find(w => w.key === cardKey);
      if (word) {
        knownWordKeys.add(word.word_key);
        // Use lastGrade if available, default to 2
        const lastGrade = (cardState as any).lastGrade ?? 2;
        const ratingAsPercent = lastGrade <= 1 ? 0 : (lastGrade - 1) * 50;
        totalScore += ratingAsPercent;
      }
    }

    const unlockedCount = knownWordKeys.size;
    const score = unlockedCount > 0 ? Math.round(totalScore / unlockedCount) : 0;

    return { score, unlockedCount, totalCount };
  } catch (error) {
    console.warn("Failed to load chunk progress:", error);
    return { score: 0, unlockedCount: 0, totalCount };
  }
}

function getProgressColor(progressPercent: number): string {
  if (progressPercent < 10) {
    return "border-gray-600"; // Not started or barely started
  } else if (progressPercent >= 100) {
    return "border-green-500 bg-green-500/10"; // Complete
  } else if (progressPercent >= 80) {
    return "border-lime-500 bg-lime-500/10"; // Yellow-green
  } else {
    return "border-yellow-500 bg-yellow-500/10"; // In progress (10-79%)
  }
}

export default function ReviewHomePage() {
  const router = useRouter();
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [chunkCount, setChunkCount] = useState<number>(0);
  const [chunkProgress, setChunkProgress] = useState<Map<number, ChunkProgress>>(new Map());

  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        setChunkCount(getChunkCount(parsed));
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);

  // Load progress for all chunks once words are loaded
  useEffect(() => {
    if (allWords.length === 0 || chunkCount === 0) return;

    const progressMap = new Map<number, ChunkProgress>();
    for (let i = 1; i <= chunkCount; i++) {
      const chunkWords = getWordsForChunk(allWords, i);
      progressMap.set(i, loadChunkProgress(i, chunkWords));
    }
    setChunkProgress(progressMap);
  }, [allWords, chunkCount]);

  const handleChunkClick = (chunkNumber: number) => {
    router.push(`/review/${chunkNumber}`);
  };

  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium pt-1">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <h1 className={`text-3xl sm:text-4xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
          Core Vocabulary
        </h1>

        <p className="text-sm sm:text-base text-gray-400 mb-8 sm:mb-10 text-center max-w-md px-4">
          High-frequency Georgian words with images for visual learning. Each set contains {CHUNK_SIZE} words ordered by frequency. Progress is saved automatically in your browser.
        </p>

        <div className="flex flex-col space-y-6 w-full max-w-md px-4 sm:px-0">
          <div className="space-y-3">
            {chunkCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: chunkCount }, (_, index) => {
                  const chunkNumber = index + 1;
                  const startWord = index * CHUNK_SIZE + 1;
                  const endWord = Math.min((index + 1) * CHUNK_SIZE, getUniqueWordKeys(allWords).length);
                  const progress = chunkProgress.get(chunkNumber);
                  const progressPercent = progress && progress.totalCount > 0
                    ? Math.round((progress.unlockedCount / progress.totalCount) * 100)
                    : 0;
                  const colorClass = getProgressColor(progressPercent);

                  return (
                    <button
                      key={chunkNumber}
                      onClick={() => handleChunkClick(chunkNumber)}
                      className={`px-4 py-3 sm:py-4 text-center border rounded-lg text-sm sm:text-base hover:brightness-110 transition-all duration-150 ease-in-out cursor-pointer active:scale-98 ${colorClass}`}
                    >
                      Words {startWord}-{endWord}
                      {progressPercent > 0 && (
                        <span className="text-gray-400 ml-1">({progressPercent}%)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">Loading word sets...</div>
            )}
          </div>

          {/* Review All Words Button */}
          <div className="pt-6 border-t border-gray-700">
            <Link
              href="/all"
              className="block px-6 py-4 w-full text-center border border-slate-400 rounded-lg text-base sm:text-lg hover:bg-blue-600/10 transition-all duration-150 ease-in-out text-slate-300/90 font-medium active:scale-98"
            >
              View All Words
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

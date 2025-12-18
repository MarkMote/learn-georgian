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
  seenCount: number;      // Unique word_keys that have been introduced
  knownCount: number;     // Unique word_keys that are graduated or consolidation
  totalCount: number;     // Total unique word_keys in chunk
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
  // Total = all cards in chunk (including verb conjugations)
  const totalCount = chunkWords.length;

  const emptyProgress: ChunkProgress = {
    seenCount: 0,
    knownCount: 0,
    totalCount,
  };

  const storageKey = `srs_v3_${chunkNumber}_normal`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return emptyProgress;
    }

    const data = JSON.parse(stored);
    const cardStates = data.cardStates || {};

    // Count cards directly (not by word_key)
    let seenCount = 0;
    let knownCount = 0;

    for (const [cardKey, cardState] of Object.entries(cardStates)) {
      const word = chunkWords.find(w => w.key === cardKey);
      if (word) {
        seenCount++;
        const state = cardState as { phase?: string };
        const phase = state.phase || 'learning';
        if (phase === 'graduated' || phase === 'consolidation') {
          knownCount++;
        }
      }
    }

    return {
      seenCount,
      knownCount,
      totalCount,
    };
  } catch (error) {
    console.warn("Failed to load chunk progress:", error);
    return emptyProgress;
  }
}

// Count due words across all chunks
function countDueWords(chunkCount: number): number {
  const now = new Date();
  let dueCount = 0;

  for (let chunkNumber = 1; chunkNumber <= chunkCount; chunkNumber++) {
    const storageKey = `srs_v3_${chunkNumber}_normal`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) continue;

      const data = JSON.parse(stored);
      const cardStates = data.cardStates || {};

      for (const cardState of Object.values(cardStates)) {
        const state = cardState as { phase?: string; due?: string };
        const phase = state.phase || 'learning';
        // Only count graduated/consolidation cards that are due
        if ((phase === 'graduated' || phase === 'consolidation') && state.due) {
          const dueDate = new Date(state.due);
          if (dueDate <= now) {
            dueCount++;
          }
        }
      }
    } catch {
      continue;
    }
  }

  return dueCount;
}

export default function ReviewHomePage() {
  const router = useRouter();
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [chunkCount, setChunkCount] = useState<number>(0);
  const [chunkProgress, setChunkProgress] = useState<Map<number, ChunkProgress>>(new Map());
  const [dueCount, setDueCount] = useState<number>(0);

  // Reset body scroll styles (in case review page disabled them)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
  }, []);

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

    // Count due words
    setDueCount(countDueWords(chunkCount));
  }, [allWords, chunkCount]);

  const handleChunkClick = (chunkNumber: number) => {
    router.push(`/review/${chunkNumber}`);
  };

  // Calculate total stats across all chunks
  const totalStats = Array.from(chunkProgress.values()).reduce(
    (acc, progress) => ({
      seen: acc.seen + progress.seenCount,
      known: acc.known + progress.knownCount,
      total: acc.total + progress.totalCount,
    }),
    { seen: 0, known: 0, total: 0 }
  );

  const hasKnownWords = totalStats.known > 0;

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

        <p className="text-sm sm:text-base text-gray-400 mb-4 text-center max-w-md px-4">
          High-frequency Georgian words with images for visual learning. Each set contains 50-100 words.
        </p>

        {/* Progress Summary */}
        {totalStats.seen > 0 && (
          <div className="flex gap-6 mb-8 text-sm">
            <div className="text-center">
            <div className="text-gray-300 font-light text-sm"><span className="text-green-400 text-3xl font-bold pr-1">{totalStats.known}</span>/{totalStats.total}</div>
              <div className="text-gray-500">Words Learned</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300 font-light text-sm"><span className="text-blue-200 text-3xl font-bold pr-1">{totalStats.seen}</span>/{totalStats.total}</div>
              <div className="text-gray-500">Words Seen</div>
            </div>
          </div>
        )}

        

        <div className="flex flex-col space-y-6 w-full max-w-md px-4 sm:px-0">


          <div className="space-y-3">
            {chunkCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: chunkCount }, (_, index) => {
                  const chunkNumber = index + 1;
                  const progress = chunkProgress.get(chunkNumber);
                  const hasProgress = progress && progress.seenCount > 0;

                  return (
                    <button
                      key={chunkNumber}
                      onClick={() => handleChunkClick(chunkNumber)}
                      className="px-4 py-3 sm:py-4 min-h-[68px] text-center border border-gray-600 rounded-lg text-sm sm:text-base hover:bg-gray-800 hover:border-gray-500 transition-all duration-150 ease-in-out cursor-pointer active:scale-98 flex flex-col items-center justify-center"
                    >
                      <div>Set {chunkNumber}</div>
                      {hasProgress && (
                        <div className="text-xs text-gray-400 mt-1">
                          <span className="text-gray-300">{progress.knownCount}</span>
                          <span className="text-gray-400"> of {progress.totalCount} learned</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">Loading word sets...</div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-gray-700 space-y-3">
            {/* Review Due Words Button - prominent when words are due */}
            {hasKnownWords && dueCount > 0 && (
              <Link
                href="/review/practice"
                className="block px-6 py-4 w-full text-center bg-amber-950/50 border border-amber-400/70 rounded-lg text-base hover:bg-amber-900/40 transition-all
                duration-150 ease-in-out font-medium active:scale-98"
              >
                <div className="text-amber-300 text-lg">{dueCount} words due for review</div>
                <div className="text-amber-400/70 text-sm mt-1">Tap to review now</div>
              </Link>
            )}
            {/* Review Known Words Button - subtle when no words due */}
            {hasKnownWords && dueCount === 0 && (
              <Link
                href="/review/practice"
                className="block px-6 py-4 w-full text-center bg-green-950/30 border border-green-400/50 rounded-lg text-base hover:bg-green-900/30 transition-all
                duration-150 ease-in-out text-green-300/80 font-medium active:scale-98"
              >
                <div>All caught up!</div>
                <div className="text-green-400/60 text-sm mt-1">Practice {totalStats.known} known words</div>
              </Link>
            )}
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

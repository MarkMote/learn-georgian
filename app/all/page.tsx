// app/all/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { WordData, KnownWordState } from "../review/[chunkId]/types";
import { parseCSV } from "../review/[chunkId]/utils/dataProcessing";
import WordCard from "./components/WordCard";
import Link from "next/link";
import BackHeader from "../components/BackHeader";

interface WordWithProgress {
  word: WordData;
  progress: KnownWordState | null;
  bestRating: number;
}

function aggregateProgressData(): Map<string, KnownWordState> {
  const progressMap = new Map<string, KnownWordState>();
  
  // Check all localStorage keys for review states
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('reviewState_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.knownWords && Array.isArray(data.knownWords)) {
          data.knownWords.forEach((knownWord: KnownWordState) => {
            const wordKey = knownWord.data.key;
            const existing = progressMap.get(wordKey);
            
            // Keep the version with better rating, or higher repetitions if same rating
            if (!existing || 
                knownWord.rating > existing.rating || 
                (knownWord.rating === existing.rating && knownWord.repetitions > existing.repetitions)) {
              progressMap.set(wordKey, knownWord);
            }
          });
        }
      } catch (e) {
        console.error(`Error parsing localStorage key ${key}:`, e);
      }
    }
  }
  
  return progressMap;
}

export default function AllWordsPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [wordsWithProgress, setWordsWithProgress] = useState<WordWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        
        // Aggregate progress data from all chunks
        const progressMap = aggregateProgressData();
        
        // Combine words with their progress
        const combined: WordWithProgress[] = parsed.map(word => {
          const progress = progressMap.get(word.key) || null;
          const bestRating = progress ? progress.rating : -1; // -1 for unknown words
          
          return {
            word,
            progress,
            bestRating
          };
        });
        
        // Sort by rating (best known first, unknown last)
        combined.sort((a, b) => {
          if (a.bestRating !== b.bestRating) {
            return b.bestRating - a.bestRating; // Higher rating first
          }
          // If same rating, sort by repetitions if available
          if (a.progress && b.progress) {
            return b.progress.repetitions - a.progress.repetitions;
          }
          // Finally sort alphabetically for unknowns
          return a.word.EnglishWord.localeCompare(b.word.EnglishWord);
        });
        
        setWordsWithProgress(combined);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading words:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading all words...</p>
        </div>
      </div>
    );
  }

  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BackHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className={`text-3xl sm:text-4xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
            All Words
          </h1>
          <p className="text-gray-400">
            {allWords.length} total words • {wordsWithProgress.filter(w => w.progress).length} learned
          </p>
        </div>

        <div className="mb-8 text-slate-200 text-sm">
        You can find the complete as CSV files in the GitHub repository.
        <br />
        • 
        <Link href="https://github.com/MarkMote/learn-georgian/blob/main/public/words.csv" target="_blank" className="text-blue-300 px-2 underline hover:text-gray-200 transition-colors">
         Base set of words
        </Link>
        <br />
        • 
        <Link href="https://github.com/MarkMote/learn-georgian/blob/main/public/chunks.csv" target="_blank" className="text-blue-300 px-2 underline hover:text-gray-200 transition-colors">
          Colloquial phrases
        </Link>
        </div>
        
        <div className="space-y-2">
          {wordsWithProgress.map((item, index) => (
            <WordCard
              key={item.word.key}
              word={item.word}
              progress={item.progress}
              isLazyLoaded={index > 20} // Only lazy load after first 20 cards
            />
          ))}
        </div>
      </div>
    </div>
  );
}
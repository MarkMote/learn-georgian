"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import WordCard from "./components/WordCard";

interface WordData {
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
}

interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

interface WordWithProgress {
  word: WordData;
  progress: KnownWordState | null;
  bestRating: number;
}

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
      ExampleEnglish1: cols[9],
      ExampleGeorgian1: cols[10],
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

function aggregateProgressData(): Map<string, KnownWordState> {
  const progressMap = new Map<string, KnownWordState>();
  
  // Check all localStorage keys for chunk states
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chunkState_')) {
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

export default function ChunkAllPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [wordsWithProgress, setWordsWithProgress] = useState<WordWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'order' | 'rating' | 'alphabetical'>('order');

  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        
        const progressMap = aggregateProgressData();
        const uniqueWordKeys = getUniqueWordKeys(parsed);
        
        // Create a map of word_key to the first occurrence of each word
        const firstWordByKey = new Map<string, WordData>();
        for (const word of parsed) {
          if (!firstWordByKey.has(word.word_key)) {
            firstWordByKey.set(word.word_key, word);
          }
        }
        
        // Build words with progress for unique words only
        const wordsWithProgressList: WordWithProgress[] = uniqueWordKeys.map(wordKey => {
          const word = firstWordByKey.get(wordKey)!;
          const progress = progressMap.get(word.key) || null;
          const bestRating = progress ? progress.rating : -1;
          
          return {
            word,
            progress,
            bestRating
          };
        });
        
        setWordsWithProgress(wordsWithProgressList);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        setLoading(false);
      });
  }, []);

  const sortedWords = React.useMemo(() => {
    const words = [...wordsWithProgress];
    
    switch (sortBy) {
      case 'rating':
        return words.sort((a, b) => {
          // Sort by rating (highest first), then by original order
          if (b.bestRating !== a.bestRating) {
            return b.bestRating - a.bestRating;
          }
          return allWords.findIndex(w => w.word_key === a.word.word_key) - 
                 allWords.findIndex(w => w.word_key === b.word.word_key);
        });
      
      case 'alphabetical':
        return words.sort((a, b) => a.word.EnglishWord.localeCompare(b.word.EnglishWord));
      
      case 'order':
      default:
        return words.sort((a, b) => {
          return allWords.findIndex(w => w.word_key === a.word.word_key) - 
                 allWords.findIndex(w => w.word_key === b.word.word_key);
        });
    }
  }, [wordsWithProgress, sortBy, allWords]);

  const stats = React.useMemo(() => {
    const total = wordsWithProgress.length;
    const practiced = wordsWithProgress.filter(w => w.progress !== null).length;
    const byRating = {
      easy: wordsWithProgress.filter(w => w.bestRating === 3).length,
      good: wordsWithProgress.filter(w => w.bestRating === 2).length,
      hard: wordsWithProgress.filter(w => w.bestRating === 1).length,
      fail: wordsWithProgress.filter(w => w.bestRating === 0).length,
      new: wordsWithProgress.filter(w => w.bestRating === -1).length,
    };
    
    return { total, practiced, byRating };
  }, [wordsWithProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading all chunk words...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/chunk" 
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Back to chunk home"
              >
                <Home size={20} />
              </Link>
              <h1 className="text-2xl font-light">All Chunk Words</h1>
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="order">Original Order</option>
              <option value="rating">By Rating</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>Total: {stats.total}</span>
            <span>Practiced: {stats.practiced}</span>
            <div className="flex gap-2">
              <span className="text-green-400">Easy: {stats.byRating.easy}</span>
              <span className="text-blue-400">Good: {stats.byRating.good}</span>
              <span className="text-yellow-400">Hard: {stats.byRating.hard}</span>
              <span className="text-red-400">Fail: {stats.byRating.fail}</span>
              <span className="text-gray-500">New: {stats.byRating.new}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-4">
          {sortedWords.map((wordWithProgress) => (
            <WordCard 
              key={wordWithProgress.word.word_key} 
              wordWithProgress={wordWithProgress} 
            />
          ))}
        </div>
        
        {wordsWithProgress.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No words found</p>
            <Link 
              href="/chunk" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go back to chunks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
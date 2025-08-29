"use client";

import React, { useState } from "react";

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

interface WordCardProps {
  wordWithProgress: WordWithProgress;
}

export default function WordCard({ wordWithProgress }: WordCardProps) {
  const [justCopied, setJustCopied] = useState(false);
  const { word, progress, bestRating } = wordWithProgress;

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(word.GeorgianWord);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 3: return "text-green-400 bg-green-900/20";
      case 2: return "text-blue-400 bg-blue-900/20";
      case 1: return "text-yellow-400 bg-yellow-900/20";
      case 0: return "text-red-400 bg-red-900/20";
      default: return "text-gray-400 bg-gray-700/20";
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 3: return "Easy";
      case 2: return "Good";
      case 1: return "Hard";
      case 0: return "Fail";
      default: return "New";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p 
            className={`text-lg font-medium cursor-pointer transition-colors ${
              justCopied ? 'text-green-400' : 'text-white hover:text-gray-300'
            }`}
            onClick={handleCopyGeorgian}
            title="Click to copy Georgian word"
          >
            {word.GeorgianWord}
          </p>
          <p className="text-gray-300 text-base">
            {word.EnglishWord}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-1 ml-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(bestRating)}`}>
            {getRatingLabel(bestRating)}
          </span>
          <span className="text-xs text-gray-500">
            {word.PartOfSpeech}
          </span>
        </div>
      </div>

      {(word.ExampleEnglish1 || word.ExampleGeorgian1) && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          {word.ExampleGeorgian1 && (
            <p className="text-sm text-gray-400 mb-1">
              {word.ExampleGeorgian1}
            </p>
          )}
          {word.ExampleEnglish1 && (
            <p className="text-sm text-gray-500">
              {word.ExampleEnglish1}
            </p>
          )}
        </div>
      )}

      {progress && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Repetitions: {progress.repetitions}</span>
          <span>Interval: {progress.interval}d</span>
        </div>
      )}
    </div>
  );
}
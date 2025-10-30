// app/alphabet/deck/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import FlashCard from './components/FlashCard';
import BottomBar from '../../components/BottomBar';
import { AlphabetData } from './types';
import { parseCSV } from './utils/dataProcessing';
import { useAlphabetReviewState } from './hooks/useAlphabetReviewState';

export default function AlphabetDeckPage() {
  const router = useRouter();
  const [allLetters, setAllLetters] = useState<AlphabetData[]>([]);

  // Load alphabet data
  useEffect(() => {
    fetch("/alphabet.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllLetters(parsed);
      });
  }, []);

  const {
    knownLetters,
    currentLetter,
    isFlipped,
    isLeftHanded,
    letterProgress,
    handleScore,
    handleFlip,
    setIsLeftHanded,
    clearProgress
  } = useAlphabetReviewState(allLetters);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) handleFlip();
          break;
        case "r":
          if (isFlipped) handleScore("easy");
          break;
        case "e":
          if (isFlipped) handleScore("good");
          break;
        case "w":
          if (isFlipped) handleScore("hard");
          break;
        case "q":
          if (isFlipped) handleScore("fail");
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, handleScore, handleFlip]);

  const handleToggleHandedness = () => {
    setIsLeftHanded(!isLeftHanded);
  };

  const handleClearProgress = () => {
    if (confirm("Are you sure you want to reset all progress?")) {
      clearProgress();
    }
  };

  if (!currentLetter || allLetters.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading alphabet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-black text-white" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={() => router.push('/alphabet')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="text-sm text-center">
          <div>Letters: {letterProgress.unlocked}/{letterProgress.total}</div>
        </div>

        <button
          onClick={handleClearProgress}
          className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Flash Card */}
      <div className="flex items-center justify-center px-4" style={{ height: 'calc(100dvh - 140px)' }}>
        <FlashCard
          letter={currentLetter.data}
          isFlipped={isFlipped}
        />
      </div>

      {/* Bottom Bar */}
      <BottomBar
        isFlipped={isFlipped}
        isLeftHanded={isLeftHanded}
        onFlip={handleFlip}
        onRate={handleScore}
        onToggleHandedness={handleToggleHandedness}
      />
    </div>
  );
}

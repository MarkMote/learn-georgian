// app/morphology/deck/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import FlashCard from './components/FlashCard';
import BottomBar from '../../components/BottomBar';
import { MorphologyData } from './types';
import { parseCSV } from './utils/dataProcessing';
import { useMorphologyReviewState } from './hooks/useMorphologyReviewState';
import { useFlashcardLock } from '../../hooks/useFlashcardLock';

export default function MorphologyDeckPage() {
  const router = useRouter();
  const [allMarkers, setAllMarkers] = useState<MorphologyData[]>([]);

  // Load morphology data
  useEffect(() => {
    fetch("/morphology.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllMarkers(parsed);
      });
  }, []);

  const {
    knownMarkers,
    currentMarker,
    isFlipped,
    isLeftHanded,
    markerProgress,
    handleScore,
    handleFlip,
    setIsLeftHanded,
    clearProgress
  } = useMorphologyReviewState(allMarkers);

  // Lock flashcard screen (no zoom, scroll, or orientation flip)
  useFlashcardLock(true);

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

  if (!currentMarker || allMarkers.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading morphology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-neutral-950 text-slate-100" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={() => router.push('/morphology')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="text-sm text-center">
          <div>Markers: {markerProgress.unlocked}/{allMarkers.length}</div>
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
          marker={currentMarker.data}
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

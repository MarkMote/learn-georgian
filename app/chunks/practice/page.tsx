// app/chunks/practice/page.tsx
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Menu, CheckCircle, Play } from 'lucide-react';
import Papa from 'papaparse';
import BottomBar from '../../components/BottomBar';
import FlashCard from '../[chunkId]/components/FlashCard';
import { useChunkPracticeState } from './hooks/useChunkPracticeState';
import { ChunkData, ExampleMode, ExplanationMode, ReviewMode, DifficultyRating } from '../[chunkId]/types';
import { useFlashcardLock } from '../../hooks/useFlashcardLock';

const CHUNK_SIZE = 50;
const CHUNKS_MODE_KEY = 'chunks_mode_preference';

function parseCSV(csvText: string): ChunkData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any, index: number) => ({
    chunk_key: `chunk_${index}`,
    chunk_en: row.chunk_en || "",
    chunk_ka: row.chunk_ka || "",
    explanation: row.explanation || "",
    example_en: row.example_en || "",
    example_ka: row.example_ka || "",
  }));
}

function getSetCount(allChunks: ChunkData[]): number {
  return Math.ceil(allChunks.length / CHUNK_SIZE);
}

function ChunkPracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get('preview') === 'true';
  const autoPractice = searchParams.get('practice') === 'true';

  const [allChunks, setAllChunks] = useState<ChunkData[]>([]);
  const [setCount, setSetCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState<ExampleMode>("tap-ka");
  const [showExplanation, setShowExplanation] = useState<ExplanationMode>("on");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('reverse');

  // Load mode preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(CHUNKS_MODE_KEY) as ReviewMode | null;
      if (savedMode === 'normal' || savedMode === 'reverse') {
        setReviewMode(savedMode);
      }
    }
  }, []);

  // Load UI preferences
  useEffect(() => {
    const prefsKey = 'ui_prefs_chunks_practice_normal';
    const stored = localStorage.getItem(prefsKey);
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setIsLeftHanded(prefs.isLeftHanded ?? false);
        setShowExamples(prefs.showExamples ?? "tap-ka");
        setShowExplanation(prefs.showExplanation ?? "on");
      } catch (err) {
        console.error("Failed to load UI preferences:", err);
      }
    }
  }, []);

  // Save UI preferences
  useEffect(() => {
    const prefsKey = 'ui_prefs_chunks_practice_normal';
    const prefs = { isLeftHanded, showExamples, showExplanation };
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [isLeftHanded, showExamples, showExplanation]);

  // Load chunks
  useEffect(() => {
    fetch("/chunks.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllChunks(parsed);
        setSetCount(getSetCount(parsed));
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);

  // SRS state
  const {
    knownChunks,
    currentChunk,
    currentCardState,
    handleScore: srsHandleScore,
    isLoading,
    totalMastered,
    dueCount,
    isReviewComplete,
    isPracticeMode,
    startPracticeMode,
  } = useChunkPracticeState(allChunks, setCount, previewMode, reviewMode);

  // Reset card display
  const resetCardDisplay = useCallback(() => {
    setIsFlipped(false);
    setRevealedExamples(new Set());
    setRevealedExplanations(new Set());
  }, []);

  // Combined score handler
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    srsHandleScore(difficulty);
    resetCardDisplay();
  }, [srsHandleScore, resetCardDisplay]);

  // Handlers
  const handleFlip = () => setIsFlipped(true);
  const handleToggleHandedness = () => setIsLeftHanded(prev => !prev);
  const handleRevealExamples = (chunkKey: string) => {
    setRevealedExamples(prev => new Set([...prev, chunkKey]));
  };
  const handleRevealExplanation = (chunkKey: string) => {
    setRevealedExplanations(prev => new Set([...prev, chunkKey]));
  };
  const handleToggleExamples = () => {
    setShowExamples(prev => {
      if (prev === "off") return "on";
      if (prev === "on") return "tap";
      if (prev === "tap") return "tap-en";
      if (prev === "tap-en") return "tap-ka";
      return "off";
    });
  };
  const handleToggleExplanation = () => {
    setShowExplanation(prev => prev === "on" ? "off" : "on");
  };

  // Keyboard navigation
  useEffect(() => {
    if (isReviewComplete && !isPracticeMode) return;

    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
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
  }, [isFlipped, handleScore, isReviewComplete, isPracticeMode]);

  // Lock flashcard screen
  useFlashcardLock(!isReviewComplete || isPracticeMode);

  // Auto-start practice mode if ?practice=true and review is complete
  useEffect(() => {
    if (autoPractice && isReviewComplete && !isPracticeMode && totalMastered > 0) {
      startPracticeMode();
    }
  }, [autoPractice, isReviewComplete, isPracticeMode, totalMastered, startPracticeMode]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.top-bar-menu-area')) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading mastered phrases...</p>
      </div>
    );
  }

  // No mastered chunks
  if (totalMastered === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/chunks"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Phrases</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <h1 className="text-2xl font-light mb-4 text-slate-300">No Known Phrases Yet</h1>
          <p className="text-gray-400 text-center max-w-md">
            Keep practicing! Phrases will appear here once you&apos;ve mastered them through the learning process.
          </p>
          <Link
            href="/chunks"
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </Link>
        </main>
      </div>
    );
  }

  // Review complete - show congratulations screen
  if (isReviewComplete) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/chunks"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Phrases</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-2xl font-light mb-2 text-slate-200">All Caught Up!</h1>
          <p className="text-gray-400 text-center max-w-md mb-8">
            You&apos;ve reviewed all your due phrases. Great job keeping up with your practice!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/chunks"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center"
            >
              Back to Phrases
            </Link>
            <button
              onClick={startPracticeMode}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Keep Practicing ({totalMastered} phrases)
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No current card (shouldn't happen if not complete, but handle gracefully)
  if (!currentChunk) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next card...</p>
      </div>
    );
  }

  // Find current card info for set number display
  const currentCardInfo = knownChunks.find(k => k.data.chunk_key === currentChunk.chunk_key);

  return (
    <div className="flex w-full">
      <div
        className="relative bg-neutral-950 text-white w-full"
        style={{ height: '100dvh', overflow: 'auto' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 relative top-bar-menu-area">
          <div className="flex items-center space-x-2 w-24">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2 border border-gray-600 rounded hover:bg-gray-700"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              {isMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                  <ul className="divide-y divide-gray-700">
                    <li>
                      <button
                        onClick={handleToggleExamples}
                        className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                      >
                        <span>Show Examples</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          showExamples === 'on' ? 'bg-green-600' :
                          showExamples === 'tap' ? 'bg-yellow-600' :
                          showExamples === 'tap-en' ? 'bg-blue-600' :
                          showExamples === 'tap-ka' ? 'bg-purple-600' :
                          'bg-gray-600'
                        }`}>
                          {showExamples === 'on' ? 'ON' :
                           showExamples === 'tap' ? 'TAP' :
                           showExamples === 'tap-en' ? 'TAP-EN' :
                           showExamples === 'tap-ka' ? 'TAP-KA' :
                           'OFF'}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleToggleExplanation}
                        className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                      >
                        <span>Show Explanation</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${showExplanation === 'on' ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {showExplanation === 'on' ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/chunks')}
              className="p-2 border border-gray-600 rounded hover:bg-gray-700"
              aria-label="Go to Home"
            >
              <Home size={20} />
            </button>
          </div>

          <div className="text-sm text-center flex-1">
            {isPracticeMode ? (
              <>
                <div className="text-purple-400">Practice Mode</div>
                <div className="text-gray-400">{totalMastered} phrases</div>
              </>
            ) : (
              <>
                <div className="text-green-400">Phrases left in review</div>
                <div className="text-white font-semibold text-lg">{dueCount}</div>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 text-right w-24">
            {currentCardInfo && (
              <div className="text-gray-600">Set {currentCardInfo.setNumber}</div>
            )}
          </div>
        </div>

        {/* Flash Card */}
        <div className="flex items-center justify-center px-4" style={{ height: 'calc(100svh - 140px)' }}>
          <FlashCard
            chunk={currentChunk}
            isFlipped={isFlipped}
            showExamples={showExamples}
            showExplanation={showExplanation}
            revealedExamples={revealedExamples}
            revealedExplanations={revealedExplanations}
            reviewMode={reviewMode}
            onRevealExamples={handleRevealExamples}
            onRevealExplanation={handleRevealExplanation}
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

        {/* Preview mode indicator */}
        {previewMode && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-yellow-600 text-black px-4 py-2 rounded-full text-sm font-medium">
            Preview Mode - No changes saved
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChunkPracticePage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <ChunkPracticePageContent />
    </Suspense>
  );
}

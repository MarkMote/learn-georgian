// app/review/practice/page.tsx
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Menu, Settings, CheckCircle, Play } from 'lucide-react';
import BottomBar from '../../components/BottomBar';
import FlashCard from '../[chunkId]/components/FlashCard';
import SRSConfigPanel from '../[chunkId]/components/SRSConfigPanel';
import { usePracticeState } from './hooks/usePracticeState';
import { WordData } from '../../../lib/spacedRepetition/types';
import { ExampleMode, ReviewMode, DifficultyRating } from '../[chunkId]/types';
import { getVerbHint, getVerbTenseLabel, parseCSV } from '../[chunkId]/utils/dataProcessing';
import { useFlashcardLock } from '../../hooks/useFlashcardLock';

const CHUNK_SIZE = 50;

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

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get('preview') === 'true';

  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [isSRSConfigOpen, setIsSRSConfigOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [showImageHint, setShowImageHint] = useState(true);
  const [showExamples, setShowExamples] = useState<ExampleMode>("tap-ka");
  const [showTips, setShowTips] = useState(true);
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());

  // Review mode (practice always uses normal mode)
  const reviewMode: ReviewMode = 'normal';

  // Load UI preferences
  useEffect(() => {
    const prefsKey = 'ui_prefs_practice_normal';
    const stored = localStorage.getItem(prefsKey);
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setIsLeftHanded(prefs.isLeftHanded ?? false);
        setShowExamples(prefs.showExamples ?? "tap-ka");
        setShowTips(prefs.showTips ?? true);
      } catch (err) {
        console.error("Failed to load UI preferences:", err);
      }
    }
  }, []);

  // Save UI preferences
  useEffect(() => {
    const prefsKey = 'ui_prefs_practice_normal';
    const prefs = { isLeftHanded, showExamples, showTips };
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [isLeftHanded, showExamples, showTips]);

  // Auto-hide image hint
  useEffect(() => {
    const timer = setTimeout(() => setShowImageHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Load words
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

  // SRS state
  const {
    knownWords,
    currentWord,
    currentCardState,
    handleScore: srsHandleScore,
    isLoading,
    totalMastered,
    dueCount,
    isReviewComplete,
    isPracticeMode,
    startPracticeMode,
  } = usePracticeState(allWords, chunkCount, previewMode);

  // Reset card display
  const resetCardDisplay = useCallback(() => {
    setIsFlipped(false);
    setShowEnglish(false);
    setRevealedExamples(new Set());
  }, []);

  // Combined score handler
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    srsHandleScore(difficulty);
    resetCardDisplay();
  }, [srsHandleScore, resetCardDisplay]);

  // Handlers
  const handleFlip = () => setIsFlipped(true);
  const handleToggleHandedness = () => setIsLeftHanded(prev => !prev);
  const handleImageClick = () => {
    setShowEnglish(prev => !prev);
    setShowImageHint(false);
  };
  const handleRevealExamples = (wordKey: string) => {
    setRevealedExamples(prev => new Set([...prev, wordKey]));
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
  const handleToggleTips = () => setShowTips(prev => !prev);

  // Keyboard navigation
  useEffect(() => {
    if (isReviewComplete && !isPracticeMode) return; // Disable when showing completion screen

    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
          break;
        case "i":
          setShowEnglish(prev => !prev);
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

  // Lock flashcard screen (no zoom, scroll, or orientation flip) - but not on completion screen
  useFlashcardLock(!isReviewComplete || isPracticeMode);

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

  const handleSRSConfigChange = () => {
    setIsSRSConfigOpen(false);
    window.location.reload();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading mastered words...</p>
      </div>
    );
  }

  // No mastered words
  if (totalMastered === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/review"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Review</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <h1 className="text-2xl font-light mb-4 text-slate-300">No Known Words Yet</h1>
          <p className="text-gray-400 text-center max-w-md">
            Keep practicing! Words will appear here once you&apos;ve mastered them through the learning process.
          </p>
          <Link
            href="/review"
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
              href="/review"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Review</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-2xl font-light mb-2 text-slate-200">All Caught Up!</h1>
          <p className="text-gray-400 text-center max-w-md mb-8">
            You&apos;ve reviewed all your due words. Great job keeping up with your practice!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/review"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center"
            >
              Back to Review
            </Link>
            <button
              onClick={startPracticeMode}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Keep Practicing ({totalMastered} words)
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No current card (shouldn't happen if not complete, but handle gracefully)
  if (!currentWord) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next card...</p>
      </div>
    );
  }

  // Find current card info for chunk number display
  const currentCardInfo = knownWords.find(k => k.data.key === currentWord.key);
  const verbHint = getVerbHint(currentWord);
  const verbTenseLabel = getVerbTenseLabel(currentWord);

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
                        onClick={handleToggleTips}
                        className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                      >
                        <span>Show Tips</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${showTips ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {showTips ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setIsSRSConfigOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Settings size={16} />
                        Study Settings
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/review')}
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
                <div className="text-gray-400">{totalMastered} words</div>
              </>
            ) : (
              <>
                <div className="text-green-400">Words left in review</div>
                <div className="text-white font-semibold text-lg">{dueCount}</div>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 text-right w-24">
            {currentCardInfo && (
              <div className="text-gray-600">Set {currentCardInfo.chunkNumber}</div>
            )}
          </div>
        </div>

        {/* Flash Card */}
        <div className="flex items-center justify-center px-4" style={{ height: 'calc(100svh - 140px)' }}>
          <FlashCard
            word={currentWord}
            isFlipped={isFlipped}
            showEnglish={showEnglish}
            showImageHint={showImageHint}
            showExamples={showExamples}
            showTips={showTips}
            revealedExamples={revealedExamples}
            verbHint={verbHint}
            verbTenseLabel={verbTenseLabel}
            reviewMode={reviewMode}
            onImageClick={handleImageClick}
            onRevealExamples={handleRevealExamples}
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

        {/* SRS Config Panel */}
        <SRSConfigPanel
          isOpen={isSRSConfigOpen}
          onClose={() => setIsSRSConfigOpen(false)}
          onConfigChange={handleSRSConfigChange}
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

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  );
}

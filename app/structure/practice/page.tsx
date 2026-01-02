// app/structure/practice/page.tsx
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Menu, CheckCircle, Play, Info } from 'lucide-react';
import BottomBar from '../../components/BottomBar';
import FlashCard from '../[moduleId]/components/FlashCard';
import FrameExplainerModal from '../[moduleId]/components/FrameExplainerModal';
import { useStructurePracticeState } from './hooks/useStructurePracticeState';
import { FrameData, FrameExampleData, DifficultyRating, ReviewMode } from '../[moduleId]/types';
import {
  parseFramesCSV,
  parseExamplesCSV,
  buildFrameLookup,
} from '../[moduleId]/utils/dataProcessing';

import { useFlashcardLock } from '../../hooks/useFlashcardLock';
import { ModuleConfig, buildModulesFromFrames } from '../[moduleId]/utils/modules';

const STRUCTURE_MODE_KEY = 'structure_mode_preference';

function StructurePracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get('preview') === 'true';
  const autoPractice = searchParams.get('practice') === 'true';

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [examples, setExamples] = useState<FrameExampleData[]>([]);
  const [frameLookup, setFrameLookup] = useState<Map<string, FrameData>>(new Map());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('reverse');

  // Load mode preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(STRUCTURE_MODE_KEY) as ReviewMode | null;
      if (savedMode === 'normal' || savedMode === 'reverse') {
        setReviewMode(savedMode);
      }
    }
  }, []);

  // Load CSV data
  useEffect(() => {
    Promise.all([
      fetch("/frames.csv").then(res => res.text()),
      fetch("/frame_examples.csv").then(res => res.text())
    ])
      .then(([framesCSV, examplesCSV]) => {
        const parsedFrames = parseFramesCSV(framesCSV);
        const parsedExamples = parseExamplesCSV(examplesCSV);
        const builtModules = buildModulesFromFrames(parsedFrames);
        setFrames(parsedFrames);
        setModules(builtModules);
        setExamples(parsedExamples);
        setFrameLookup(buildFrameLookup(parsedFrames));
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);

  // SRS state
  const {
    knownExamples,
    currentExample,
    currentFrame,
    handleScore: srsHandleScore,
    isLoading,
    totalMastered,
    dueCount,
    isReviewComplete,
    isPracticeMode,
    startPracticeMode,
  } = useStructurePracticeState(examples, frames, frameLookup, modules, previewMode, reviewMode);

  const resetCardDisplay = useCallback(() => {
    setIsFlipped(false);
  }, []);

  const handleScore = useCallback((difficulty: DifficultyRating) => {
    srsHandleScore(difficulty);
    resetCardDisplay();
  }, [srsHandleScore, resetCardDisplay]);

  const handleFlip = () => setIsFlipped(true);

  const handleExplainClick = useCallback(() => {
    if (currentFrame) {
      setIsExplainerOpen(true);
    }
  }, [currentFrame]);

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

  // Auto-start practice mode
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
  if (isLoading || examples.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading mastered sentences...</p>
      </div>
    );
  }

  // No mastered examples
  if (totalMastered === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/structure"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Structure</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <h1 className="text-2xl font-light mb-4 text-slate-300">No Known Sentences Yet</h1>
          <p className="text-gray-400 text-center max-w-md">
            Keep practicing! Sentences will appear here once you&apos;ve mastered them through the learning process.
          </p>
          <Link
            href="/structure"
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </Link>
        </main>
      </div>
    );
  }

  // Review complete
  if (isReviewComplete) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/structure"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium pt-1">Back to Structure</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center px-4 py-16">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-2xl font-light mb-2 text-slate-200">All Caught Up!</h1>
          <p className="text-gray-400 text-center max-w-md mb-8">
            You&apos;ve reviewed all your due sentences. Great job keeping up with your practice!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/structure"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center"
            >
              Back to Structure
            </Link>
            <button
              onClick={startPracticeMode}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Keep Practicing ({totalMastered} sentences)
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!currentExample || !currentFrame) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next card...</p>
      </div>
    );
  }

  const currentInfo = knownExamples.find(k => k.example.example_id === currentExample.example_id);
  const moduleConfig = currentInfo ? modules.find(m => m.id === currentInfo.moduleId) : null;

  return (
    <div className="flex w-full">
      <div
        className="relative bg-neutral-950 text-white w-full"
        style={{ height: '100dvh', overflow: 'auto' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 relative top-bar-menu-area">
          <div className="flex items-center space-x-2 w-24">
            <button
              onClick={() => router.push('/structure')}
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
                <div className="text-gray-400">{totalMastered} sentences</div>
              </>
            ) : (
              <>
                <div className="text-green-400">Sentences left in review</div>
                <div className="text-white font-semibold text-lg">{dueCount}</div>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 text-right w-24">
            {moduleConfig && (
              <div className="text-gray-600">Module {currentInfo?.moduleId}</div>
            )}
          </div>
        </div>

        {/* Flash Card */}
        <div className="flex items-center justify-center px-4" style={{ height: 'calc(100svh - 140px)' }}>
          <FlashCard
            example={currentExample}
            frame={currentFrame}
            isFlipped={isFlipped}
            reviewMode={reviewMode}
            onExplainClick={handleExplainClick}
            showContext={showContext}
          />
        </div>

        {/* Bottom Bar */}
        <BottomBar
          isFlipped={isFlipped}
          isLeftHanded={false}
          onFlip={handleFlip}
          onRate={handleScore}
          onToggleHandedness={() => {}}
        />

        {/* Preview mode indicator */}
        {previewMode && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-yellow-600 text-black px-4 py-2 rounded-full text-sm font-medium">
            Preview Mode - No changes saved
          </div>
        )}

        <FrameExplainerModal
          isOpen={isExplainerOpen}
          onClose={() => setIsExplainerOpen(false)}
          frame={currentFrame}
        />
      </div>
    </div>
  );
}

export default function StructurePracticePage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <StructurePracticePageContent />
    </Suspense>
  );
}

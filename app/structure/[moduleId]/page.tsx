// app/structure/[moduleId]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from 'next/navigation';
import BottomBar from '../../components/BottomBar';
import FlashCard from './components/FlashCard';
import TopBar from './components/TopBar';
import ProgressModal from './components/ProgressModal';
import FrameExplainerModal from './components/FrameExplainerModal';
import { useStructureState } from './hooks/useStructureState';
import { FrameData, FrameExampleData, ReviewMode, DifficultyRating } from './types';
import {
  parseFramesCSV,
  parseExamplesCSV,
  getExamplesForModule,
  buildFrameLookup,
  computePercentageScore,
  getExampleProgress,
} from './utils/dataProcessing';
import { ModuleConfig, buildModulesFromFrames } from './utils/modules';
import { useFlashcardLock } from '../../hooks/useFlashcardLock';

const STRUCTURE_MODE_KEY = 'structure_mode_preference';

export default function StructureModulePage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const moduleNumber = parseInt(moduleId, 10);

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [moduleExamples, setModuleExamples] = useState<FrameExampleData[]>([]);
  const [frameLookup, setFrameLookup] = useState<Map<string, FrameData>>(new Map());
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [explainerFrame, setExplainerFrame] = useState<FrameData | null>(null);
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

  const moduleConfig = modules.find(m => m.id === moduleNumber);

  const {
    knownExamples,
    currentIndex,
    isFlipped,
    setIsFlipped,
    handleScore,
    clearProgress,
    deckState,
  } = useStructureState(moduleId, moduleExamples, frameLookup, reviewMode);

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
        setFrameLookup(buildFrameLookup(parsedFrames));

        const filtered = getExamplesForModule(parsedExamples, moduleNumber, builtModules);
        setModuleExamples(filtered);
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, [moduleNumber]);

  // Keyboard shortcuts
  useEffect(() => {
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
        case "m":
          e.preventDefault();
          handleCycleMode();
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, handleScore, setIsFlipped]);

  // Lock flashcard screen when modals are closed
  useFlashcardLock(!isProgressModalOpen && !isExplainerOpen);

  const currentCard = knownExamples[currentIndex];

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleToggleHandedness = () => {
    // Not used in structure but required by BottomBar
  };

  const handleModeChange = (newMode: ReviewMode) => {
    setReviewMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STRUCTURE_MODE_KEY, newMode);
    }
  };

  const handleCycleMode = () => {
    const modes: ReviewMode[] = ['normal', 'reverse'];
    const currentModeIndex = modes.indexOf(reviewMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    handleModeChange(nextMode);
  };

  const handleExplainClick = useCallback(() => {
    if (currentCard) {
      setExplainerFrame(currentCard.frame);
      setIsExplainerOpen(true);
    }
  }, [currentCard]);

  // Loading states
  if (moduleExamples.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading sentences...</p>
        <p className="text-sm text-gray-400 mt-2">
          Preparing {moduleConfig?.name || `Module ${moduleId}`}
        </p>
      </div>
    );
  }

  if (knownExamples.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="w-48 h-32 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
        <p className="text-lg">Preparing your first sentence...</p>
      </div>
    );
  }

  if (!currentCard && knownExamples.length > 0) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next sentence...</p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="p-8 text-center text-white bg-neutral-950 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const exampleProgress = getExampleProgress(knownExamples, moduleExamples);
  const percentageScore = computePercentageScore(knownExamples, moduleExamples);

  return (
    <div
      className="relative w-full bg-neutral-950 text-white"
      style={{ height: '100dvh', overflow: isProgressModalOpen || isExplainerOpen ? 'auto' : 'hidden' }}
    >
      <TopBar
        onClearProgress={clearProgress}
        exampleProgress={exampleProgress}
        percentageScore={percentageScore}
        knownExamples={knownExamples}
        onShowProgress={() => setIsProgressModalOpen(true)}
        reviewMode={reviewMode}
        onModeChange={handleModeChange}
        moduleName={moduleConfig?.name || `Module ${moduleId}`}
        showContext={showContext}
        onToggleContext={() => setShowContext(prev => !prev)}
      />

      <div className="flex items-center justify-center px-4 h-[calc(100vh-140px)]">
        <FlashCard
          example={currentCard.data}
          frame={currentCard.frame}
          isFlipped={isFlipped}
          reviewMode={reviewMode}
          onExplainClick={handleExplainClick}
          showContext={showContext}
        />
      </div>

      <BottomBar
        isFlipped={isFlipped}
        isLeftHanded={false}
        onFlip={handleFlip}
        onRate={handleScore}
        onToggleHandedness={handleToggleHandedness}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        knownExamples={knownExamples}
        currentIndex={currentIndex}
      />

      <FrameExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        frame={explainerFrame}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import BottomBar from '../../components/BottomBar';
import FlashCard from './components/FlashCard';
import TopBar from './components/TopBar';
import ProgressModal from './components/ProgressModal';
import { useChunkState } from './hooks/useChunkState';
import { ChunkData, ReviewMode } from './types';
import { 
  parseCSV, 
  getChunksForSet,
  computePercentageScore, 
  getChunkProgress 
} from './utils/dataProcessing';

export default function ChunkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chunkId = params.chunkId as string;
  const [allChunks, setAllChunks] = useState<ChunkData[]>([]);
  const [chunkSet, setChunkSet] = useState<ChunkData[]>([]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  
  const reviewMode = (searchParams.get('mode') as ReviewMode) || 'normal';

  const {
    knownChunks,
    currentIndex,
    isFlipped,
    isLeftHanded,
    showExamples,
    showExplanation,
    revealedExamples,
    revealedExplanations,
    cognitiveLoad,
    setIsFlipped,
    setIsLeftHanded,
    setShowExamples,
    setShowExplanation,
    setRevealedExamples,
    setRevealedExplanations,
    setCurrentIndex,
    handleScore,
    clearProgress,
  } = useChunkState(chunkId, chunkSet, reviewMode);

  useEffect(() => {
    fetch("/chunks.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllChunks(parsed);
        const filtered = getChunksForSet(parsed, chunkId, 50);
        setChunkSet(filtered);
      });
  }, [chunkId]);

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
  }, [isFlipped, currentIndex, handleScore, setIsFlipped]);

  useEffect(() => {
    if (!isProgressModalOpen) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      const preventDefault = (e: Event) => e.preventDefault();
      document.addEventListener('touchmove', preventDefault, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', preventDefault);
      };
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, [isProgressModalOpen]);

  const currentCard = knownChunks[currentIndex];

  useEffect(() => {
    if (!currentCard && knownChunks.length > 0 && currentIndex !== 0) {
      console.warn(`No current card (index ${currentIndex}), but ${knownChunks.length} knownChunks exist. Resetting index to 0.`);
      setCurrentIndex(0);
    }
  }, [currentCard, knownChunks, currentIndex]);

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleToggleHandedness = () => {
    // Chunks route disabled
  };

  const handleToggleExamples = () => {
    setShowExamples(prev => {
      if (prev === "off") return "on";
      if (prev === "on") return "tap";
      return "off";
    });
  };

  const handleToggleExplanation = () => {
    setShowExplanation(prev => {
      if (prev === "off") return "on";
      if (prev === "on") return "tap";
      return "off";
    });
  };
  
  const handleModeChange = (newMode: ReviewMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    router.push(url.pathname + url.search);
  };
  
  const handleCycleMode = () => {
    const modes: ReviewMode[] = ['normal', 'reverse'];
    const hasExamples = chunkSet.some(c => c.example_en && c.example_ka);
    if (hasExamples) {
      modes.push('examples', 'examples-reverse');
    }
    
    const currentModeIndex = modes.indexOf(reviewMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    handleModeChange(nextMode);
  };
  
  const hasExampleChunks = chunkSet.some(c => c.example_en && c.example_ka);

  const handleRevealExamples = (chunkKey: string) => {
    setRevealedExamples(prev => new Set([...prev, chunkKey]));
  };

  const handleRevealExplanation = (chunkKey: string) => {
    setRevealedExplanations(prev => new Set([...prev, chunkKey]));
  };

  if (chunkSet.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading chunks...</p>
        <p className="text-sm text-gray-400 mt-2">Preparing chunk set {chunkId}</p>
      </div>
    );
  }

  if (knownChunks.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="w-48 h-48 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
        <p className="text-lg">Preparing your first chunk...</p>
      </div>
    );
  }

  if (!currentCard && knownChunks.length > 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next chunk...</p>
      </div>
    );
  }

  if (!currentCard) {
    console.warn("Reached unexpected state: No current card. Displaying loading.");
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const chunkProgress = getChunkProgress(knownChunks, chunkSet);
  const percentageScore = computePercentageScore(knownChunks, chunkSet);

  return (
    <div 
      className="relative w-full bg-black text-white" 
      style={{ height: '100dvh', overflow: isProgressModalOpen ? 'auto' : 'hidden' }}
    >
      <TopBar
        onClearProgress={clearProgress}
        showExamples={showExamples}
        onToggleExamples={handleToggleExamples}
        showExplanation={showExplanation}
        onToggleExplanation={handleToggleExplanation}
        chunkProgress={chunkProgress}
        percentageScore={percentageScore}
        cognitiveLoad={cognitiveLoad}
        knownChunks={knownChunks}
        onShowProgress={() => setIsProgressModalOpen(true)}
        reviewMode={reviewMode}
        onModeChange={handleModeChange}
        hasExampleChunks={hasExampleChunks}
      />

      <div className="flex items-center justify-center px-4 h-[calc(100vh-140px)]">
        <FlashCard
          chunk={currentCard.data}
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

      <BottomBar
        isFlipped={isFlipped}
        isLeftHanded={isLeftHanded}
        onFlip={handleFlip}
        onRate={handleScore}
        onToggleHandedness={handleToggleHandedness}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        knownChunks={knownChunks}
      />
    </div>
  );
}
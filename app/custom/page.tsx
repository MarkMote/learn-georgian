"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import BottomBar from '../components/BottomBar';
import CustomFlashCard from './components/CustomFlashCard';
import CustomTopBar from './components/CustomTopBar';
import UploadForm from './components/UploadForm';
import DeckManager from './components/DeckManager';
import { useCustomReviewState } from './hooks/useCustomReviewState';
import { CustomWord, CustomReviewMode } from './types';
import { 
  loadCustomWords, 
  saveCustomWords, 
  addToCustomDeck, 
  clearCustomDeck 
} from './utils';

type PageState = 'empty' | 'upload' | 'manager' | 'review' | 'add-more';

export default function CustomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customWords, setCustomWords] = useState<CustomWord[]>([]);
  const [pageState, setPageState] = useState<PageState>('empty');
  
  // Get review mode from URL params
  const reviewMode = (searchParams.get('mode') as CustomReviewMode) || 'normal';

  const {
    knownWords,
    currentIndex,
    isFlipped,
    showExamples,
    revealedExamples,
    isLeftHanded,
    cognitiveLoad,
    setIsFlipped,
    setShowExamples,
    setRevealedExamples,
    setCurrentIndex,
    setIsLeftHanded,
    handleScore,
    clearProgress,
  } = useCustomReviewState(customWords, reviewMode);

  // Load custom words on mount
  useEffect(() => {
    const words = loadCustomWords();
    setCustomWords(words);
    
    if (words.length === 0) {
      setPageState('empty');
    } else {
      setPageState('manager');
    }
  }, []);

  // Keyboard shortcuts for review mode
  useEffect(() => {
    if (pageState !== 'review') return;

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
  }, [pageState, isFlipped, handleScore, setIsFlipped]);

  // Prevent scrolling during review
  useEffect(() => {
    if (pageState === 'review') {
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
  }, [pageState]);

  // Reset flip state when index changes
  useEffect(() => {
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [currentIndex, setIsFlipped, setRevealedExamples]);

  const currentCard = knownWords[currentIndex];

  const handleUpload = (words: CustomWord[]) => {
    saveCustomWords(words);
    setCustomWords(words);
    setPageState('manager');
  };

  const handleAddMore = (words: CustomWord[]) => {
    const updated = addToCustomDeck(words);
    setCustomWords(updated);
    setPageState('manager');
  };

  const handleClearAll = () => {
    clearCustomDeck();
    setCustomWords([]);
    setPageState('empty');
  };

  const handleStartReview = () => {
    setPageState('review');
    setCurrentIndex(0);
    setIsFlipped(false);
    setRevealedExamples(new Set());
  };

  const handleBackToManager = () => {
    setPageState('manager');
  };

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleToggleHandedness = () => {
    setIsLeftHanded(prev => !prev);
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
  
  const handleModeChange = (newMode: CustomReviewMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    router.push(url.pathname + url.search);
  };
  
  const handleCycleMode = () => {
    const modes: CustomReviewMode[] = ['normal', 'reverse'];
    const hasExamples = customWords.some(w => w.examplePreview && w.exampleRevealed);
    if (hasExamples) {
      modes.push('examples', 'examples-reverse');
    }
    
    const currentModeIndex = modes.indexOf(reviewMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    handleModeChange(nextMode);
  };

  const hasExampleWords = customWords.some(w => w.examplePreview || w.exampleRevealed);

  const handleRevealExamples = (wordKey: string) => {
    setRevealedExamples(prev => new Set([...prev, wordKey]));
  };

  const wordProgress = knownWords.length > 0 
    ? `${currentIndex + 1} / ${knownWords.length}` 
    : '0 / 0';
    
  const percentageScore = knownWords.length > 0
    ? Math.round((knownWords.filter(w => w.easinessFactor >= 2.5).length / knownWords.length) * 100)
    : 0;

  // Render different states
  if (pageState === 'empty' || pageState === 'upload') {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed top-4 left-4 z-10">
          <Link 
            href="/" 
            className="p-2 border border-gray-600 rounded hover:bg-gray-700 inline-flex items-center"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-screen p-4 pt-20">
          <UploadForm onUpload={handleUpload} />
        </div>
      </div>
    );
  }

  if (pageState === 'add-more') {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed top-4 left-4 z-10">
          <Link 
            href="/" 
            className="p-2 border border-gray-600 rounded hover:bg-gray-700 inline-flex items-center"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-screen p-4 pt-20">
          <UploadForm 
            onUpload={handleAddMore} 
            isAddMode={true}
            onCancel={() => setPageState('manager')}
          />
        </div>
      </div>
    );
  }

  if (pageState === 'manager') {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed top-4 left-4 z-10">
          <Link 
            href="/" 
            className="p-2 border border-gray-600 rounded hover:bg-gray-700 inline-flex items-center"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-screen p-4 pt-20">
          <DeckManager
            words={customWords}
            onAddMore={() => setPageState('add-more')}
            onClearAll={handleClearAll}
            onStartReview={handleStartReview}
          />
        </div>
      </div>
    );
  }

  // Review state
  if (knownWords.length === 0 || !currentCard) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Loading custom deck...</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full bg-black text-white" 
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      <CustomTopBar
        onClearProgress={clearProgress}
        showExamples={showExamples}
        onToggleExamples={handleToggleExamples}
        wordProgress={wordProgress}
        percentageScore={percentageScore}
        cognitiveLoad={cognitiveLoad}
        reviewMode={reviewMode}
        onModeChange={handleModeChange}
        hasExampleWords={hasExampleWords}
        onBackToManager={handleBackToManager}
      />

      <div className="flex items-center justify-center px-4" style={{ height: 'calc(100svh - 140px)' }}>
        <CustomFlashCard
          word={currentCard.data}
          isFlipped={isFlipped}
          reviewMode={reviewMode}
          showExamples={showExamples}
          revealedExamples={revealedExamples}
          onRevealExamples={handleRevealExamples}
        />
      </div>

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
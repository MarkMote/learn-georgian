"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import BottomBar from '../../components/BottomBar';
import FlashCard from './components/FlashCard';
import TopBar from './components/TopBar';
import LessonModal from './components/LessonModal';
import ProgressModal from './components/ProgressModal';
import { useReviewState } from './hooks/useReviewState';
import { useLessonModal } from './hooks/useLessonModal';
import { WordData, ReviewMode } from './types';
import { 
  parseCSV, 
  getWordsForChunk, 
  getVerbHint, 
  getVerbTenseLabel,
  computePercentageScore, 
  getWordProgress 
} from './utils/dataProcessing';

export default function ReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chunkId = params.chunkId as string;
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [chunkWords, setChunkWords] = useState<WordData[]>([]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  
  // Get review mode from URL params
  const reviewMode = (searchParams.get('mode') as ReviewMode) || 'normal';

  const {
    knownWords,
    currentIndex,
    isFlipped,
    showEnglish,
    skipVerbs,
    isLeftHanded,
    showImageHint,
    showExamples,
    revealedExamples,
    cognitiveLoad,
    setIsFlipped,
    setShowEnglish,
    setSkipVerbs,
    setIsLeftHanded,
    setShowImageHint,
    setShowExamples,
    setRevealedExamples,
    setCurrentIndex,
    handleScore,
    clearProgress,
  } = useReviewState(chunkId, chunkWords, reviewMode);

  const {
    isModalOpen,
    lessonMarkdown,
    isLessonLoading,
    isIncomplete,
    handleGetLesson,
    closeModal,
    retryLesson,
  } = useLessonModal();

  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        const filtered = getWordsForChunk(parsed, chunkId);
        setChunkWords(filtered);
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
        case "i":
          setShowEnglish((prev) => !prev);
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
  }, [isFlipped, currentIndex, handleScore, setIsFlipped, setShowEnglish]);

  useEffect(() => {
    if (!isModalOpen && !isProgressModalOpen) {
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
  }, [isModalOpen, isProgressModalOpen]);

  const currentCard = knownWords[currentIndex];

  useEffect(() => {
    if (!currentCard && knownWords.length > 0 && currentIndex !== 0) {
      console.warn(`No current card (index ${currentIndex}), but ${knownWords.length} knownWords exist. Resetting index to 0.`);
      setCurrentIndex(0);
    }
  }, [currentCard, knownWords, currentIndex]);

  const handleImageClick = () => {
    setShowEnglish((prev) => !prev);
    setShowImageHint(false);
  };

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleToggleHandedness = () => {
    setIsLeftHanded(prev => !prev);
  };

  const handleToggleSkipVerbs = () => {
    setSkipVerbs(prev => !prev);
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
  
  const handleModeChange = (newMode: ReviewMode) => {
    // Update URL with new mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    router.push(url.pathname + url.search);
  };
  
  const handleCycleMode = () => {
    const modes: ReviewMode[] = ['normal', 'reverse'];
    const hasExamples = chunkWords.some(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    if (hasExamples) {
      modes.push('examples', 'examples-reverse');
    }
    
    const currentModeIndex = modes.indexOf(reviewMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    handleModeChange(nextMode);
  };
  
  const hasExampleWords = chunkWords.some(w => w.ExampleEnglish1 && w.ExampleGeorgian1);

  const handleRevealExamples = (wordKey: string) => {
    setRevealedExamples(prev => new Set([...prev, wordKey]));
  };

  const handleLessonRequest = () => {
    if (currentCard) {
      handleGetLesson(currentCard.data.GeorgianWord);
    }
  };

  if (chunkWords.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading vocabulary...</p>
        <p className="text-sm text-gray-400 mt-2">Preparing word set {chunkId}</p>
      </div>
    );
  }

  if (knownWords.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="w-48 h-48 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
        <p className="text-lg">Preparing your first word...</p>
      </div>
    );
  }

  if (!currentCard && knownWords.length > 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Preparing next card...</p>
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

  const verbHint = getVerbHint(currentCard.data);
  const verbTenseLabel = getVerbTenseLabel(currentCard.data);
  const wordProgress = getWordProgress(knownWords, chunkWords);
  const percentageScore = computePercentageScore(knownWords, chunkWords);

  return (
    <div 
      className="relative w-full bg-black text-white" 
      style={{ height: '100dvh', overflow: (isModalOpen || isProgressModalOpen) ? 'auto' : 'hidden' }}
    >
      <TopBar
        onGetLesson={handleLessonRequest}
        onClearProgress={clearProgress}
        skipVerbs={skipVerbs}
        onToggleSkipVerbs={handleToggleSkipVerbs}
        showExamples={showExamples}
        onToggleExamples={handleToggleExamples}
        wordProgress={wordProgress}
        percentageScore={percentageScore}
        cognitiveLoad={cognitiveLoad}
        knownWords={knownWords}
        onShowProgress={() => setIsProgressModalOpen(true)}
        reviewMode={reviewMode}
        onModeChange={handleModeChange}
        hasExampleWords={hasExampleWords}
      />

      <div className="flex items-center justify-center px-4" style={{ height: 'calc(100svh - 140px)' }}>
        <FlashCard
          word={currentCard.data}
          isFlipped={isFlipped}
          showEnglish={showEnglish}
          showImageHint={showImageHint}
          showExamples={showExamples}
          revealedExamples={revealedExamples}
          verbHint={verbHint}
          verbTenseLabel={verbTenseLabel}
          reviewMode={reviewMode}
          onImageClick={handleImageClick}
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

      <LessonModal
        isOpen={isModalOpen}
        onClose={closeModal}
        georgianWord={currentCard.data.GeorgianWord}
        lessonContent={lessonMarkdown}
        isLoading={isLessonLoading}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        knownWords={knownWords}
        skipVerbs={skipVerbs}
      />
    </div>
  );
}
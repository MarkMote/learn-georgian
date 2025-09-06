import { useState, useEffect, useCallback } from 'react';
import { CustomWord, CustomWordData, CustomReviewMode, CustomExampleMode } from '../types';
import { createCustomWordData, getCustomProgressKey } from '../utils';

interface CustomReviewState {
  knownWords: CustomWordData[];
  currentIndex: number;
  isFlipped: boolean;
  showExamples: CustomExampleMode;
  revealedExamples: Set<string>;
  isLeftHanded: boolean;
  cognitiveLoad: number;
  setIsFlipped: (flipped: boolean) => void;
  setShowExamples: (mode: CustomExampleMode) => void;
  setRevealedExamples: (examples: Set<string>) => void;
  setCurrentIndex: (index: number) => void;
  setIsLeftHanded: (leftHanded: boolean) => void;
  handleScore: (rating: 'fail' | 'hard' | 'good' | 'easy') => void;
  clearProgress: () => void;
}

export function useCustomReviewState(
  customWords: CustomWord[], 
  reviewMode: CustomReviewMode
): CustomReviewState {
  const [knownWords, setKnownWords] = useState<CustomWordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState<CustomExampleMode>('off');
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  const progressKey = getCustomProgressKey();

  // Initialize known words from custom words
  useEffect(() => {
    if (customWords.length === 0) return;

    // Load existing progress or create new data
    const storedProgress = localStorage.getItem(progressKey);
    let progressData: Record<string, Partial<CustomWordData>> = {};
    
    if (storedProgress) {
      try {
        progressData = JSON.parse(storedProgress);
      } catch {
        progressData = {};
      }
    }

    const wordData = customWords.map(word => {
      const existing = progressData[word.key];
      if (existing) {
        return {
          data: word,
          easinessFactor: existing.easinessFactor || 2.5,
          interval: existing.interval || 1,
          repetitions: existing.repetitions || 0,
          nextReviewDate: existing.nextReviewDate ? new Date(existing.nextReviewDate) : new Date()
        };
      }
      return createCustomWordData(word);
    });

    setKnownWords(wordData);
  }, [customWords, progressKey]);

  // Load settings from localStorage
  useEffect(() => {
    const leftHanded = localStorage.getItem('isLeftHanded') === 'true';
    const examples = localStorage.getItem('showExamples') as CustomExampleMode || 'off';
    
    setIsLeftHanded(leftHanded);
    setShowExamples(examples);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('isLeftHanded', isLeftHanded.toString());
  }, [isLeftHanded]);

  useEffect(() => {
    localStorage.setItem('showExamples', showExamples);
  }, [showExamples]);

  // Reset flip state when index changes
  useEffect(() => {
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [currentIndex]);

  // Save progress after scoring
  const saveProgress = useCallback((updatedWords: CustomWordData[]) => {
    const progressData: Record<string, Partial<CustomWordData>> = {};
    
    updatedWords.forEach(wordData => {
      progressData[wordData.data.key] = {
        easinessFactor: wordData.easinessFactor,
        interval: wordData.interval,
        repetitions: wordData.repetitions,
        nextReviewDate: wordData.nextReviewDate
      };
    });
    
    localStorage.setItem(progressKey, JSON.stringify(progressData));
  }, [progressKey]);

  // Handle scoring (simplified version of spaced repetition)
  const handleScore = useCallback((rating: 'fail' | 'hard' | 'good' | 'easy') => {
    if (currentIndex >= knownWords.length) return;

    const updatedWords = [...knownWords];
    const currentWord = updatedWords[currentIndex];

    // Simple spaced repetition algorithm
    let newEasinessFactor = currentWord.easinessFactor;
    let newInterval = currentWord.interval;
    let newRepetitions = currentWord.repetitions;

    switch (rating) {
      case 'fail':
        newRepetitions = 0;
        newInterval = 1;
        break;
      case 'hard':
        newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.15);
        newRepetitions += 1;
        newInterval = Math.ceil(newInterval * newEasinessFactor);
        break;
      case 'good':
        newRepetitions += 1;
        newInterval = Math.ceil(newInterval * newEasinessFactor);
        break;
      case 'easy':
        newEasinessFactor = newEasinessFactor + 0.15;
        newRepetitions += 1;
        newInterval = Math.ceil(newInterval * newEasinessFactor * 1.3);
        break;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    updatedWords[currentIndex] = {
      ...currentWord,
      easinessFactor: newEasinessFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate
    };

    setKnownWords(updatedWords);
    saveProgress(updatedWords);

    // Move to next card
    const nextIndex = (currentIndex + 1) % knownWords.length;
    setCurrentIndex(nextIndex);
  }, [knownWords, currentIndex, saveProgress]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(progressKey);
    const resetWords = customWords.map(createCustomWordData);
    setKnownWords(resetWords);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [customWords, progressKey]);

  // Calculate cognitive load (simplified)
  const cognitiveLoad = knownWords.length > 0 
    ? Math.round((knownWords.filter(w => w.easinessFactor < 2.0).length / knownWords.length) * 100)
    : 0;

  return {
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
  };
}
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CustomWord, CustomWordData, CustomReviewMode, CustomExampleMode } from '../../../app/custom/types';
import { createCustomWordData, getCustomProgressKey } from '../../../app/custom/utils';
import { DifficultyRating } from '../types';

export function useCustomReviewState(
  customWords: CustomWord[], 
  reviewMode: CustomReviewMode
) {
  const [knownWords, setKnownWords] = useState<CustomWordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState<CustomExampleMode>('off');
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  const progressKey = getCustomProgressKey();
  const reviewStateKey = 'custom-deck-review-state';

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

  // Load settings and review state from localStorage
  useEffect(() => {
    const leftHanded = localStorage.getItem('isLeftHanded') === 'true';
    const examples = localStorage.getItem('showExamples') as CustomExampleMode || 'off';
    
    setIsLeftHanded(leftHanded);
    setShowExamples(examples);
  }, []);

  // Load review state after words are loaded
  useEffect(() => {
    if (knownWords.length === 0) return;

    const storedReviewState = localStorage.getItem(reviewStateKey);
    if (storedReviewState) {
      try {
        const { currentIndex: savedIndex } = JSON.parse(storedReviewState);
        if (typeof savedIndex === 'number' && savedIndex >= 0 && savedIndex < knownWords.length) {
          setCurrentIndex(savedIndex);
        }
      } catch {
        // Invalid stored state, ignore
      }
    }
  }, [knownWords.length, reviewStateKey]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('isLeftHanded', isLeftHanded.toString());
  }, [isLeftHanded]);

  useEffect(() => {
    localStorage.setItem('showExamples', showExamples);
  }, [showExamples]);

  // Save review state when current index changes
  useEffect(() => {
    if (knownWords.length > 0) {
      const reviewState = {
        currentIndex,
        timestamp: Date.now()
      };
      localStorage.setItem(reviewStateKey, JSON.stringify(reviewState));
    }
  }, [currentIndex, knownWords.length, reviewStateKey]);

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

  // Calculate which card should be shown next based on review dates and difficulty
  const getNextCardIndex = useCallback((words: CustomWordData[], exclude: number = -1): number => {
    if (words.length === 0) return 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find cards that are due for review (nextReviewDate <= today)
    const dueCards = words
      .map((word, index) => ({ word, index }))
      .filter(({ index }) => index !== exclude)
      .filter(({ word }) => {
        const reviewDate = new Date(word.nextReviewDate);
        const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
        return reviewDateOnly <= today;
      });
    
    if (dueCards.length > 0) {
      // Sort by priority: earliest due date first, then by difficulty (lower ease factor = higher priority)
      dueCards.sort((a, b) => {
        const dateA = new Date(a.word.nextReviewDate);
        const dateB = new Date(b.word.nextReviewDate);
        const dateDiff = dateA.getTime() - dateB.getTime();
        
        if (Math.abs(dateDiff) < 24 * 60 * 60 * 1000) { // Same day
          // Prioritize harder cards (lower ease factor)
          return a.word.easinessFactor - b.word.easinessFactor;
        }
        
        return dateDiff;
      });
      
      return dueCards[0].index;
    }
    
    // No due cards, find the earliest upcoming review
    const upcomingCards = words
      .map((word, index) => ({ word, index }))
      .filter(({ index }) => index !== exclude)
      .sort((a, b) => {
        const dateA = new Date(a.word.nextReviewDate);
        const dateB = new Date(b.word.nextReviewDate);
        return dateA.getTime() - dateB.getTime();
      });
    
    return upcomingCards.length > 0 ? upcomingCards[0].index : 0;
  }, []);

  // Handle scoring with proper spaced repetition algorithm
  const handleScore = useCallback((rating: DifficultyRating) => {
    if (currentIndex >= knownWords.length) return;

    const updatedWords = [...knownWords];
    const currentWord = updatedWords[currentIndex];
    
    console.log(`Scoring word "${currentWord.data.front}" as "${rating}"`);
    console.log('Before:', { 
      easinessFactor: currentWord.easinessFactor, 
      interval: currentWord.interval, 
      repetitions: currentWord.repetitions 
    });

    // Apply spaced repetition algorithm
    let newEasinessFactor = currentWord.easinessFactor;
    let newInterval = currentWord.interval;
    let newRepetitions = currentWord.repetitions;

    switch (rating) {
      case 'fail':
        // Reset progress for failed cards
        newRepetitions = 0;
        newInterval = 1;
        newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.2);
        break;
      
      case 'hard':
        // Slightly reduce ease factor, shorter interval
        newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.15);
        newRepetitions += 1;
        
        if (newRepetitions === 1) {
          newInterval = 1;
        } else if (newRepetitions === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.max(1, Math.ceil(newInterval * newEasinessFactor * 0.8));
        }
        break;
      
      case 'good':
        // Standard progression
        newRepetitions += 1;
        
        if (newRepetitions === 1) {
          newInterval = 1;
        } else if (newRepetitions === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.max(1, Math.ceil(newInterval * newEasinessFactor));
        }
        break;
      
      case 'easy':
        // Increase ease factor, longer interval
        newEasinessFactor = Math.min(4.0, newEasinessFactor + 0.15);
        newRepetitions += 1;
        
        if (newRepetitions === 1) {
          newInterval = 4; // Start with longer interval for easy cards
        } else if (newRepetitions === 2) {
          newInterval = 10;
        } else {
          newInterval = Math.max(1, Math.ceil(newInterval * newEasinessFactor * 1.3));
        }
        break;
    }

    // Cap maximum interval at 365 days
    newInterval = Math.min(newInterval, 365);

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update the word
    updatedWords[currentIndex] = {
      ...currentWord,
      easinessFactor: newEasinessFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate
    };

    console.log('After:', { 
      easinessFactor: newEasinessFactor, 
      interval: newInterval, 
      repetitions: newRepetitions,
      nextReviewDate: nextReviewDate.toDateString()
    });

    setKnownWords(updatedWords);
    saveProgress(updatedWords);

    // Move to next card based on spaced repetition priorities
    const nextIndex = getNextCardIndex(updatedWords, currentIndex);
    console.log(`Moving from index ${currentIndex} to ${nextIndex}`);
    setCurrentIndex(nextIndex);
  }, [knownWords, currentIndex, saveProgress, getNextCardIndex]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(progressKey);
    localStorage.removeItem(reviewStateKey);
    const resetWords = customWords.map(createCustomWordData);
    setKnownWords(resetWords);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [customWords, progressKey, reviewStateKey]);

  // Calculate cognitive load (percentage of cards with easiness factor below average)
  const cognitiveLoad = useMemo(() => {
    if (knownWords.length === 0) return 0;
    return Math.round((knownWords.filter(w => w.easinessFactor < 2.5).length / knownWords.length) * 100);
  }, [knownWords]);

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
"use client";

import { useState, useEffect, useRef } from "react";
import { PlayLine, KnownLineState, DifficultyRating } from "../types";

function difficultyToScore(diff: DifficultyRating): number {
  switch (diff) {
    case "easy": return 3;
    case "good": return 2;
    case "hard": return 1;
    case "fail": return 0;
    default: return 0;
  }
}

function calculateLinePriority(line: KnownLineState): number {
  const { rating, lastSeen, interval } = line;
  
  // Similar to word algorithm but adapted for lines
  if (lastSeen >= interval) {
    return 100 + (lastSeen - interval) * 10 + (3 - rating) * 5;
  }
  
  const urgency = Math.max(0, interval - lastSeen);
  return (3 - rating) * 2 - urgency * 0.1;
}

const STORAGE_KEY = 'readState_sample';

export function useReadState(playLines: PlayLine[]) {
  const [knownLines, setKnownLines] = useState<KnownLineState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showEnglishFirst, setShowEnglishFirst] = useState<boolean>(false);
  const [readingPosition, setReadingPosition] = useState<number>(0);
  
  const knownLinesRef = useRef(knownLines);
  
  useEffect(() => {
    knownLinesRef.current = knownLines;
  }, [knownLines]);

  // Load saved state
  useEffect(() => {
    if (playLines.length === 0) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownLines && Array.isArray(parsed.knownLines)) {
          setKnownLines(parsed.knownLines);
          setCurrentIndex(parsed.currentIndex ?? 0);
          setShowEnglishFirst(parsed.showEnglishFirst ?? false);
          setReadingPosition(parsed.readingPosition ?? 0);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading saved state:", err);
    }

    // No saved state, introduce first line
    if (knownLines.length === 0) {
      introduceNextLine();
    }
  }, [playLines]);

  // Save state
  useEffect(() => {
    if (knownLines.length > 0) {
      const toSave = {
        knownLines,
        currentIndex,
        showEnglishFirst,
        readingPosition,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [knownLines, currentIndex, showEnglishFirst, readingPosition]);

  const introduceNextLine = () => {
    if (playLines.length === 0) return;
    
    const knownIds = new Set(knownLines.map(kl => kl.data.id));
    const nextLine = playLines.find(line => !knownIds.has(line.id));
    
    if (!nextLine) return;

    const newLineState: KnownLineState = {
      data: nextLine,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    setKnownLines(prev => [...prev, newLineState]);
    
    // Update reading position
    const lineIndex = playLines.findIndex(line => line.id === nextLine.id);
    if (lineIndex >= readingPosition) {
      setReadingPosition(lineIndex + 1);
    }
  };

  const handleScore = (diff: DifficultyRating) => {
    setKnownLines(prev => {
      const updated = [...prev];
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex}`);
        setCurrentIndex(0);
        return prev;
      }

      const lineState = updated[currentIndex];
      const score = difficultyToScore(diff);
      lineState.rating = score;

      // Update spaced repetition algorithm (same as words)
      if (score === 0) {
        lineState.repetitions = 0;
        lineState.interval = 1;
      } else {
        lineState.repetitions += 1;
        if (lineState.repetitions === 1) {
          lineState.interval = 1;
        } else if (lineState.repetitions === 2) {
          lineState.interval = 6;
        } else {
          lineState.interval = Math.round(lineState.interval * lineState.easeFactor);
        }
        lineState.interval = Math.min(lineState.interval, 365);
      }

      const normalizedScore = score / 3;
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      lineState.easeFactor = Math.max(1.3, lineState.easeFactor + easeChange);
      lineState.lastSeen = 0;

      // Update lastSeen for other lines
      const updatedWithLastSeen = updated.map((kl, i) =>
        i === currentIndex ? kl : { ...kl, lastSeen: kl.lastSeen + 1 }
      );

      // Find next line to review
      let bestIdx = -1;
      let bestVal = -Infinity;
      
      updatedWithLastSeen.forEach((kl, idx) => {
        const priority = calculateLinePriority(kl);
        const randomFactor = Math.random() * 0.001;
        const adjustedPriority = priority + randomFactor;
        
        if (adjustedPriority > bestVal) {
          bestVal = adjustedPriority;
          bestIdx = idx;
        }
      });

      if (bestIdx === -1 && updatedWithLastSeen.length > 0) {
        bestIdx = 0;
      }

      setCurrentIndex(bestIdx);
      setIsFlipped(false);

      return updatedWithLastSeen;
    });

    // Check if we should introduce a new line
    setTimeout(() => {
      const currentKnownLines = knownLinesRef.current;
      if (currentKnownLines.length > 0) {
        const avgScore = currentKnownLines.reduce((sum, kl) => sum + kl.rating / 3, 0) / currentKnownLines.length;
        const cognitiveLoad = currentKnownLines.reduce((sum, kl) => sum + (3 - kl.rating), 0) / 3;
        
        // Introduce new line if average performance > 0.75 and cognitive load < 5
        if (avgScore > 0.75 && cognitiveLoad < 5) {
          introduceNextLine();
        }
      }
    }, 0);
  };

  const getContextLines = (): PlayLine[] => {
    if (knownLines.length === 0 || currentIndex >= knownLines.length) return [];
    
    const currentLine = knownLines[currentIndex].data;
    const currentLineIndex = playLines.findIndex(line => line.id === currentLine.id);
    
    if (currentLineIndex <= 0) return [];
    
    // Show up to 2 previous lines as context
    const startIndex = Math.max(0, currentLineIndex - 2);
    return playLines.slice(startIndex, currentLineIndex);
  };

  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKnownLines([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReadingPosition(0);
    
    setTimeout(() => {
      if (playLines.length > 0) {
        introduceNextLine();
      }
    }, 100);
  };

  return {
    knownLines,
    currentIndex,
    isFlipped,
    showEnglishFirst,
    readingPosition,
    setIsFlipped,
    setShowEnglishFirst,
    handleScore,
    getContextLines,
    clearProgress,
  };
}
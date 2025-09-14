import { useState, useEffect, useRef, useCallback } from 'react';
import { CustomWord, CustomWordData, CustomReviewMode, CustomExampleMode } from '../../../app/custom/types';
import { createCustomWordData, getCustomProgressKey } from '../../../app/custom/utils';

/**
 * Known card state with SM-2 properties (copied from prototype phrases):
 *   rating: 0..3 → 0=fail,1=hard,2=good,3=easy
 *   lastSeen: how many picks ago we last displayed it
 *   interval, repetitions, easeFactor are used to schedule reviews
 */
interface KnownCustomWordState {
  data: CustomWord;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

/** Convert difficulty label to a numeric score (0..3). */
function difficultyToScore(difficulty: "easy" | "good" | "hard" | "fail"): number {
  switch (difficulty) {
    case "easy":
      return 3;
    case "good":
      return 2;
    case "hard":
      return 1;
    case "fail":
      return 0;
  }
}

export function useCustomReviewState(
  customWords: CustomWord[], 
  reviewMode: CustomReviewMode
) {
  const [knownWords, setKnownWords] = useState<KnownCustomWordState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [showExamples, setShowExamples] = useState<CustomExampleMode>('off');
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [cardCounter, setCardCounter] = useState<number>(0);

  const progressKey = getCustomProgressKey();
  const reviewStateKey = 'custom-deck-review-state';

  // Ref to get immediate access to knownWords length for initialization check
  const knownWordsRef = useRef(knownWords);
  useEffect(() => {
    knownWordsRef.current = knownWords;
  }, [knownWords]);

  // Declare currentCard *before* the useEffect that uses it
  const currentCard = (knownWords.length > 0 && currentIndex >= 0 && currentIndex < knownWords.length)
    ? knownWords[currentIndex]
    : null;

  // Initialize known words from custom words
  useEffect(() => {
    if (customWords.length === 0) return;

    let loadedState = false;
    try {
      const stored = localStorage.getItem(progressKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          const validStoredWords = parsed.knownWords.filter((kw: KnownCustomWordState) =>
            customWords.some(cw => cw.key === kw.data.key)
          );

          if (validStoredWords.length > 0) {
            console.log(`Loading ${validStoredWords.length} valid words from localStorage.`);
            setKnownWords(validStoredWords);
            const newIndex = (parsed.currentIndex >= 0 && parsed.currentIndex < validStoredWords.length) ? parsed.currentIndex : 0;
            setCurrentIndex(newIndex);
            loadedState = true;
          } else {
            console.log("localStorage found but contained no words matching the current deck. Clearing.");
            localStorage.removeItem(progressKey);
          }
        } else {
          console.log("localStorage found but invalid content. Clearing.");
          localStorage.removeItem(progressKey);
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
      localStorage.removeItem(progressKey);
    }

    if (!loadedState && knownWordsRef.current.length === 0) {
      console.log("No valid saved state found. Introducing first word.");
      introduceRandomKnownWord();
    }
  }, [customWords, progressKey]);

  // Load settings from localStorage
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

  // Save progress when known words change
  useEffect(() => {
    if (knownWords.length > 0 || currentIndex !== 0) {
      const toSave = {
        knownWords,
        currentIndex,
      };
      localStorage.setItem(progressKey, JSON.stringify(toSave));
    }
  }, [knownWords, currentIndex, progressKey]);

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

  // Attempt to recover by setting index to 0 if it becomes invalid
  useEffect(() => {
    if (!currentCard && knownWords.length > 0 && currentIndex !== 0) {
      console.warn(`No current card (index ${currentIndex}), but ${knownWords.length} knownWords exist. Resetting index to 0.`);
      setCurrentIndex(0);
    }
  }, [currentCard, knownWords, currentIndex]);

  // Introduce a new random word
  function introduceRandomKnownWord() {
    if (customWords.length === 0) {
      console.log("Cannot introduce word: No words available.");
      return;
    }

    // Filter out words that are already introduced
    const knownKeys = new Set(knownWordsRef.current.map((k) => k.data.key));
    const candidates = customWords.filter((w) => !knownKeys.has(w.key));
    if (candidates.length === 0) {
      console.log("No new words left to introduce.");
      return;
    }

    // Pick a random candidate
    const newWord = candidates[Math.floor(Math.random() * candidates.length)];

    // Convert to KnownCustomWordState
    const newEntry: KnownCustomWordState = {
      data: newWord,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    // Add to knownWords
    setKnownWords((prev) => [...prev, newEntry]);
    // Set the current index to the newly added word
    setCurrentIndex(knownWordsRef.current.length);
    setIsFlipped(false);
    console.log(`Introduced new word: ${newWord.key}`);
  }

  // Handle rating (SM-2 logic) - copied exactly from prototype
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    // Ensure there is a current card to score
    if (!currentCard) {
      console.error("handleScore called but there is no current card.");
      return;
    }

    setKnownWords((prev) => {
      const updated = [...prev];
      // Double-check currentIndex validity
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex} in handleScore. This should not happen.`);
        setCurrentIndex(0);
        return prev;
      }
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      console.log(`Handling score for card index ${currentIndex}, word: ${cardState.data.key}, score: ${diff}(${score})`);
      cardState.rating = score;

      const normalizedScore = score / 3;
      // Simple SM-2 approach
      if (score === 0) {
        cardState.repetitions = 0;
        cardState.interval = 1;
      } else {
        cardState.repetitions += 1;
        if (cardState.repetitions === 1) {
          cardState.interval = 1;
        } else if (cardState.repetitions === 2) {
          cardState.interval = 6;
        } else {
          cardState.interval = Math.round(
            cardState.interval * cardState.easeFactor
          );
        }
      }
      // Adjust ease factor
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      cardState.easeFactor = Math.max(1.3, cardState.easeFactor + easeChange);

      cardState.lastSeen = 0;
      return updated;
    });

    // Introduction Trigger Logic - copied exactly from prototype
    setTimeout(() => {
      let introductionTriggerScore = 0;
      const currentKnownWords = knownWordsRef.current;

      if (currentKnownWords.length > 0) {
        const relevantWords = currentKnownWords;

        if (relevantWords.length > 0) {
          const sum = relevantWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
          introductionTriggerScore = sum / relevantWords.length;
          console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)} (sum: ${sum.toFixed(3)}, count: ${relevantWords.length})`);
        } else {
          console.log(`No relevant words found for trigger score calculation.`);
        }
      } else {
        console.log("KnownWords is empty, cannot calculate trigger score.");
      }

      // Possibly introduce more cards if the score is high
      const knownKeys = new Set(currentKnownWords.map(kw => kw.data.key));
      const remainingWordsCount = customWords.filter(w => !knownKeys.has(w.key)).length;

      if (introductionTriggerScore > 0.75 && remainingWordsCount > 0) {
        console.log(`Threshold met (${introductionTriggerScore.toFixed(3)} > 0.75) and ${remainingWordsCount} words remaining. Attempting to introduce.`);
        introduceRandomKnownWord();
      } else {
        if (remainingWordsCount === 0) {
          console.log(`Threshold met but no new words left to introduce.`);
        } else {
          console.log(`Threshold (0.75) not met. Score: ${introductionTriggerScore.toFixed(3)}. Skipping word introduction.`);
        }
        // Only pick next card if not introducing
        pickNextCard();
      }
    }, 0);
  }

  /** Average rating/3 across ALL known words. */
  function computeOverallScore(): number {
    if (knownWords.length === 0) return 0;
    const sum = knownWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
    return sum / knownWords.length;
  }

  /** Priority for SM-2 scheduling: overdue cards get higher priority. */
  function calculateCardPriority(card: KnownCustomWordState): number {
    const normalizedRating = card.rating / 3;
    const overdueFactor = card.lastSeen / card.interval;
    const difficultyFactor = 1 + (1 - normalizedRating) * 2;

    if (overdueFactor >= 1) {
      return overdueFactor * difficultyFactor;
    }
    // Not overdue => a small fraction so that eventually it's surfaced
    return 0.1 * overdueFactor * difficultyFactor;
  }

  /** Pick the next card by the highest priority. */
  function pickNextCard() {
    setCardCounter((n) => n + 1);

    setKnownWords((prev) => {
      // Ensure prev is not empty before proceeding
      if (prev.length === 0) {
        console.warn("pickNextCard called with empty knownWords.");
        return prev;
      }

      // Increment lastSeen for all cards except the one just shown
      const updatedLastSeen = prev.map((kw, i) =>
        (currentIndex >= 0 && i === currentIndex) ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

      const candidates = updatedLastSeen;

      // Find the highest priority card among the candidates
      let bestIdx = -1;
      let bestVal = -Infinity;
      const priorities = candidates.map(kw => calculateCardPriority(kw));
      priorities.forEach((priority, index) => {
        if (priority > bestVal) {
          bestVal = priority;
          bestIdx = index;
        }
      });

      // If no suitable candidate was found, default to 0
      if (bestIdx === -1 && updatedLastSeen.length > 0) {
        console.warn("No suitable next card found based on priority, defaulting to index 0.");
        bestIdx = 0;
      } else if (bestIdx === -1) {
        console.warn("Known words list is empty in pickNextCard.");
        return updatedLastSeen;
      }

      // Only update state if the index actually changes or if it's the only card
      if (bestIdx !== currentIndex || updatedLastSeen.length === 1) {
        setCurrentIndex(bestIdx);
      } else {
        console.log(`Picking the same card index: ${bestIdx}`);
      }

      return updatedLastSeen;
    });

    setIsFlipped(false);
    setShowEnglish(false);
  }

  const clearProgress = useCallback(() => {
    console.log('Clearing progress...');
    localStorage.removeItem(progressKey);
    localStorage.removeItem(reviewStateKey);
    setKnownWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEnglish(false);
    setRevealedExamples(new Set());
    setCardCounter(0);

    // Introduce the first word after clearing
    setTimeout(() => {
      if (customWords.length > 0) {
        introduceRandomKnownWord();
      } else {
        console.log("Clear progress: Cannot introduce first word yet (no words).");
      }
    }, 100);
  }, [customWords, progressKey, reviewStateKey]);

  // Calculate cognitive load (simple version matching what was there before)
  const cognitiveLoad = knownWords.length > 0 
    ? Math.round((knownWords.filter(w => w.easeFactor < 2.0).length / knownWords.length) * 100)
    : 0;

  return {
    knownWords: knownWords.map(kw => ({
      data: kw.data,
      easinessFactor: kw.easeFactor,
      interval: kw.interval,
      repetitions: kw.repetitions,
      nextReviewDate: new Date(Date.now() + kw.interval * 24 * 60 * 60 * 1000)
    })) as CustomWordData[], // Convert back to expected format
    currentIndex,
    isFlipped,
    showEnglish,
    showExamples,
    revealedExamples,
    isLeftHanded,
    cognitiveLoad,
    setIsFlipped,
    setShowEnglish,
    setShowExamples,
    setRevealedExamples,
    setCurrentIndex,
    setIsLeftHanded,
    handleScore,
    clearProgress,
  };
}
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { WordData, KnownWordState, DifficultyRating, ReviewMode, ExampleMode } from "../../../app/review/[chunkId]/types";
import { ReviewCard, SpacedRepetitionConfig } from "../types";
import { createReviewStateManager } from "../state";
import { configPresets, mergeConfig } from "../config";
import { 
  calculateCognitiveLoad,
  shouldIntroduceNewCard,
  selectNextCard,
  updateCardWithSM2,
  updateLastSeenCounters
} from "../algorithm";

// Convert between legacy KnownWordState and generic ReviewCard
function knownWordToReviewCard(kw: KnownWordState): ReviewCard<WordData> {
  return {
    data: kw.data,
    rating: kw.rating,
    lastSeen: kw.lastSeen,
    interval: kw.interval,
    repetitions: kw.repetitions,
    easeFactor: kw.easeFactor,
    exampleIndex: kw.exampleIndex
  };
}

function reviewCardToKnownWord(card: ReviewCard<WordData>): KnownWordState {
  return {
    data: card.data,
    rating: card.rating,
    lastSeen: card.lastSeen,
    interval: card.interval,
    repetitions: card.repetitions,
    easeFactor: card.easeFactor,
    exampleIndex: card.exampleIndex || 0
  };
}

function getLocalStorageKey(chunkId: string, mode: ReviewMode = "normal"): string {
  return `reviewState_${chunkId}_${mode}`;
}

// Get unique word keys (for grouping related words)
function getUniqueWordKeys(words: WordData[]): string[] {
  const uniqueKeys = new Set<string>();
  words.forEach(w => uniqueKeys.add(w.word_key));
  return Array.from(uniqueKeys);
}

export function useReviewState(
  chunkId: string, 
  chunkWords: WordData[], 
  reviewMode: ReviewMode = "normal",
  customConfig?: Partial<SpacedRepetitionConfig>
) {
  const [knownWords, setKnownWords] = useState<KnownWordState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [cardCounter, setCardCounter] = useState<number>(0);
  const [skipVerbs, setSkipVerbs] = useState<boolean>(false);
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [showImageHint, setShowImageHint] = useState<boolean>(true);
  const [showExamples, setShowExamples] = useState<ExampleMode>("tap-ka");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [cognitiveLoad, setCognitiveLoad] = useState<number>(0);

  const knownWordsRef = useRef(knownWords);
  
  // Memoize config to prevent infinite loops
  const config = useMemo(() => {
    return mergeConfig(customConfig || {}, configPresets.review);
  }, [customConfig]);
  
  useEffect(() => {
    knownWordsRef.current = knownWords;
  }, [knownWords]);

  // Update cognitive load whenever knownWords or skipVerbs changes
  useEffect(() => {
    if (knownWords.length > 0) {
      const relevantWords = skipVerbs
        ? knownWords.filter(kw => {
            const pos = kw.data.PartOfSpeech.toLowerCase();
            return !pos.includes("verb") || pos.includes("adverb");
          })
        : knownWords;

      if (relevantWords.length > 0) {
        const cards = relevantWords.map(knownWordToReviewCard);
        const currentCognitiveLoad = calculateCognitiveLoad(cards);
        setCognitiveLoad(currentCognitiveLoad);
      } else {
        setCognitiveLoad(0);
      }
    } else {
      setCognitiveLoad(0);
    }
  }, [knownWords, skipVerbs]);

  // Function to clean up corrupted data and remove ALL duplicates
  const cleanUpKnownWords = (words: KnownWordState[]): KnownWordState[] => {
    console.log("🧹 CLEANUP: Starting with", words.length, "words");
    
    const cleaned = words.map(word => ({
      ...word,
      interval: Math.min(Math.max(word.interval || 1, 1), 365),
      lastSeen: Math.max(word.lastSeen || 0, 0),
      rating: Math.min(Math.max(word.rating || 0, 0), 3),
      repetitions: Math.max(word.repetitions || 0, 0),
      easeFactor: Math.min(Math.max(word.easeFactor || 2.5, 1.3), 3.0)
    }));

    // Identify all duplicates first
    const keyCount = new Map<string, number>();
    const duplicateKeys = new Set<string>();
    
    cleaned.forEach(word => {
      const count = keyCount.get(word.data.key) || 0;
      keyCount.set(word.data.key, count + 1);
      if (count > 0) {
        duplicateKeys.add(word.data.key);
      }
    });

    if (duplicateKeys.size > 0) {
      console.log("🔍 CLEANUP: Found duplicate keys:", Array.from(duplicateKeys));
      console.log("🗑️ CLEANUP: Removing ALL instances of duplicate keys");
    }

    // Remove ALL instances of duplicate keys
    const result = cleaned.filter(word => !duplicateKeys.has(word.data.key));
    
    console.log("🧹 CLEANUP: Finished with", result.length, "words. Removed", words.length - result.length, "words (including all duplicates)");

    return result;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImageHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const introduceNextKnownWord = useCallback(() => {
    if (chunkWords.length === 0) return;

    const knownKeys = new Set(knownWords.map((k) => k.data.key));
    
    // Filter candidates based on mode
    let candidates = chunkWords.filter((w) => !knownKeys.has(w.key));
    
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      // Only include words that have examples
      candidates = candidates.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
      if (candidates.length === 0) {
        console.log("No more words with examples to introduce");
        return;
      }
    }
    
    if (candidates.length === 0) return;

    const uniqueWordKeys = getUniqueWordKeys(candidates);
    const knownWordKeys = new Set(knownWords.map(k => k.data.word_key));
    
    const nextWordKey = uniqueWordKeys.find(wordKey => !knownWordKeys.has(wordKey));
    if (!nextWordKey) return;

    const wordsToIntroduce = candidates.filter(w => w.word_key === nextWordKey);

    const newEntries: KnownWordState[] = wordsToIntroduce.map((w) => ({
      data: w,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      exampleIndex: 0,
    }));

    setKnownWords((prev) => [...prev, ...newEntries]);
  }, [chunkWords, knownWords, reviewMode]);

  useEffect(() => {
    if (chunkWords.length === 0) return;

    let loadedState = false;
    try {
      // Try to load mode-specific state first
      let stored = localStorage.getItem(getLocalStorageKey(chunkId, reviewMode));
      
      // Migration: If no mode-specific state exists but old state does, migrate it
      if (!stored && reviewMode === "normal") {
        const oldKey = `reviewState_${chunkId}`;
        const oldStored = localStorage.getItem(oldKey);
        if (oldStored) {
          console.log("Migrating old state to mode-specific state");
          localStorage.setItem(getLocalStorageKey(chunkId, "normal"), oldStored);
          localStorage.removeItem(oldKey);
          stored = oldStored;
        }
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          console.log(`Loading state for mode '${reviewMode}'. Word count:`, parsed.knownWords.length);
          const cleanedWords = cleanUpKnownWords(parsed.knownWords);
          console.log("After cleanup. Word count:", cleanedWords.length);
          setKnownWords(cleanedWords);
          setCurrentIndex((parsed.currentIndex >= 0 && parsed.currentIndex < cleanedWords.length) ? parsed.currentIndex : 0);
          setSkipVerbs(parsed.skipVerbs ?? false);
          setIsLeftHanded(parsed.isLeftHanded ?? false);
          loadedState = true;
        } else {
          console.log("localStorage found but invalid content. Clearing.");
          localStorage.removeItem(getLocalStorageKey(chunkId, reviewMode));
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
      localStorage.removeItem(getLocalStorageKey(chunkId, reviewMode));
    }

    if (!loadedState && knownWords.length === 0) {
      console.log(`No valid saved state found for mode '${reviewMode}'. Introducing first word.`);
      introduceNextKnownWord();
    }
  }, [chunkWords, chunkId, reviewMode]);

  useEffect(() => {
    if (knownWords.length > 0 || currentIndex !== 0 || skipVerbs || isLeftHanded) {
      const toSave = {
        knownWords,
        currentIndex,
        skipVerbs,
        isLeftHanded,
        reviewMode,
      };
      localStorage.setItem(getLocalStorageKey(chunkId, reviewMode), JSON.stringify(toSave));
    }
  }, [knownWords, currentIndex, skipVerbs, isLeftHanded, chunkId, reviewMode]);

  const handleScore = (diff: DifficultyRating) => {
    setKnownWords((prev) => {
      const updated = [...prev];
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex} for knownWords length ${updated.length}. Resetting index.`);
        setCurrentIndex(0);
        return prev;
      }
      
      const cardState = updated[currentIndex];
      
      // Convert to ReviewCard, update with algorithm, convert back
      const reviewCard = knownWordToReviewCard(cardState);
      const updatedCard = updateCardWithSM2(reviewCard, diff, config);
      updated[currentIndex] = reviewCardToKnownWord(updatedCard);
      
      console.log(`Handling score for card index ${currentIndex}, word: ${cardState.data.key}, score: ${diff}(${updatedCard.rating})`);
      
      // Now do the card picking logic in the same state update to avoid race conditions
      setCardCounter((n) => n + 1);
      
      // Update lastSeen for all other cards
      const cards = updated.map(knownWordToReviewCard);
      const updatedCards = updateLastSeenCounters(cards, currentIndex);
      const updatedLastSeen = updatedCards.map(reviewCardToKnownWord);

      let candidates = updatedLastSeen;

      if (skipVerbs) {
        const nonVerbCandidates = updatedLastSeen.filter(
          kw => {
            const pos = kw.data.PartOfSpeech.toLowerCase();
            return !pos.includes("verb") || pos.includes("adverb");
          }
        );
        if (nonVerbCandidates.length > 0) {
          candidates = nonVerbCandidates;
        }
      }

      // Use the centralized card selection
      const candidateCards = candidates.map(knownWordToReviewCard);
      const allCards = updatedLastSeen.map(knownWordToReviewCard);
      
      const filterFn = skipVerbs ? (card: ReviewCard<WordData>) => {
        const pos = card.data.PartOfSpeech.toLowerCase();
        return !pos.includes("verb") || pos.includes("adverb");
      } : undefined;
      
      const bestIdx = selectNextCard(allCards, currentIndex, undefined, filterFn);
      
      console.log(`Selected card index: ${bestIdx}`);

      if (bestIdx === -1) {
        console.warn("No suitable next card found.");
        return updatedLastSeen;
      }

      const selectedCard = updatedLastSeen[bestIdx];
      console.log(`🎯 SELECTED: "${selectedCard?.data.EnglishWord}" (${selectedCard?.data.key}) at index ${bestIdx}`);

      setCurrentIndex(bestIdx);
      setIsFlipped(false);
      setShowEnglish(false);
      setRevealedExamples(new Set());
      
      return updatedLastSeen;
    });

    // Handle word introduction separately after state settles
    setTimeout(() => {
      const currentKnownWords = knownWordsRef.current;

      if (currentKnownWords.length > 0) {
        const relevantWords = skipVerbs
          ? currentKnownWords.filter(kw => {
              const pos = kw.data.PartOfSpeech.toLowerCase();
              return !pos.includes("verb") || pos.includes("adverb");
            })
          : currentKnownWords;

        if (relevantWords.length > 0) {
          const cards = relevantWords.map(knownWordToReviewCard);
          const shouldIntroduce = shouldIntroduceNewCard(cards, config);
          const cognitiveLoad = calculateCognitiveLoad(cards);
          setCognitiveLoad(cognitiveLoad);
          
          console.log(`Cognitive load k: ${cognitiveLoad.toFixed(2)} (equivalent to ${cognitiveLoad.toFixed(1)} failed cards)`);
          
          if (shouldIntroduce) {
            console.log(`Thresholds met. Attempting to introduce new word.`);
            introduceNextKnownWord();
          } else {
            console.log("Skipping word introduction.");
          }
        }
      }
    }, 0);
  };

  const clearProgress = () => {
    localStorage.removeItem(getLocalStorageKey(chunkId, reviewMode));
    setKnownWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEnglish(false);
    setCardCounter(0);
    setSkipVerbs(false);
    setIsLeftHanded(false);
    setRevealedExamples(new Set());

    setTimeout(() => {
      if (chunkWords.length > 0) {
        introduceNextKnownWord();
      }
    }, 100);
  };

  return {
    knownWords,
    currentIndex,
    isFlipped,
    showEnglish,
    cardCounter,
    skipVerbs,
    isLeftHanded,
    showImageHint,
    showExamples,
    cognitiveLoad,
    reviewMode,
    setIsFlipped,
    setShowEnglish,
    setSkipVerbs,
    setIsLeftHanded,
    setShowImageHint,
    setShowExamples,
    revealedExamples,
    setRevealedExamples,
    setCurrentIndex,
    handleScore,
    clearProgress,
  };
}
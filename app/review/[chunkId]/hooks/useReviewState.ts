"use client";

import { useState, useEffect, useRef } from "react";
import { WordData, KnownWordState, DifficultyRating } from "../types";
import { 
  difficultyToScore, 
  getUniqueWordKeys, 
  calculateCardPriority 
} from "../utils/dataProcessing";

function getLocalStorageKey(chunkId: string): string {
  return `reviewState_${chunkId}`;
}

export function useReviewState(chunkId: string, chunkWords: WordData[]) {
  const [knownWords, setKnownWords] = useState<KnownWordState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [cardCounter, setCardCounter] = useState<number>(0);
  const [skipVerbs, setSkipVerbs] = useState<boolean>(false);
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [showImageHint, setShowImageHint] = useState<boolean>(true);
  const [showExamples, setShowExamples] = useState<"off" | "on" | "tap">("tap");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [cognitiveLoad, setCognitiveLoad] = useState<number>(0);

  const knownWordsRef = useRef(knownWords);
  
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
        const scoreSum = relevantWords.reduce((acc, kw) => acc + kw.rating, 0);
        const currentCognitiveLoad = (3 * relevantWords.length - scoreSum) / 3;
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
      interval: Math.min(Math.max(word.interval || 1, 1), 365), // Clamp interval between 1 and 365
      lastSeen: Math.max(word.lastSeen || 0, 0), // Ensure lastSeen is not negative
      rating: Math.min(Math.max(word.rating || 0, 0), 3), // Clamp rating between 0 and 3
      repetitions: Math.max(word.repetitions || 0, 0), // Ensure repetitions is not negative
      easeFactor: Math.min(Math.max(word.easeFactor || 2.5, 1.3), 3.0) // Clamp easeFactor between 1.3 and 3.0
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

  useEffect(() => {
    if (chunkWords.length === 0) return;

    let loadedState = false;
    try {
      const stored = localStorage.getItem(getLocalStorageKey(chunkId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          console.log("Loading state from localStorage. Word count:", parsed.knownWords.length);
          const cleanedWords = cleanUpKnownWords(parsed.knownWords);
          console.log("After cleanup. Word count:", cleanedWords.length);
          setKnownWords(cleanedWords);
          setCurrentIndex((parsed.currentIndex >= 0 && parsed.currentIndex < cleanedWords.length) ? parsed.currentIndex : 0);
          setSkipVerbs(parsed.skipVerbs ?? false);
          setIsLeftHanded(parsed.isLeftHanded ?? false);
          loadedState = true;
        } else {
          console.log("localStorage found but invalid content. Clearing.");
          localStorage.removeItem(getLocalStorageKey(chunkId));
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
      localStorage.removeItem(getLocalStorageKey(chunkId));
    }

    if (!loadedState && knownWords.length === 0) {
      console.log("No valid saved state found. Introducing first word.");
      introduceNextKnownWord();
    }
  }, [chunkWords, chunkId]);

  useEffect(() => {
    if (knownWords.length > 0 || currentIndex !== 0 || skipVerbs || isLeftHanded) {
      const toSave = {
        knownWords,
        currentIndex,
        skipVerbs,
        isLeftHanded,
      };
      localStorage.setItem(getLocalStorageKey(chunkId), JSON.stringify(toSave));
    }
  }, [knownWords, currentIndex, skipVerbs, isLeftHanded, chunkId]);

  const introduceNextKnownWord = () => {
    if (chunkWords.length === 0) return;

    const knownKeys = new Set(knownWords.map((k) => k.data.key));
    const candidates = chunkWords.filter((w) => !knownKeys.has(w.key));
    if (candidates.length === 0) return;

    const uniqueWordKeys = getUniqueWordKeys(chunkWords);
    const knownWordKeys = new Set(knownWords.map(k => k.data.word_key));
    
    const nextWordKey = uniqueWordKeys.find(wordKey => !knownWordKeys.has(wordKey));
    if (!nextWordKey) return;

    const wordsToIntroduce = chunkWords.filter(w => w.word_key === nextWordKey);

    const newEntries: KnownWordState[] = wordsToIntroduce.map((w) => ({
      data: w,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    }));

    setKnownWords((prev) => [...prev, ...newEntries]);
  };

  const handleScore = (diff: DifficultyRating) => {
    setKnownWords((prev) => {
      const updated = [...prev];
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex} for knownWords length ${updated.length}. Resetting index.`);
        setCurrentIndex(0);
        return prev;
      }
      
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      console.log(`Handling score for card index ${currentIndex}, word: ${cardState.data.key}, score: ${diff}(${score})`);
      cardState.rating = score;

      const normalizedScore = score / 3;
      
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
          cardState.interval = Math.round(cardState.interval * cardState.easeFactor);
        }
        
        // Add safeguard against interval overflow
        cardState.interval = Math.min(cardState.interval, 365); // Max 1 year
      }
      
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      cardState.easeFactor = Math.max(1.3, cardState.easeFactor + easeChange);

      cardState.lastSeen = 0;
      
      // Now do the card picking logic in the same state update to avoid race conditions
      setCardCounter((n) => n + 1);
      
      // Update lastSeen for all other cards
      const updatedLastSeen = updated.map((kw, i) =>
        i === currentIndex ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

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

      let bestIdx = -1;
      let bestVal = -Infinity;
      
      // Add small random factor to prevent getting stuck on cards with identical priorities
      candidates.forEach((kw) => {
        const priority = calculateCardPriority(kw);
        const randomFactor = Math.random() * 0.001; // Very small random component
        const adjustedPriority = priority + randomFactor;
        
        // Debug logging to help identify stuck cards
        console.log(`Card "${kw.data.EnglishWord}" (${kw.data.key}): rating=${kw.rating}, lastSeen=${kw.lastSeen}, interval=${kw.interval}, priority=${priority.toFixed(4)}, adjustedPriority=${adjustedPriority.toFixed(4)}`);
        
        if (adjustedPriority > bestVal) {
          bestVal = adjustedPriority;
          bestIdx = updatedLastSeen.findIndex(originalKw => originalKw.data.key === kw.data.key);
        }
      });
      
      console.log(`Selected card index: ${bestIdx}, bestVal: ${bestVal.toFixed(4)}`);

      if (bestIdx === -1 && updatedLastSeen.length > 0) {
        console.warn("No suitable next card found, defaulting to index 0.");
        bestIdx = 0;
      } else if (bestIdx === -1) {
        console.warn("Known words list is empty.");
        return updatedLastSeen;
      }

      const selectedCard = updatedLastSeen[bestIdx];
      console.log(`🎯 SELECTED: "${selectedCard?.data.EnglishWord}" (${selectedCard?.data.key}) at index ${bestIdx}`);

      setCurrentIndex(bestIdx);
      setIsFlipped(false);
      setShowEnglish(false);
      
      return updatedLastSeen;
    });

    // Handle word introduction separately after state settles
    setTimeout(() => {
      let introductionTriggerScore = 0;
      let cognitiveLoad = 0;
      const currentKnownWords = knownWordsRef.current;

      if (currentKnownWords.length > 0) {
        const relevantWords = skipVerbs
          ? currentKnownWords.filter(kw => {
              const pos = kw.data.PartOfSpeech.toLowerCase();
              return !pos.includes("verb") || pos.includes("adverb");
            })
          : currentKnownWords;

        if (relevantWords.length > 0) {
          const sum = relevantWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
          introductionTriggerScore = sum / relevantWords.length;
          
          // Calculate cognitive load: k = (3*N - sum(scores))/3
          const scoreSum = relevantWords.reduce((acc, kw) => acc + kw.rating, 0);
          cognitiveLoad = (3 * relevantWords.length - scoreSum) / 3;
          setCognitiveLoad(cognitiveLoad);
          
          console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)}`);
          console.log(`Cognitive load k: ${cognitiveLoad.toFixed(2)} (equivalent to ${cognitiveLoad.toFixed(1)} failed cards)`);
        }
      }

      // Calculate adaptive cognitive load threshold
      const numKnownWords = currentKnownWords.length;
      let cognitiveLoadThreshold = 5;
      if (numKnownWords > 50) {
        cognitiveLoadThreshold = 5 + 0.04 * (numKnownWords - 50);
      }
      
      // Both conditions must be met: average performance > 0.75 AND cognitive load < threshold
      if (introductionTriggerScore > 0.75 && cognitiveLoad < cognitiveLoadThreshold) {
        console.log(`Both thresholds met (k<${cognitiveLoadThreshold.toFixed(2)}). Attempting to introduce new word.`);
        introduceNextKnownWord();
      } else {
        if (introductionTriggerScore <= 0.75) {
          console.log(`Average performance threshold (0.75) not met. Score: ${introductionTriggerScore.toFixed(3)}`);
        }
        if (cognitiveLoad >= cognitiveLoadThreshold) {
          console.log(`Cognitive load threshold (k<${cognitiveLoadThreshold.toFixed(2)}) not met. Current k: ${cognitiveLoad.toFixed(2)}`);
        }
        console.log("Skipping word introduction.");
      }
    }, 0);
  };


  const clearProgress = () => {
    localStorage.removeItem(getLocalStorageKey(chunkId));
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
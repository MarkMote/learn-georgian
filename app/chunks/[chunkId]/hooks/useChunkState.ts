"use client";

import { useState, useEffect, useRef } from "react";
import { ChunkData, KnownChunkState, DifficultyRating, ReviewMode } from "../types";
import { 
  difficultyToScore, 
  getUniqueChunkKeys, 
  calculateCardPriority 
} from "../utils/dataProcessing";

function getLocalStorageKey(chunkId: string, mode: ReviewMode = "normal"): string {
  return `chunkState_${chunkId}_${mode}`;
}

export function useChunkState(chunkId: string, chunkSet: ChunkData[], reviewMode: ReviewMode = "normal") {
  const [knownChunks, setKnownChunks] = useState<KnownChunkState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [showExamples, setShowExamples] = useState<"off" | "on" | "tap">("tap");
  const [showExplanation, setShowExplanation] = useState<"off" | "on" | "tap">("tap");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set());
  const [cognitiveLoad, setCognitiveLoad] = useState<number>(0);

  const knownChunksRef = useRef(knownChunks);
  
  useEffect(() => {
    knownChunksRef.current = knownChunks;
  }, [knownChunks]);

  useEffect(() => {
    if (knownChunks.length > 0) {
      const scoreSum = knownChunks.reduce((acc, kc) => acc + kc.rating, 0);
      const currentCognitiveLoad = (3 * knownChunks.length - scoreSum) / 3;
      setCognitiveLoad(currentCognitiveLoad);
    } else {
      setCognitiveLoad(0);
    }
  }, [knownChunks]);

  const cleanUpKnownChunks = (chunks: KnownChunkState[]): KnownChunkState[] => {
    console.log("🧹 CLEANUP: Starting with", chunks.length, "chunks");
    
    const cleaned = chunks.map(chunk => ({
      ...chunk,
      interval: Math.min(Math.max(chunk.interval || 1, 1), 365),
      lastSeen: Math.max(chunk.lastSeen || 0, 0),
      rating: Math.min(Math.max(chunk.rating || 0, 0), 3),
      repetitions: Math.max(chunk.repetitions || 0, 0),
      easeFactor: Math.min(Math.max(chunk.easeFactor || 2.5, 1.3), 3.0)
    }));

    const keyCount = new Map<string, number>();
    const duplicateKeys = new Set<string>();
    
    cleaned.forEach(chunk => {
      const count = keyCount.get(chunk.data.chunk_key) || 0;
      keyCount.set(chunk.data.chunk_key, count + 1);
      if (count > 0) {
        duplicateKeys.add(chunk.data.chunk_key);
      }
    });

    if (duplicateKeys.size > 0) {
      console.log("🔍 CLEANUP: Found duplicate keys:", Array.from(duplicateKeys));
      console.log("🗑️ CLEANUP: Removing ALL instances of duplicate keys");
    }

    const result = cleaned.filter(chunk => !duplicateKeys.has(chunk.data.chunk_key));
    
    console.log("🧹 CLEANUP: Finished with", result.length, "chunks. Removed", chunks.length - result.length, "chunks (including all duplicates)");

    return result;
  };

  useEffect(() => {
    if (chunkSet.length === 0) return;

    let loadedState = false;
    try {
      const stored = localStorage.getItem(getLocalStorageKey(chunkId, reviewMode));
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownChunks && Array.isArray(parsed.knownChunks) && parsed.knownChunks.length > 0) {
          console.log(`Loading chunk state for mode '${reviewMode}'. Chunk count:`, parsed.knownChunks.length);
          const cleanedChunks = cleanUpKnownChunks(parsed.knownChunks);
          console.log("After cleanup. Chunk count:", cleanedChunks.length);
          setKnownChunks(cleanedChunks);
          setCurrentIndex((parsed.currentIndex >= 0 && parsed.currentIndex < cleanedChunks.length) ? parsed.currentIndex : 0);
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

    if (!loadedState && knownChunks.length === 0) {
      console.log(`No valid saved state found for chunk mode '${reviewMode}'. Introducing first chunk.`);
      introduceNextKnownChunk();
    }
  }, [chunkSet, chunkId, reviewMode]);

  useEffect(() => {
    if (knownChunks.length > 0 || currentIndex !== 0 || isLeftHanded) {
      const toSave = {
        knownChunks,
        currentIndex,
        isLeftHanded,
        reviewMode,
      };
      localStorage.setItem(getLocalStorageKey(chunkId, reviewMode), JSON.stringify(toSave));
    }
  }, [knownChunks, currentIndex, isLeftHanded, chunkId, reviewMode]);

  const introduceNextKnownChunk = () => {
    if (chunkSet.length === 0) return;

    const knownKeys = new Set(knownChunks.map((k) => k.data.chunk_key));
    
    let candidates = chunkSet.filter((c) => !knownKeys.has(c.chunk_key));
    
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      candidates = candidates.filter(c => c.example_en && c.example_ka);
      if (candidates.length === 0) {
        console.log("No more chunks with examples to introduce");
        return;
      }
    }
    
    if (candidates.length === 0) return;

    const nextChunk = candidates[0];
    if (!nextChunk) return;

    const newEntry: KnownChunkState = {
      data: nextChunk,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    setKnownChunks((prev) => [...prev, newEntry]);
  };

  const handleScore = (diff: DifficultyRating) => {
    setKnownChunks((prev) => {
      const updated = [...prev];
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex} for knownChunks length ${updated.length}. Resetting index.`);
        setCurrentIndex(0);
        return prev;
      }
      
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      console.log(`Handling score for card index ${currentIndex}, chunk: ${cardState.data.chunk_key}, score: ${diff}(${score})`);
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
        
        cardState.interval = Math.min(cardState.interval, 365);
      }
      
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      cardState.easeFactor = Math.max(1.3, cardState.easeFactor + easeChange);

      cardState.lastSeen = 0;
      
      const updatedLastSeen = updated.map((kc, i) =>
        i === currentIndex ? kc : { ...kc, lastSeen: kc.lastSeen + 1 }
      );

      const candidates = updatedLastSeen;

      let bestIdx = -1;
      let bestVal = -Infinity;
      
      candidates.forEach((kc) => {
        const priority = calculateCardPriority(kc);
        const randomFactor = Math.random() * 0.001;
        const adjustedPriority = priority + randomFactor;
        
        console.log(`Chunk "${kc.data.chunk_en}" (${kc.data.chunk_key}): rating=${kc.rating}, lastSeen=${kc.lastSeen}, interval=${kc.interval}, priority=${priority.toFixed(4)}, adjustedPriority=${adjustedPriority.toFixed(4)}`);
        
        if (adjustedPriority > bestVal) {
          bestVal = adjustedPriority;
          bestIdx = updatedLastSeen.findIndex(originalKc => originalKc.data.chunk_key === kc.data.chunk_key);
        }
      });
      
      console.log(`Selected chunk index: ${bestIdx}, bestVal: ${bestVal.toFixed(4)}`);

      if (bestIdx === -1 && updatedLastSeen.length > 0) {
        console.warn("No suitable next chunk found, defaulting to index 0.");
        bestIdx = 0;
      } else if (bestIdx === -1) {
        console.warn("Known chunks list is empty.");
        return updatedLastSeen;
      }

      const selectedChunk = updatedLastSeen[bestIdx];
      console.log(`🎯 SELECTED: "${selectedChunk?.data.chunk_en}" (${selectedChunk?.data.chunk_key}) at index ${bestIdx}`);

      setCurrentIndex(bestIdx);
      setIsFlipped(false);
      setRevealedExamples(new Set());
      setRevealedExplanations(new Set());
      
      return updatedLastSeen;
    });

    setTimeout(() => {
      let introductionTriggerScore = 0;
      let cognitiveLoad = 0;
      const currentKnownChunks = knownChunksRef.current;

      if (currentKnownChunks.length > 0) {
        const sum = currentKnownChunks.reduce((acc, kc) => acc + kc.rating / 3, 0);
        introductionTriggerScore = sum / currentKnownChunks.length;
        
        const scoreSum = currentKnownChunks.reduce((acc, kc) => acc + kc.rating, 0);
        cognitiveLoad = (3 * currentKnownChunks.length - scoreSum) / 3;
        setCognitiveLoad(cognitiveLoad);
        
        console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)}`);
        console.log(`Cognitive load k: ${cognitiveLoad.toFixed(2)} (equivalent to ${cognitiveLoad.toFixed(1)} failed chunks)`);
      }

      const numKnownChunks = currentKnownChunks.length;
      let cognitiveLoadThreshold = 5;
      if (numKnownChunks > 50) {
        cognitiveLoadThreshold = 5 + 0.04 * (numKnownChunks - 50);
      }
      
      if (introductionTriggerScore > 0.75 && cognitiveLoad < cognitiveLoadThreshold) {
        console.log(`Both thresholds met (k<${cognitiveLoadThreshold.toFixed(2)}). Attempting to introduce new chunk.`);
        introduceNextKnownChunk();
      } else {
        if (introductionTriggerScore <= 0.75) {
          console.log(`Average performance threshold (0.75) not met. Score: ${introductionTriggerScore.toFixed(3)}`);
        }
        if (cognitiveLoad >= cognitiveLoadThreshold) {
          console.log(`Cognitive load threshold (k<${cognitiveLoadThreshold.toFixed(2)}) not met. Current k: ${cognitiveLoad.toFixed(2)}`);
        }
        console.log("Skipping chunk introduction.");
      }
    }, 0);
  };

  const clearProgress = () => {
    localStorage.removeItem(getLocalStorageKey(chunkId, reviewMode));
    setKnownChunks([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsLeftHanded(false);
    setRevealedExamples(new Set());
    setRevealedExplanations(new Set());

    setTimeout(() => {
      if (chunkSet.length > 0) {
        introduceNextKnownChunk();
      }
    }, 100);
  };

  return {
    knownChunks,
    currentIndex,
    isFlipped,
    isLeftHanded,
    showExamples,
    showExplanation,
    cognitiveLoad,
    reviewMode,
    setIsFlipped,
    setIsLeftHanded,
    setShowExamples,
    setShowExplanation,
    revealedExamples,
    setRevealedExamples,
    revealedExplanations,
    setRevealedExplanations,
    setCurrentIndex,
    handleScore,
    clearProgress,
  };
}
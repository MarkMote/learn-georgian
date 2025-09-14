import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChunkData, KnownChunkState, DifficultyRating, ReviewMode } from "../../../app/chunks/[chunkId]/types";
import { ReviewCard, SpacedRepetitionConfig } from "../types";
import { configPresets, mergeConfig } from "../config";
import { 
  calculateCognitiveLoad,
  shouldIntroduceNewCard,
  selectNextCard,
  updateCardWithSM2,
  updateLastSeenCounters
} from "../algorithm";

// Convert between legacy KnownChunkState and generic ReviewCard
function knownChunkToReviewCard(kc: KnownChunkState): ReviewCard<ChunkData> {
  return {
    data: kc.data,
    rating: kc.rating,
    lastSeen: kc.lastSeen,
    interval: kc.interval,
    repetitions: kc.repetitions,
    easeFactor: kc.easeFactor
  };
}

function reviewCardToKnownChunk(card: ReviewCard<ChunkData>): KnownChunkState {
  return {
    data: card.data,
    rating: card.rating,
    lastSeen: card.lastSeen,
    interval: card.interval,
    repetitions: card.repetitions,
    easeFactor: card.easeFactor
  };
}

function getLocalStorageKey(chunkId: string, mode: ReviewMode = "normal"): string {
  return `chunkState_${chunkId}_${mode}`;
}

export function useChunkState(
  chunkId: string, 
  chunkSet: ChunkData[], 
  reviewMode: ReviewMode = "normal",
  customConfig?: Partial<SpacedRepetitionConfig>
) {
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
  
  // Memoize config to prevent infinite loops
  const config = useMemo(() => {
    return mergeConfig(customConfig || {}, configPresets.chunks);
  }, [customConfig]);
  
  useEffect(() => {
    knownChunksRef.current = knownChunks;
  }, [knownChunks]);

  useEffect(() => {
    if (knownChunks.length > 0) {
      const cards = knownChunks.map(knownChunkToReviewCard);
      const currentCognitiveLoad = calculateCognitiveLoad(cards);
      setCognitiveLoad(currentCognitiveLoad);
    } else {
      setCognitiveLoad(0);
    }
  }, [knownChunks]);

  const cleanUpKnownChunks = (chunks: KnownChunkState[]): KnownChunkState[] => {
    console.log("🧹 CLEANUP: Starting with", chunks.length, "chunks");
    
    const cleaned = chunks.map(chunk => ({
      ...chunk,
      interval: Math.min(Math.max(chunk.interval || 1, config.minInterval), config.maxInterval),
      lastSeen: Math.max(chunk.lastSeen || 0, 0),
      rating: Math.min(Math.max(chunk.rating || 0, 0), 3),
      repetitions: Math.max(chunk.repetitions || 0, 0),
      easeFactor: Math.min(Math.max(chunk.easeFactor || config.initialEaseFactor, config.minEaseFactor), config.maxEaseFactor)
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

  const introduceNextKnownChunk = useCallback(() => {
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
      interval: config.minInterval,
      repetitions: 0,
      easeFactor: config.initialEaseFactor,
    };

    setKnownChunks((prev) => [...prev, newEntry]);
  }, [chunkSet, knownChunks, reviewMode, config]);

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

  const handleScore = (diff: DifficultyRating) => {
    setKnownChunks((prev) => {
      const updated = [...prev];
      if (currentIndex < 0 || currentIndex >= updated.length) {
        console.error(`Invalid currentIndex ${currentIndex} for knownChunks length ${updated.length}. Resetting index.`);
        setCurrentIndex(0);
        return prev;
      }
      
      const cardState = updated[currentIndex];
      
      // Convert to ReviewCard, update with algorithm, convert back
      const reviewCard = knownChunkToReviewCard(cardState);
      const updatedCard = updateCardWithSM2(reviewCard, diff, config);
      updated[currentIndex] = reviewCardToKnownChunk(updatedCard);
      
      console.log(`Handling score for card index ${currentIndex}, chunk: ${cardState.data.chunk_key}, score: ${diff}(${updatedCard.rating})`);
      
      // Update lastSeen for all other cards
      const cards = updated.map(knownChunkToReviewCard);
      const updatedCards = updateLastSeenCounters(cards, currentIndex);
      const updatedLastSeen = updatedCards.map(reviewCardToKnownChunk);

      // Use the centralized card selection
      const allCards = updatedLastSeen.map(knownChunkToReviewCard);
      const bestIdx = selectNextCard(allCards, currentIndex);
      
      console.log(`Selected chunk index: ${bestIdx}`);

      if (bestIdx === -1) {
        console.warn("No suitable next chunk found.");
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
      const currentKnownChunks = knownChunksRef.current;

      if (currentKnownChunks.length > 0) {
        const cards = currentKnownChunks.map(knownChunkToReviewCard);
        const shouldIntroduce = shouldIntroduceNewCard(cards, config);
        const cognitiveLoad = calculateCognitiveLoad(cards);
        setCognitiveLoad(cognitiveLoad);
        
        console.log(`Cognitive load k: ${cognitiveLoad.toFixed(2)} (equivalent to ${cognitiveLoad.toFixed(1)} failed chunks)`);
        
        if (shouldIntroduce) {
          console.log(`Thresholds met. Attempting to introduce new chunk.`);
          introduceNextKnownChunk();
        } else {
          console.log("Skipping chunk introduction.");
        }
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
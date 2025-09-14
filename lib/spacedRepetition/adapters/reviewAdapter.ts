import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Deck,
  Grade,
  SRSConfig,
  DEFAULT_CONFIG,
  createCard,
  reviewCard,
  selectNextCard,
  getDeckStats,
  forgettingRisk
} from "../algorithm";

// Threshold for introducing new cards
const INTRO_RISK_THRESHOLD = 0.30;

interface ReviewAdapterOptions<T> {
  chunkId: string;
  mode: string;
  availableItems: T[];
  getItemKey: (item: T) => string;
  config?: Partial<SRSConfig>;
  filterPredicate?: (item: T) => boolean;
}

export function useSpacedRepetition<T>({
  chunkId,
  mode,
  availableItems,
  getItemKey,
  config: userConfig,
  filterPredicate
}: ReviewAdapterOptions<T>) {
  const config: SRSConfig = { ...DEFAULT_CONFIG, ...userConfig };

  // Core SRS state
  const [deck, setDeck] = useState<Deck<T>>({ cards: [], globalStep: 0 });
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Card introduction state
  const [consecutiveEasy, setConsecutiveEasy] = useState(0);

  // Storage key
  const storageKey = `srs_${chunkId}_${mode}_v3`;

  // Load state from localStorage
  useEffect(() => {
    if (availableItems.length === 0) return;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.cards && Array.isArray(parsed.cards)) {
          setDeck({
            cards: parsed.cards,
            globalStep: parsed.globalStep || 0
          });
          setCurrentIndex(parsed.currentIndex || 0);
          setConsecutiveEasy(parsed.consecutiveEasy || 0);
          return;
        }
      } catch (err) {
        console.error("Failed to load state:", err);
        localStorage.removeItem(storageKey);
      }
    }

    // Initialize with first card if no saved state
    if (availableItems.length > 0) {
      const firstCard = createCard(availableItems[0], 0);
      firstCard.introOrder = 0;
      setDeck({ cards: [firstCard], globalStep: 0 });
      setCurrentIndex(0);
    }
  }, [availableItems, storageKey]);

  // Save state to localStorage
  useEffect(() => {
    if (deck.cards.length > 0) {
      const toSave = {
        cards: deck.cards,
        globalStep: deck.globalStep,
        currentIndex,
        consecutiveEasy
      };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    }
  }, [deck, currentIndex, consecutiveEasy, storageKey]);

  // Get filtered cards for selection
  const getFilteredDeck = useCallback((): Deck<T> => {
    if (!filterPredicate) return deck;

    return {
      ...deck,
      cards: deck.cards.filter(c => filterPredicate(c.data))
    };
  }, [deck, filterPredicate]);

  // Introduce new card
  const introduceCard = useCallback(() => {
    setDeck(prev => {
      // Use prev state to ensure we have the latest cards
      const knownKeys = new Set(prev.cards.map(c => getItemKey(c.data)));
      const candidates = availableItems.filter(item => !knownKeys.has(getItemKey(item)));

      if (candidates.length === 0) return prev;

      // Check one more time that this card isn't already in the deck
      const candidateKey = getItemKey(candidates[0]);
      if (knownKeys.has(candidateKey)) {
        console.warn(`Attempted to add duplicate card: ${candidateKey}`);
        return prev;
      }

      const newCard = createCard(candidates[0], prev.globalStep);
      // Add introduction order based on how many cards are already in the deck
      newCard.introOrder = prev.cards.length;
      console.log(`Introducing card: ${candidateKey} (order: ${newCard.introOrder})`);

      return {
        ...prev,
        cards: [...prev.cards, newCard]
      };
    });
  }, [availableItems, getItemKey]);

  // Check if we should introduce a new card
  const shouldIntroduceCard = useCallback((deck: Deck<T>, consecutiveEasyCount: number): boolean => {
    const stats = getDeckStats(deck, config);

    // Condition 1: Average risk below threshold
    const lowRisk = stats.averageRisk < INTRO_RISK_THRESHOLD;

    // Condition 2: 4 consecutive easy grades
    const consecutiveEasyThreshold = consecutiveEasyCount >= 4;

    return lowRisk || consecutiveEasyThreshold;
  }, [config]);

  // Handle card review
  const handleReview = useCallback((grade: Grade) => {
    setDeck(prev => {
      if (currentIndex >= prev.cards.length) return prev;

      // Update current card
      const updatedCard = reviewCard(
        prev.cards[currentIndex],
        grade,
        prev.globalStep,
        config
      );

      const newCards = [...prev.cards];
      newCards[currentIndex] = updatedCard;
      const updatedDeck = { cards: newCards, globalStep: prev.globalStep + 1 };

      return updatedDeck;
    });

    // Update consecutive easy count
    setConsecutiveEasy(prev => {
      const newCount = grade === 3 ? prev + 1 : 0;

      // Check introduction conditions with the new count
      setTimeout(() => {
        setDeck(currentDeck => {
          // Single atomic decision: should we introduce a card?
          if (shouldIntroduceCard(currentDeck, newCount)) {
            console.log(`Introduction triggered - avgRisk: ${getDeckStats(currentDeck, config).averageRisk.toFixed(3)}, consecutiveEasy: ${newCount}`);

            // Introduce one card and reset consecutive counter
            const knownKeys = new Set(currentDeck.cards.map(c => getItemKey(c.data)));
            const candidates = availableItems.filter(item => !knownKeys.has(getItemKey(item)));

            if (candidates.length > 0) {
              const newCard = createCard(candidates[0], currentDeck.globalStep);
              newCard.introOrder = currentDeck.cards.length;
              console.log(`Introduced card: ${getItemKey(candidates[0])}`);

              // Reset consecutive easy count and update deck
              setConsecutiveEasy(0);

              const newDeck = {
                ...currentDeck,
                cards: [...currentDeck.cards, newCard]
              };

              // Select next card
              const filteredDeck = filterPredicate
                ? { ...newDeck, cards: newDeck.cards.filter(c => filterPredicate(c.data)) }
                : newDeck;

              const nextIndex = selectNextCard(filteredDeck, config);

              // Map back to unfiltered index if needed
              if (filterPredicate && nextIndex !== -1) {
                const selectedCard = filteredDeck.cards[nextIndex];
                const actualIndex = newDeck.cards.findIndex(c => c === selectedCard);
                setCurrentIndex(actualIndex);
              } else {
                setCurrentIndex(nextIndex);
              }

              return newDeck;
            }
          } else {
            // No introduction, just select next card
            const filteredDeck = filterPredicate
              ? { ...currentDeck, cards: currentDeck.cards.filter(c => filterPredicate(c.data)) }
              : currentDeck;

            const nextIndex = selectNextCard(filteredDeck, config);

            if (filterPredicate && nextIndex !== -1) {
              const selectedCard = filteredDeck.cards[nextIndex];
              const actualIndex = currentDeck.cards.findIndex(c => c === selectedCard);
              setCurrentIndex(actualIndex);
            } else {
              setCurrentIndex(nextIndex);
            }
          }

          return currentDeck;
        });
      }, 0);

      return newCount;
    });
  }, [currentIndex, config, filterPredicate, availableItems, getItemKey, shouldIntroduceCard]);

  // Reset progress
  const resetProgress = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDeck({ cards: [], globalStep: 0 });
    setCurrentIndex(0);
    setConsecutiveEasy(0);

    // Initialize with first card
    if (availableItems.length > 0) {
      const firstCard = createCard(availableItems[0], 0);
      firstCard.introOrder = 0;
      setDeck({ cards: [firstCard], globalStep: 0 });
    }
  }, [availableItems, storageKey]);

  // Get current card
  const currentCard = currentIndex >= 0 && currentIndex < deck.cards.length
    ? deck.cards[currentIndex]
    : null;

  // Get deck statistics
  const stats = getDeckStats(deck, config);

  return {
    // Core state
    currentCard,
    deck,
    currentIndex,

    // Statistics
    stats,

    // Actions
    handleReview,
    resetProgress,

    // Debug info
    consecutiveEasy
  };
}
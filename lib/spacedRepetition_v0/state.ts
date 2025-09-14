import { 
  ReviewCard, 
  DifficultyRating,
  SpacedRepetitionConfig,
  CardPriorityParams
} from "./types";
import {
  updateCardWithSM2,
  selectNextCard,
  updateLastSeenCounters,
  cleanupCards,
  shouldIntroduceNewCard,
  calculateCognitiveLoad
} from "./algorithm";
import { defaultConfig, defaultPriorityParams } from "./config";

export interface ReviewStateManager<T> {
  cards: ReviewCard<T>[];
  currentIndex: number;
  config: SpacedRepetitionConfig;
  priorityParams: CardPriorityParams;
  
  // Core operations
  handleScore: (difficulty: DifficultyRating) => void;
  introduceCard: (data: T) => void;
  removeCard: (index: number) => void;
  clearAll: () => void;
  
  // State accessors
  getCurrentCard: () => ReviewCard<T> | null;
  getCognitiveLoad: () => number;
  shouldIntroduceNew: () => boolean;
  
  // Persistence
  saveState: () => void;
  loadState: () => boolean;
}

export interface StateManagerOptions<T> {
  storageKey: string;
  getCardKey: (card: ReviewCard<T>) => string;
  config?: SpacedRepetitionConfig;
  priorityParams?: CardPriorityParams;
  filterFn?: (card: ReviewCard<T>) => boolean;
  onStateChange?: (state: { cards: ReviewCard<T>[], currentIndex: number }) => void;
  createInitialCard?: (data: T) => Partial<ReviewCard<T>>;
}

/**
 * Create a review state manager
 * Handles all state operations for spaced repetition
 */
export function createReviewStateManager<T>(
  options: StateManagerOptions<T>
): ReviewStateManager<T> {
  let cards: ReviewCard<T>[] = [];
  let currentIndex = 0;
  const config = options.config || defaultConfig;
  const priorityParams = options.priorityParams || defaultPriorityParams;
  
  const notifyChange = () => {
    if (options.onStateChange) {
      options.onStateChange({ cards, currentIndex });
    }
  };
  
  const saveState = () => {
    const state = {
      cards,
      currentIndex,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(options.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  };
  
  const loadState = (): boolean => {
    try {
      const stored = localStorage.getItem(options.storageKey);
      if (!stored) return false;
      
      const parsed = JSON.parse(stored);
      if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
        cards = cleanupCards(parsed.cards, options.getCardKey, config);
        currentIndex = (parsed.currentIndex >= 0 && parsed.currentIndex < cards.length) 
          ? parsed.currentIndex 
          : 0;
        notifyChange();
        return true;
      }
    } catch (error) {
      console.error("Failed to load state:", error);
      localStorage.removeItem(options.storageKey);
    }
    return false;
  };
  
  const handleScore = (difficulty: DifficultyRating) => {
    if (currentIndex < 0 || currentIndex >= cards.length) {
      console.error(`Invalid currentIndex ${currentIndex} for cards length ${cards.length}`);
      return;
    }
    
    // Update current card with SM-2 algorithm
    const updatedCard = updateCardWithSM2(cards[currentIndex], difficulty, config);
    cards[currentIndex] = updatedCard;
    
    // Update lastSeen counters for all cards
    cards = updateLastSeenCounters(cards, currentIndex);
    
    // Select next card
    const nextIndex = selectNextCard(cards, currentIndex, priorityParams, options.filterFn);
    if (nextIndex !== -1) {
      currentIndex = nextIndex;
    }
    
    notifyChange();
    saveState();
  };
  
  const introduceCard = (data: T) => {
    const initialData = options.createInitialCard ? options.createInitialCard(data) : {};
    const newCard: ReviewCard<T> = {
      data,
      rating: 0,
      lastSeen: 0,
      interval: config.minInterval,
      repetitions: 0,
      easeFactor: config.initialEaseFactor,
      ...initialData
    };
    
    cards.push(newCard);
    notifyChange();
    saveState();
  };
  
  const removeCard = (index: number) => {
    if (index >= 0 && index < cards.length) {
      cards.splice(index, 1);
      if (currentIndex >= cards.length && cards.length > 0) {
        currentIndex = cards.length - 1;
      }
      notifyChange();
      saveState();
    }
  };
  
  const clearAll = () => {
    cards = [];
    currentIndex = 0;
    localStorage.removeItem(options.storageKey);
    notifyChange();
  };
  
  const getCurrentCard = () => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      return cards[currentIndex];
    }
    return null;
  };
  
  const getCognitiveLoad = () => {
    return calculateCognitiveLoad(cards);
  };
  
  const shouldIntroduceNew = () => {
    return shouldIntroduceNewCard(cards, config);
  };
  
  return {
    get cards() { return cards; },
    get currentIndex() { return currentIndex; },
    set currentIndex(idx: number) { 
      currentIndex = idx;
      notifyChange();
      saveState();
    },
    config,
    priorityParams,
    handleScore,
    introduceCard,
    removeCard,
    clearAll,
    getCurrentCard,
    getCognitiveLoad,
    shouldIntroduceNew,
    saveState,
    loadState
  };
}
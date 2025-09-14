// lib/spacedRepetition/lib/session/index.ts

import {
  ReviewSession,
  SessionAction,
  Grade,
  SRSConfig,
  Deck
} from '../../types';
import {
  processReview,
  createCard,
  calculateDeckStats,
  selectNextCard
} from '../algorithm';
import {
  shouldIntroduceCard,
  findNextItemToIntroduce,
  introduceCard
} from './lib/introduction';
import { saveSession, loadSession, clearSession } from './lib/persistence';

/**
 * Initialize a new session
 */
export function initializeSession<T>(
  availableItems: T[],
  config: SRSConfig,
  getItemKey: (item: T) => string
): ReviewSession<T> {
  // Start with first item if available
  const firstItem = availableItems[0];
  const deck: Deck<T> = firstItem
    ? {
        cards: [createCard(getItemKey(firstItem), firstItem, 0)],
        currentStep: 0
      }
    : { cards: [], currentStep: 0 };

  const stats = calculateDeckStats(deck, config);
  const currentCardId = deck.cards[0]?.id ?? null;

  return {
    deck,
    config,
    currentCardId,
    consecutiveEasyCount: 0,
    availableItems,
    stats
  };
}

/**
 * Process a session action and return updated session
 */
export function processSessionAction<T>(
  session: ReviewSession<T>,
  action: SessionAction<T>,
  getItemKey: (item: T) => string
): ReviewSession<T> {
  switch (action.type) {
    case 'GRADE_CARD':
      return handleGradeCard(session, action.grade, getItemKey);

    case 'INTRODUCE_CARD':
      return handleIntroduceCard(session, action.item, getItemKey);

    case 'SELECT_NEXT_CARD':
      return handleSelectNextCard(session);

    case 'RESET_SESSION':
      return initializeSession(session.availableItems, session.config, getItemKey);

    case 'LOAD_SESSION':
      return {
        ...action.session,
        stats: calculateDeckStats(action.session.deck, action.session.config)
      };

    default:
      return session;
  }
}

/**
 * Handle grading a card
 */
function handleGradeCard<T>(
  session: ReviewSession<T>,
  grade: Grade,
  getItemKey: (item: T) => string
): ReviewSession<T> {
  if (!session.currentCardId) return session;

  // Process the review
  const result = processReview(
    session.deck,
    session.currentCardId,
    grade,
    session.config,
    session.consecutiveEasyCount
  );

  // Update deck with reviewed card
  const updatedDeck: Deck<T> = {
    cards: session.deck.cards.map(c =>
      c.id === session.currentCardId ? result.updatedCard : c
    ),
    currentStep: session.deck.currentStep + 1
  };

  // Update consecutive easy count
  const consecutiveEasyCount = grade === 3
    ? session.consecutiveEasyCount + 1
    : 0;

  // Check if we should introduce a new card
  let finalDeck = updatedDeck;
  if (result.shouldIntroduceNew) {
    const nextItem = findNextItemToIntroduce(
      session.availableItems,
      updatedDeck.cards,
      getItemKey
    );

    if (nextItem) {
      finalDeck = introduceCard(updatedDeck, nextItem, getItemKey);
      // Reset consecutive easy count after introduction
      return {
        ...session,
        deck: finalDeck,
        currentCardId: selectNextCard(finalDeck, session.config),
        consecutiveEasyCount: 0,
        stats: calculateDeckStats(finalDeck, session.config)
      };
    }
  }

  // Select next card
  const nextCardId = selectNextCard(finalDeck, session.config);

  return {
    ...session,
    deck: finalDeck,
    currentCardId: nextCardId,
    consecutiveEasyCount,
    stats: calculateDeckStats(finalDeck, session.config)
  };
}

/**
 * Handle introducing a new card
 */
function handleIntroduceCard<T>(
  session: ReviewSession<T>,
  item: T,
  getItemKey: (item: T) => string
): ReviewSession<T> {
  const updatedDeck = introduceCard(session.deck, item, getItemKey);

  return {
    ...session,
    deck: updatedDeck,
    stats: calculateDeckStats(updatedDeck, session.config)
  };
}

/**
 * Handle selecting next card
 */
function handleSelectNextCard<T>(session: ReviewSession<T>): ReviewSession<T> {
  const nextCardId = selectNextCard(session.deck, session.config);

  return {
    ...session,
    currentCardId: nextCardId
  };
}

// Re-export persistence functions
export { saveSession, loadSession, clearSession };
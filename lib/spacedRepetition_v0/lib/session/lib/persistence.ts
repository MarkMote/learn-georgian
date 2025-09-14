// lib/spacedRepetition/lib/session/lib/persistence.ts

import { ReviewSession } from '../../../types';

/**
 * Generate storage key for a session
 */
export function getStorageKey(chunkId: string, mode: string): string {
  return `srs_session_${chunkId}_${mode}_v4`;
}

/**
 * Save session to localStorage
 */
export function saveSession<T>(
  session: ReviewSession<T>,
  chunkId: string,
  mode: string
): void {
  const key = getStorageKey(chunkId, mode);
  const data = {
    deck: session.deck,
    currentCardId: session.currentCardId,
    consecutiveEasyCount: session.consecutiveEasyCount,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load session from localStorage
 */
export function loadSession<T>(
  chunkId: string,
  mode: string
): Partial<ReviewSession<T>> | null {
  const key = getStorageKey(chunkId, mode);
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    return {
      deck: data.deck,
      currentCardId: data.currentCardId,
      consecutiveEasyCount: data.consecutiveEasyCount || 0
    };
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(chunkId: string, mode: string): void {
  const key = getStorageKey(chunkId, mode);
  localStorage.removeItem(key);
}
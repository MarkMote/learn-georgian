// Pure Spaced Repetition Algorithm
// Grades: 0=fail, 1=hard, 2=good, 3=easy
export type Grade = 0 | 1 | 2 | 3;

export interface Card<T = any> {
  data: T;
  stability: number;    // S >= 1
  lastStep: number;     // when last reviewed
  seen: number;         // total reviews
  lapses: number;       // failure count
  lastGrade?: Grade;    // last grade given
  introOrder?: number;  // order in which card was introduced
}

export interface Deck<T = any> {
  cards: Card<T>[];
  globalStep: number;
}

export interface SRSConfig {
  beta: number;         // 0.9-1.0 (memory decay shape)
  sMin: number;         // minimum stability
  gHard: number;        // growth for hard
  gGood: number;        // growth for good
  gEasy: number;        // growth for easy
  kFail: number;        // shrink factor for fail
}

export const DEFAULT_CONFIG: SRSConfig = {
  beta: 1.0,
  sMin: 1,
  gHard: 0.15,
  gGood: 0.45,
  gEasy: 8,
  kFail: 0.7
  // gHard: 0.15,
  // gGood: 0.45,
  // gEasy: 0.65,
  // kFail: 0.7
};

// Core SRS calculations
function recallProbability(stability: number, elapsed: number, beta: number): number {
  return Math.exp(-Math.pow(elapsed / Math.max(stability, 1e-6), beta));
}

export function forgettingRisk<T>(card: Card<T>, currentStep: number, config: SRSConfig): number {
  // For new cards that have never been reviewed, forgetting risk should be 100%
  if (card.seen === 0) {
    return 1.0;
  }

  const elapsed = Math.max(1, currentStep - card.lastStep);
  return 1 - recallProbability(card.stability, elapsed, config.beta);
}

// Select the card with highest forgetting risk
export function selectNextCard<T>(deck: Deck<T>, config: SRSConfig): number {
  if (deck.cards.length === 0) return -1;

  let bestIndex = 0;
  let maxRisk = -Infinity;

  for (let i = 0; i < deck.cards.length; i++) {
    const risk = forgettingRisk(deck.cards[i], deck.globalStep, config);
    if (risk > maxRisk) {
      maxRisk = risk;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// Update card after review
export function reviewCard<T>(
  card: Card<T>,
  grade: Grade,
  currentStep: number,
  config: SRSConfig
): Card<T> {
  const elapsed = Math.max(1, currentStep - card.lastStep);
  const recall = recallProbability(card.stability, elapsed, config.beta);

  let newStability = card.stability;
  let newLapses = card.lapses;

  if (grade === 0) {
    // Failed - reduce stability
    newStability = Math.max(newStability * (1 - config.kFail * recall), config.sMin);
    newLapses++;
  } else {
    // Success - increase stability based on grade
    const growth = grade === 1 ? config.gHard : grade === 2 ? config.gGood : config.gEasy;
    newStability = Math.max(newStability * (1 + growth * (1 - recall)), newStability);
  }

  return {
    ...card,
    stability: newStability,
    lastStep: currentStep + 1,
    seen: card.seen + 1,
    lapses: newLapses,
    lastGrade: grade
  };
}

// Create a new card
export function createCard<T>(data: T, currentStep: number, initialStability = 3): Card<T> {
  return {
    data,
    stability: Math.max(initialStability, 1),
    lastStep: currentStep,
    seen: 0,
    lapses: 0
  };
}

// Calculate deck statistics
export function getDeckStats<T>(deck: Deck<T>, config: SRSConfig) {
  if (deck.cards.length === 0) {
    return { averageRisk: 0, totalCards: 0 };
  }

  const risks = deck.cards.map(c => forgettingRisk(c, deck.globalStep, config));
  const averageRisk = risks.reduce((sum, r) => sum + r, 0) / risks.length;

  return {
    averageRisk,
    totalCards: deck.cards.length
  };
}
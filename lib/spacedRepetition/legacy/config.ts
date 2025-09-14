// lib/spacedRepetition/legacy/config.ts

export interface SpacedRepetitionConfig {
  minEaseFactor: number;
  maxEaseFactor: number;
  initialEaseFactor: number;
  minInterval: number;
  maxInterval: number;
  cognitiveLoadThreshold: number;
  cognitiveLoadScalingFactor: number;
  cognitiveLoadBaseThreshold: number;
  performanceThreshold: number;
  easeAdjustments: {
    fail: number;
    hard: number;
    good: number;
    easy: number;
  };
  intervalMultipliers: {
    easy: number;
  };
}

export interface CardPriorityParams {
  lastSeenWeight: number;
  intervalWeight: number;
  ratingWeight: number;
}

export interface ReviewCard<T = any> {
  data: T;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  exampleIndex?: number;
}

// Default configuration matching the original /review route behavior
export const defaultConfig: SpacedRepetitionConfig = {
  // Ease factor bounds (from original code)
  minEaseFactor: 1.3,
  maxEaseFactor: 3.0,
  initialEaseFactor: 2.5,
  
  // Interval bounds
  minInterval: 1,
  maxInterval: 365, // Max 1 year
  
  // Cognitive load settings (from original code)
  cognitiveLoadThreshold: 5,
  cognitiveLoadScalingFactor: 0.04,
  cognitiveLoadBaseThreshold: 50, // Start scaling after 50 cards
  
  // Introduction triggers
  performanceThreshold: 0.75, // 75% average performance needed
  
  // Ease factor adjustments per rating
  easeAdjustments: {
    fail: 0, // No adjustment, reset to initial
    hard: -0.15, // Reduce ease factor
    good: 0, // No adjustment
    easy: 0.15, // Increase ease factor
  },
  
  // Interval multipliers
  intervalMultipliers: {
    easy: 1.3, // Additional multiplier for easy cards
  },
};

// Card priority calculation weights (from original calculateCardPriority)
export const defaultPriorityParams: CardPriorityParams = {
  lastSeenWeight: 1.0,
  intervalWeight: 1.0,
  ratingWeight: 1.0,
};

// Configuration presets for different routes
export const configPresets = {
  review: defaultConfig,
  custom: {
    ...defaultConfig,
    // Custom route doesn't use cognitive load thresholds for introduction
    cognitiveLoadThreshold: Infinity,
    performanceThreshold: Infinity,
  },
  chunks: defaultConfig,
} as const;

// Merge partial config with defaults
export function mergeConfig(
  partial: Partial<SpacedRepetitionConfig>,
  base: SpacedRepetitionConfig = defaultConfig
): SpacedRepetitionConfig {
  return {
    ...base,
    ...partial,
    easeAdjustments: {
      ...base.easeAdjustments,
      ...(partial.easeAdjustments || {}),
    },
    intervalMultipliers: {
      ...base.intervalMultipliers,
      ...(partial.intervalMultipliers || {}),
    },
  };
}
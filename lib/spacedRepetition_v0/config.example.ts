import { SpacedRepetitionConfig } from "./types";
import { mergeConfig } from "./config";

/**
 * Example: Custom configuration for a specific route
 * This shows how you can override default parameters for different learning contexts
 */

// Example 1: More aggressive learning for advanced users
export const advancedConfig: Partial<SpacedRepetitionConfig> = {
  // Lower performance threshold to introduce new cards faster
  performanceThreshold: 0.65, // Default: 0.75
  
  // Higher cognitive load tolerance
  cognitiveLoadThreshold: 8, // Default: 5
  
  // Steeper ease factor adjustments
  easeAdjustments: {
    fail: 0,
    hard: -0.2, // Default: -0.15
    good: 0.05, // Default: 0
    easy: 0.2, // Default: 0.15
  },
};

// Example 2: Gentler learning for beginners
export const beginnerConfig: Partial<SpacedRepetitionConfig> = {
  // Higher performance threshold before introducing new cards
  performanceThreshold: 0.85, // Default: 0.75
  
  // Lower cognitive load tolerance
  cognitiveLoadThreshold: 3, // Default: 5
  
  // Gentler ease factor adjustments
  easeAdjustments: {
    fail: 0,
    hard: -0.1, // Default: -0.15
    good: 0,
    easy: 0.1, // Default: 0.15
  },
  
  // Shorter maximum interval for more frequent review
  maxInterval: 180, // Default: 365 (days)
};

// Example 3: Custom configuration for grammar-focused learning
export const grammarConfig: Partial<SpacedRepetitionConfig> = {
  // Grammar needs more repetition
  initialEaseFactor: 2.0, // Default: 2.5
  
  // Shorter intervals for complex patterns
  intervalMultipliers: {
    easy: 1.1, // Default: 1.3
  },
  
  // More conservative cognitive load
  cognitiveLoadThreshold: 4,
};

/**
 * Usage in your route:
 * 
 * import { useReviewState } from "@/lib/spacedRepetition";
 * import { advancedConfig } from "@/lib/spacedRepetition/config.example";
 * 
 * function MyComponent() {
 *   const reviewState = useReviewState(
 *     chunkId, 
 *     words, 
 *     "normal",
 *     advancedConfig // Pass custom config here
 *   );
 *   // ...
 * }
 */
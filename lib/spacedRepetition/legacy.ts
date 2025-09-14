// lib/spacedRepetition/legacy.ts
// Legacy exports for compatibility with chunks and custom routes
// These routes will be migrated separately

export {
  defaultConfig,
  defaultPriorityParams,
  configPresets,
  mergeConfig
} from './legacy/config';

export {
  calculateCognitiveLoad,
  updateCardWithSM2,
  updateLastSeenCounters,
  shouldIntroduceNewCard,
  selectNextCard
} from './legacy/algorithm';
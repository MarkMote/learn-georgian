// app/review/[chunkId]/components/SRSConfigPanel.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  UserConfigOverride,
  saveUserConfig,
  loadUserConfig,
  clearUserConfig,
  getDefaultUserConfig,
} from '../../../../lib/spacedRepetition/lib/configManager';

interface SRSConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: () => void;
}

// Helper to format learning step time
function formatStepMs(ms: number): string {
  if (ms < 60 * 1000) return `${ms / 1000}s`;
  if (ms < 60 * 60 * 1000) return `${ms / (60 * 1000)}m`;
  return `${ms / (60 * 60 * 1000)}h`;
}

export default function SRSConfigPanel({ isOpen, onClose, onConfigChange }: SRSConfigPanelProps) {
  const [config, setConfig] = useState<UserConfigOverride>(getDefaultUserConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const saved = loadUserConfig();
    if (saved) {
      setConfig(saved);
    }
  }, []);

  // Check if config has changes from saved
  useEffect(() => {
    const saved = loadUserConfig();
    const current = config;
    setHasChanges(
      !saved ||
      saved.targetLearningCount !== current.targetLearningCount ||
      saved.minInterleaveCount !== current.minInterleaveCount ||
      saved.almostDueThresholdMs !== current.almostDueThresholdMs ||
      JSON.stringify(saved.learningSteps) !== JSON.stringify(current.learningSteps)
    );
  }, [config]);

  const handleSave = () => {
    saveUserConfig(config);
    setHasChanges(false);
    onConfigChange();
    onClose();
  };

  const handleReset = () => {
    const defaults = getDefaultUserConfig();
    setConfig(defaults);
    clearUserConfig();
    onConfigChange();
  };

  if (!isOpen) return null;

  // Convert almostDueThresholdMs to hours for display
  const almostDueHours = (config.almostDueThresholdMs ?? 4 * 60 * 60 * 1000) / (60 * 60 * 1000);
  const targetLearningCount = config.targetLearningCount ?? 5;
  const minInterleaveCount = config.minInterleaveCount ?? 2;
  const learningSteps = config.learningSteps ?? [60 * 1000, 10 * 60 * 1000];

  return (
    <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Study Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Learning Box Size - Main Setting */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Learning Box Size
              </label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {targetLearningCount} cards
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={targetLearningCount}
              onChange={(e) => setConfig({ ...config, targetLearningCount: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3 (Light)</span>
              <span>5</span>
              <span>10 (Intensive)</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              How many new words to learn at once. Lower = less overwhelming, higher = faster progress.
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAdvanced ? '▼ Hide advanced options' : '▶ Show advanced options'}
          </button>

          {showAdvanced && (
            <>
              {/* Min Interleave Count */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Minimum Interleave
                  </label>
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {minInterleaveCount} cards
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={minInterleaveCount}
                  onChange={(e) => setConfig({ ...config, minInterleaveCount: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Less spacing)</span>
                  <span>2</span>
                  <span>5 (More spacing)</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Minimum cards between repeats of the same word.
                </p>
              </div>

              {/* Learning Steps Display */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Learning Steps
                  </label>
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {learningSteps.map(formatStepMs).join(' → ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Cards progress through these intervals before graduating.
                </p>
              </div>

              {/* Almost Due Threshold */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Almost Due Window
                  </label>
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {almostDueHours} hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={almostDueHours}
                  onChange={(e) => setConfig({
                    ...config,
                    almostDueThresholdMs: parseInt(e.target.value) * 60 * 60 * 1000
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span>6 hours</span>
                  <span>12 hours</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Cards due within this window may be shown early.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

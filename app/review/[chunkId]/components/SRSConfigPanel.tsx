// app/review/[chunkId]/components/SRSConfigPanel.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  UserConfigOverride,
  saveUserConfig,
  loadUserConfig,
  clearUserConfig,
  getDefaultUserConfig,
  getMergedConfig
} from '../../../../lib/spacedRepetition/lib/configManager';

interface SRSConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: () => void;
}

export default function SRSConfigPanel({ isOpen, onClose, onConfigChange }: SRSConfigPanelProps) {
  const [config, setConfig] = useState<UserConfigOverride>(getDefaultUserConfig());
  const [hasChanges, setHasChanges] = useState(false);

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
      saved.beta !== current.beta ||
      saved.stabilityMultiplier !== current.stabilityMultiplier ||
      saved.riskThreshold !== current.riskThreshold ||
      saved.maxConsecutiveEasy !== current.maxConsecutiveEasy
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

  // Calculate actual values for display
  const mergedConfig = getMergedConfig();
  const actualHardGrowth = (0.1 * config.stabilityMultiplier).toFixed(2);
  const actualGoodGrowth = (0.4 * config.stabilityMultiplier).toFixed(2);
  const actualEasyGrowth = (1.0 * config.stabilityMultiplier).toFixed(2);

  return (
    <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">SRS Algorithm Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Beta Parameter */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Forgetting Curve Steepness (β)
              </label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {config.beta.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={config.beta}
              onChange={(e) => setConfig({ ...config, beta: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.75 (Gradual)</span>
              <span>1.00 (Linear)</span>
              <span>1.25 (Steep)</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Controls how quickly memory decays. Lower values mean slower forgetting (more forgiving),
              higher values mean faster forgetting (more challenging).
            </p>
          </div>

          {/* Stability Multiplier */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Stability Growth Multiplier
              </label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {config.stabilityMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={config.stabilityMultiplier}
              onChange={(e) => setConfig({ ...config, stabilityMultiplier: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x (Conservative)</span>
              <span>1.0x (Default)</span>
              <span>2.0x (Aggressive)</span>
            </div>
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>Hard: +{actualHardGrowth}</div>
                <div>Good: +{actualGoodGrowth}</div>
                <div>Easy: +{actualEasyGrowth}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Scales how much stability increases with each successful review. Higher values mean
              longer intervals between reviews (fewer repetitions needed).
            </p>
          </div>

          {/* Risk Threshold */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                New Card Introduction Threshold
              </label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {(config.riskThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={config.riskThreshold}
              onChange={(e) => setConfig({ ...config, riskThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10% (Thorough)</span>
              <span>50%</span>
              <span>90% (Quick)</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Introduces new cards when the highest-risk card drops below this threshold.
              Lower values ensure better mastery before new material, higher values introduce cards sooner.
            </p>
          </div>

          {/* Max Consecutive Easy */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Max Consecutive Easy Before New Card
              </label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {config.maxConsecutiveEasy}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={config.maxConsecutiveEasy}
              onChange={(e) => setConfig({ ...config, maxConsecutiveEasy: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3 (Frequent)</span>
              <span>5</span>
              <span>10 (Rare)</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Forces introduction of a new card after this many consecutive &quot;Easy&quot; ratings,
              even if risk threshold hasn&apos;t been reached. Prevents getting stuck on one card.
            </p>
          </div>

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
"use client";

import React from 'react';
import { CustomReviewMode, CustomExampleMode } from '../types';

interface CustomTopBarProps {
  onClearProgress: () => void;
  showExamples: CustomExampleMode;
  onToggleExamples: () => void;
  wordProgress: string;
  percentageScore: number;
  cognitiveLoad: number;
  reviewMode: CustomReviewMode;
  onModeChange: (mode: CustomReviewMode) => void;
  hasExampleWords: boolean;
  onBackToManager: () => void;
}

export default function CustomTopBar({
  onClearProgress,
  showExamples,
  onToggleExamples,
  wordProgress,
  percentageScore,
  cognitiveLoad,
  reviewMode,
  onModeChange,
  hasExampleWords,
  onBackToManager,
}: CustomTopBarProps) {
  const handleClearProgress = () => {
    if (confirm('Clear your progress for this custom deck?')) {
      onClearProgress();
    }
  };

  const getModeLabel = (mode: CustomReviewMode) => {
    switch (mode) {
      case 'normal': return 'Normal';
      case 'reverse': return 'Reverse';
      case 'examples': return 'Examples';
      case 'examples-reverse': return 'Ex-Rev';
      default: return 'Normal';
    }
  };

  const getExampleModeLabel = (mode: CustomExampleMode) => {
    switch (mode) {
      case 'off': return 'Ex: Off';
      case 'on': return 'Ex: On';
      case 'tap': return 'Ex: Tap';
      case 'tap-en': return 'Ex: EN';
      case 'tap-ka': return 'Ex: KA';
      default: return 'Ex: Off';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-black text-white">
      <div className="flex items-center gap-4">
        <button
          onClick={onBackToManager}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Deck
        </button>
        
        <div className="text-sm text-gray-400">
          Custom Deck • {wordProgress}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Progress Stats */}
        <div className="text-sm text-gray-400">
          {percentageScore}% • Load: {cognitiveLoad}%
        </div>

        {/* Mode Selection */}
        <select
          value={reviewMode}
          onChange={(e) => onModeChange(e.target.value as CustomReviewMode)}
          className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
        >
          <option value="normal">Normal</option>
          <option value="reverse">Reverse</option>
          {hasExampleWords && <option value="examples">Examples</option>}
          {hasExampleWords && <option value="examples-reverse">Ex-Reverse</option>}
        </select>

        {/* Example Mode Toggle */}
        {(reviewMode === 'normal' || reviewMode === 'reverse') && (
          <button
            onClick={onToggleExamples}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            {getExampleModeLabel(showExamples)}
          </button>
        )}

        {/* Clear Progress */}
        <button
          onClick={handleClearProgress}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
"use client";

import React from 'react';
import { ReviewMode } from '../types';

interface ReviewModeSelectorProps {
  currentMode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  hasExampleWords: boolean;
}

export default function ReviewModeSelector({ 
  currentMode, 
  onModeChange, 
  hasExampleWords 
}: ReviewModeSelectorProps) {
  const modes: { value: ReviewMode; label: string; description: string; disabled?: boolean }[] = [
    { 
      value: 'normal', 
      label: 'Normal', 
      description: 'English → Georgian' 
    },
    { 
      value: 'reverse', 
      label: 'Reverse', 
      description: 'Georgian → English' 
    },
    { 
      value: 'examples', 
      label: 'Examples', 
      description: 'Practice with example sentences',
      disabled: !hasExampleWords
    },
    { 
      value: 'examples-reverse', 
      label: 'Examples Reverse', 
      description: 'Georgian examples → English',
      disabled: !hasExampleWords
    },
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="text-white text-sm font-semibold mb-3">Review Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => !mode.disabled && onModeChange(mode.value)}
            disabled={mode.disabled}
            className={`
              relative p-3 rounded-md border transition-all duration-200
              ${currentMode === mode.value 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : mode.disabled
                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500'
              }
            `}
          >
            <div className="text-sm font-medium">{mode.label}</div>
            <div className="text-xs mt-1 opacity-75">{mode.description}</div>
            {mode.disabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs bg-gray-900 px-2 py-1 rounded">
                  No examples available
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <span className="inline-flex items-center">
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded">M</kbd>
          <span className="ml-2">Press to cycle modes</span>
        </span>
      </div>
    </div>
  );
}
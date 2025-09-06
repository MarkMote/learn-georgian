"use client";

import React, { useState, useEffect } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.top-bar-menu-area')) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleClearProgress = () => {
    if (confirm('Clear your progress for this custom deck?')) {
      onClearProgress();
    }
    setIsMenuOpen(false);
  };

  const getModeLabel = (mode: CustomReviewMode) => {
    switch (mode) {
      case 'normal': return 'Normal';
      case 'reverse': return 'Reverse';
      case 'examples': return 'Examples';
      case 'examples-reverse': return 'Examples Rev';
      default: return 'Normal';
    }
  };

  const getExampleModeLabel = (mode: CustomExampleMode) => {
    switch (mode) {
      case 'off': return 'OFF';
      case 'on': return 'ON';
      case 'tap': return 'TAP';
      case 'tap-en': return 'TAP-EN';
      case 'tap-ka': return 'TAP-KA';
      default: return 'OFF';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 relative top-bar-menu-area">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="p-2 border border-gray-600 rounded hover:bg-gray-700"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
              <ul className="divide-y divide-gray-700">
                <li>
                  <button
                    onClick={onToggleExamples}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Show Examples</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      showExamples === 'on' ? 'bg-green-600' : 
                      showExamples === 'tap' ? 'bg-yellow-600' : 
                      showExamples === 'tap-en' ? 'bg-blue-600' :
                      showExamples === 'tap-ka' ? 'bg-purple-600' :
                      'bg-gray-600'
                    }`}>
                      {getExampleModeLabel(showExamples)}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setIsModeSelectorOpen(!isModeSelectorOpen);
                    }}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Review Mode</span>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-600">
                      {getModeLabel(reviewMode)}
                    </span>
                  </button>
                  {isModeSelectorOpen && (
                    <div className="bg-gray-900 mx-2 my-2 rounded-lg p-3">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'normal' as CustomReviewMode, label: 'Normal', description: 'Front → Back' },
                          { value: 'reverse' as CustomReviewMode, label: 'Reverse', description: 'Back → Front' },
                          { value: 'examples' as CustomReviewMode, label: 'Examples', description: 'Practice with examples', disabled: !hasExampleWords },
                          { value: 'examples-reverse' as CustomReviewMode, label: 'Examples Reverse', description: 'Reverse example practice', disabled: !hasExampleWords },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => {
                              if (!mode.disabled) {
                                onModeChange(mode.value);
                                setIsModeSelectorOpen(false);
                                setIsMenuOpen(false);
                              }
                            }}
                            disabled={mode.disabled}
                            className={`
                              relative p-2 rounded-md border transition-all duration-200 text-left h-14 flex flex-col justify-center
                              ${reviewMode === mode.value 
                                ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                                : mode.disabled
                                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500'
                              }
                            `}
                          >
                            <div className="text-xs font-medium">{mode.label}</div>
                            <div className="text-xs opacity-75">{mode.description}</div>
                            {mode.disabled && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs bg-gray-900 px-2 py-1 rounded">
                                  No examples
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-400 text-center">
                        Press M to cycle modes
                      </div>
                    </div>
                  )}
                </li>
                <li>
                  <button
                    onClick={handleClearProgress}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    Reset Progress
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onBackToManager}
          className="p-2 border border-gray-600 rounded hover:bg-gray-700"
          aria-label="Back to Deck Manager"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="w-20"></div> {/* Spacer for balance */}

      <div className="text-sm text-center">
        <div>Words: {wordProgress}</div>
        <div>Score: {percentageScore}%</div>
      </div>
    </div>
  );
}
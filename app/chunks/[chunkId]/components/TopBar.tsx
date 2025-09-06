"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KnownChunkState, ReviewMode } from '../types';

interface TopBarProps {
  onClearProgress: () => void;
  showExamples: "off" | "on" | "tap";
  onToggleExamples: () => void;
  showExplanation: "off" | "on" | "tap";
  onToggleExplanation: () => void;
  chunkProgress: { unlocked: number; total: number };
  percentageScore: number;
  cognitiveLoad: number;
  knownChunks: KnownChunkState[];
  onShowProgress: () => void;
  reviewMode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  hasExampleChunks: boolean;
}

export default function TopBar({
  onClearProgress,
  showExamples,
  onToggleExamples,
  showExplanation,
  onToggleExplanation,
  chunkProgress,
  percentageScore,
  cognitiveLoad,
  knownChunks,
  onShowProgress,
  reviewMode,
  onModeChange,
  hasExampleChunks,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const router = useRouter();
  
  const getModeLabel = (mode: ReviewMode) => {
    switch (mode) {
      case 'normal': return 'Normal';
      case 'reverse': return 'Reverse';
      case 'examples': return 'Examples';
      case 'examples-reverse': return 'Examples Rev';
      default: return 'Normal';
    }
  };

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

  const handleHomeClick = () => {
    router.push('/chunk');
  };

  const handleClearProgressClick = () => {
    onClearProgress();
    setIsMenuOpen(false);
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
                    onClick={() => {
                      onShowProgress();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    View Progress
                  </button>
                </li>
                <li>
                  <button
                    onClick={onToggleExplanation}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Show Explanation</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      showExplanation === 'on' ? 'bg-green-600' : 
                      showExplanation === 'tap' ? 'bg-yellow-600' : 
                      'bg-gray-600'
                    }`}>
                      {showExplanation === 'on' ? 'ON' : 
                       showExplanation === 'tap' ? 'TAP' : 
                       'OFF'}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onToggleExamples}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Show Examples</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      showExamples === 'on' ? 'bg-green-600' : 
                      showExamples === 'tap' ? 'bg-yellow-600' : 
                      'bg-gray-600'
                    }`}>
                      {showExamples === 'on' ? 'ON' : 
                       showExamples === 'tap' ? 'TAP' : 
                       'OFF'}
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
                          { value: 'normal' as ReviewMode, label: 'Normal', description: 'English → Georgian' },
                          { value: 'reverse' as ReviewMode, label: 'Reverse', description: 'Georgian → English' },
                          { value: 'examples' as ReviewMode, label: 'Examples', description: 'Practice with examples', disabled: !hasExampleChunks },
                          { value: 'examples-reverse' as ReviewMode, label: 'Examples Reverse', description: 'Georgian examples → English', disabled: !hasExampleChunks },
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
                    onClick={handleClearProgressClick}
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
          onClick={handleHomeClick}
          className="p-2 border border-gray-600 rounded hover:bg-gray-700"
          aria-label="Go to Chunk Home"
        >
          <Home size={20} />
        </button>
      </div>

      <div className="text-sm text-center">
        <div>Chunks: {chunkProgress.unlocked}/{chunkProgress.total}</div>
        <div>Score: {percentageScore}%</div>
      </div>
    </div>
  );
}
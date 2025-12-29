// app/structure/[moduleId]/components/TopBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Menu, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KnownExampleState, ReviewMode } from '../types';

interface TopBarProps {
  onClearProgress: () => void;
  exampleProgress: { unlocked: number; total: number };
  percentageScore: number;
  knownExamples: KnownExampleState[];
  onShowProgress: () => void;
  reviewMode: ReviewMode;
  onModeChange: (mode: ReviewMode) => void;
  moduleName: string;
  showContext: boolean;
  onToggleContext: () => void;
}

export default function TopBar({
  onClearProgress,
  exampleProgress,
  percentageScore,
  knownExamples,
  onShowProgress,
  reviewMode,
  onModeChange,
  moduleName,
  showContext,
  onToggleContext,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const router = useRouter();

  const getModeLabel = (mode: ReviewMode) => {
    switch (mode) {
      case 'normal': return 'Production';
      case 'reverse': return 'Comprehension';
      default: return 'Comprehension';
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
    router.push('/structure');
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
                          { value: 'reverse' as ReviewMode, label: 'Comprehension', description: 'Georgian → English' },
                          { value: 'normal' as ReviewMode, label: 'Production', description: 'English → Georgian' },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => {
                              onModeChange(mode.value);
                              setIsModeSelectorOpen(false);
                              setIsMenuOpen(false);
                            }}
                            className={`
                              p-2 rounded-md border transition-all duration-200 text-left h-14 flex flex-col justify-center
                              ${reviewMode === mode.value
                                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500'
                              }
                            `}
                          >
                            <div className="text-xs font-medium">{mode.label}</div>
                            <div className="text-xs opacity-75">{mode.description}</div>
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
                    onClick={() => {
                      onToggleContext();
                      setIsMenuOpen(false);
                    }}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Context Hints</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${showContext ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {showContext ? 'On' : 'Off'}
                    </span>
                  </button>
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
          aria-label="Go to Structure Home"
        >
          <Home size={20} />
        </button>
      </div>

      <div className="text-sm text-center">
        <div className="text-gray-400 text-xs">{moduleName}</div>
        <div>
          {exampleProgress.unlocked}/{exampleProgress.total}
          <span className="text-gray-500 ml-2">({percentageScore}%)</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KnownWordState } from '../types';

interface TopBarProps {
  onGetLesson: () => void;
  onClearProgress: () => void;
  skipVerbs: boolean;
  onToggleSkipVerbs: () => void;
  wordProgress: { unlocked: number; total: number };
  percentageScore: number;
  cognitiveLoad: number;
  knownWords: KnownWordState[];
  onShowProgress: () => void;
}

export default function TopBar({
  onGetLesson,
  onClearProgress,
  skipVerbs,
  onToggleSkipVerbs,
  wordProgress,
  percentageScore,
  cognitiveLoad,
  knownWords,
  onShowProgress,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
    router.push('/');
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
                    Progress Status
                  </button>
                </li>
                <li>
                  <button
                    onClick={onToggleSkipVerbs}
                    className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                  >
                    <span>Skip Verbs</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${skipVerbs ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {skipVerbs ? 'ON' : 'OFF'}
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
          aria-label="Go to Home"
        >
          <Home size={20} />
        </button>
      </div>

      <div className="text-sm text-center">
        <div>Words: {wordProgress.unlocked}/{wordProgress.total}</div>
        <div>Score: {percentageScore}%</div>
      </div>

      <button
        onClick={onGetLesson}
        className="px-3 py-2 border border-gray-600 rounded text-sm hover:bg-gray-700"
      >
        Get Lesson
      </button>
    </div>
  );
}
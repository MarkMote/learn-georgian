"use client";

import React from 'react';
import { CustomWord } from '../types';

interface DeckManagerProps {
  words: CustomWord[];
  onAddMore: () => void;
  onClearAll: () => void;
  onStartReview: () => void;
}

export default function DeckManager({ words, onAddMore, onClearAll, onStartReview }: DeckManagerProps) {
  const hasExamples = words.some(word => word.examplePreview || word.exampleRevealed);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all custom words? This cannot be undone.')) {
      onClearAll();
    }
  };

  return (
    <div className="bg-black text-white p-6 rounded-lg max-w-2xl w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Custom Deck</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{words.length} words</span>
          {hasExamples && <span className="text-green-400">✓ Examples included</span>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-medium mb-3">Word Preview</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {words.slice(0, 8).map((word, index) => (
              <div key={word.key} className="flex justify-between text-sm">
                <span className="text-gray-300 truncate max-w-[40%]">{word.front}</span>
                <span className="text-white">→</span>
                <span className="text-gray-300 truncate max-w-[40%]">{word.back}</span>
                {(word.examplePreview || word.exampleRevealed) && (
                  <span className="text-green-500 text-xs">ex</span>
                )}
              </div>
            ))}
            {words.length > 8 && (
              <div className="text-gray-500 text-sm">
                ... and {words.length - 8} more words
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onStartReview}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded transition-colors font-medium"
          >
            Start Review
          </button>
          
          <button
            onClick={onAddMore}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            Add More Words
          </button>
          
          <button
            onClick={handleClearAll}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-900 rounded text-sm">
        <h4 className="font-medium mb-2">Review Features:</h4>
        <ul className="text-gray-400 space-y-1">
          <li>• Normal and reverse modes</li>
          {hasExamples && <li>• Example modes available</li>}
          <li>• Spaced repetition scoring</li>
          <li>• Progress tracking</li>
          <li>• Keyboard shortcuts (same as main app)</li>
        </ul>
      </div>
    </div>
  );
}
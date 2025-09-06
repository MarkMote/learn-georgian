"use client";

import React from 'react';
import { Play, Plus, Trash2 } from 'lucide-react';
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
    <div className="text-white p-6 max-w-2xl w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-light mb-4 text-slate-300">Custom Deck</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <span>{words.length} words</span>
          {hasExamples && <span className="text-green-400">✓ Examples included</span>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 border border-gray-600 p-4 rounded">
          <h3 className="text-lg font-medium mb-3">Word Preview</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {words.slice(0, 8).map((word, index) => (
              <div key={word.key} className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-300 truncate flex-1">{word.front}</span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="text-gray-300 truncate flex-1 text-right">{word.back}</span>
                {(word.examplePreview || word.exampleRevealed) && (
                  <span className="text-green-500 text-xs ml-2">ex</span>
                )}
              </div>
            ))}
            {words.length > 8 && (
              <div className="text-gray-500 text-sm pt-2 border-t border-gray-700">
                ... and {words.length - 8} more words
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-4 max-w-md w-full mx-auto">
          <button
            onClick={onStartReview}
            className="flex items-center justify-center gap-3 px-8 py-4 w-full border border-gray-600 hover:bg-gray-700 rounded text-lg transition-colors"
          >
            <Play className="w-5 h-5 text-gray-400" />
            <span>Start Review</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddMore}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 hover:bg-gray-700 rounded transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add More</span>
            </button>
            
            <button
              onClick={handleClearAll}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 hover:bg-gray-700 rounded transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
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
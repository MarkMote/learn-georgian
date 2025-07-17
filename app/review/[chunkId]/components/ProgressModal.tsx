"use client";

import React from "react";
import { X } from 'lucide-react';
import { KnownWordState } from '../types';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownWords: KnownWordState[];
  skipVerbs: boolean;
}

export default function ProgressModal({
  isOpen,
  onClose,
  knownWords,
  skipVerbs,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const difficultyLabels = ['fail', 'hard', 'good', 'easy'];
  const difficultyColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];

  // Filter words based on skipVerbs setting
  const relevantWords = skipVerbs
    ? knownWords.filter(kw => {
        const pos = kw.data.PartOfSpeech.toLowerCase();
        return !pos.includes("verb") || pos.includes("adverb");
      })
    : knownWords;

  // Sort words by rating (lowest first)
  const sortedWords = [...relevantWords].sort((a, b) => a.rating - b.rating);

  // Calculate cognitive load
  const scoreSum = relevantWords.reduce((acc, kw) => acc + kw.rating, 0);
  const cognitiveLoad = relevantWords.length > 0 
    ? (3 * relevantWords.length - scoreSum) / 3 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center top-0 bottom-0 p-0">
      <div className="bg-gray-900 w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Progress Status</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 ">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Introduced Words ({relevantWords.length})</h3>
            <div className="space-y-2">
              {sortedWords.map((word, index) => (
                <div 
                  key={word.data.key} 
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex-1 text-xs">
                    <span className="text-white font-medium">{word.data.GeorgianWord}</span>
                    <span className="text-gray-400 ml-3">{word.data.EnglishWord}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${difficultyColors[word.rating]}`}>
                      {difficultyLabels[word.rating]} ({word.rating})
                    </span>
                    {/* <span className="text-gray-500 text-xs">
                      interval: {word.interval}d
                    </span> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cognitive Load Calculation</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="text-gray-300">
                <p className="mb-2">Formula:</p>
                <p>  <code className="bg-gray-900  px-2 py-1 rounded">k = (3 × N - Σ scores) / 3</code></p>
                <p className="text-sm text-gray-400 mt-2 mb-4">Where k represents the equivalent number of &quot;failed&quot; cards</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total words (N):</span>
                  <span className="text-white font-medium">{relevantWords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sum of scores (Σ):</span>
                  <span className="text-white font-medium">{scoreSum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max possible score (3 × N):</span>
                  <span className="text-white font-medium">{3 * relevantWords.length}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400">Cognitive Load (k):</span>
                  <span className="text-white font-bold text-lg">{cognitiveLoad.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-400">
                {cognitiveLoad < 5 ? (
                  <p className="text-green-400">✓ Cognitive load is below threshold (k &lt; 5). New words can be introduced.</p>
                ) : (
                  <p className="text-orange-400">⚠ Cognitive load is high (k ≥ 5). Focus on mastering current words.</p>
                )}
              </div>
            </div>
          </div>

          {skipVerbs && knownWords.length !== relevantWords.length && (
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg text-sm text-blue-300">
              Note: {knownWords.length - relevantWords.length} verb{knownWords.length - relevantWords.length !== 1 ? 's' : ''} hidden due to &quot;Skip Verbs&quot; setting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
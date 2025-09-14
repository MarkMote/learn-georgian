"use client";

import React from "react";
import { X } from 'lucide-react';
import { KnownWordState } from '../types';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownWords: KnownWordState[];
  skipVerbs: boolean;
  currentIndex?: number;
  globalStep?: number;
}

// Calculate risk for a card using the new algorithm
function calculateRisk(card: KnownWordState, globalStep: number): number {
  // New algorithm: interval field now contains the real S (stability) value
  const stepsSince = Math.max(1, card.lastSeen);
  const S = Math.max(card.interval || 1, 1); // interval now holds the real S value
  return 1 - Math.exp(-Math.pow(stepsSince / S, 1.0));
}

export default function ProgressModal({
  isOpen,
  onClose,
  knownWords,
  skipVerbs,
  currentIndex,
  globalStep = 0,
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

  // Calculate risk for each word and sort by risk (highest first)
  const wordsWithRisk = relevantWords.map(word => ({
    ...word,
    risk: calculateRisk(word, globalStep)
  }));
  const sortedWords = [...wordsWithRisk].sort((a, b) => b.risk - a.risk);

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
            <h3 className="text-lg font-semibold text-white mb-4">
              Introduced Words ({relevantWords.length}) - Sorted by Risk
            </h3>
            <div className="space-y-2">
              {sortedWords.map((word, wordIdx) => {
                const originalIdx = knownWords.findIndex(kw => kw.data.key === word.data.key);
                const isCurrent = originalIdx === currentIndex;
                
                // Color code risk levels
                const riskColor = word.risk > 0.7 ? 'text-red-400' :
                                word.risk > 0.4 ? 'text-orange-400' :
                                word.risk > 0.2 ? 'text-yellow-400' : 'text-green-400';
                
                return (
                  <div 
                    key={word.data.key} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrent ? 'bg-blue-900 border border-blue-500' : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex-1 text-xs">
                      <span className="text-white font-medium">{word.data.GeorgianWord}</span>
                      <span className="text-gray-400 ml-3">{word.data.EnglishWord}</span>
                      {isCurrent && <span className="ml-2 text-blue-400 text-xs">(current)</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`font-bold text-sm ${riskColor}`}>
                        {(word.risk * 100).toFixed(0)}%
                      </div>
                      <span className={`${difficultyColors[word.rating]}`}>
                        {difficultyLabels[word.rating]}
                      </span>
                      <div className="flex gap-2 text-gray-500">
                        <span title="Stability (steps)">S:{word.interval}</span>
                        <span title="Times seen">seen:{word.repetitions}</span>
                        <span title="Last seen (steps ago)">last:{word.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Algorithm Status (New System)</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="text-gray-300">
                <p className="mb-2">New Algorithm: Recall-based Spaced Repetition</p>
                <p className="text-sm text-gray-400 mb-4">Cards are selected based on forgetting risk (higher risk = needs review)</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total words:</span>
                  <span className="text-white font-medium">{relevantWords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average rating:</span>
                  <span className="text-white font-medium">
                    {relevantWords.length > 0 ? (scoreSum / relevantWords.length).toFixed(1) : 0}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400">Average Risk (cognitive load proxy):</span>
                  <span className="text-white font-bold text-lg">
                    {cognitiveLoad.toFixed(3)}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm">
                {cognitiveLoad < 0.22 ? (
                  <p className="text-green-400">✓ Risk below 0.22 - Introducing new cards</p>
                ) : cognitiveLoad < 0.28 ? (
                  <p className="text-yellow-400">⚡ Risk between 0.22-0.28 - May introduce cards</p>
                ) : (
                  <p className="text-orange-400">⚠ Risk above 0.28 - Focus on current cards</p>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400">
                <p className="font-semibold mb-1">Card Parameters:</p>
                <ul className="space-y-1">
                  <li><span className="text-red-400 font-bold">Risk %:</span> Probability of forgetting (higher = needs review)</li>
                  <li><span className="text-gray-500">S:</span> Stability (steps until 50% recall)</li>
                  <li><span className="text-gray-500">seen:</span> Total times reviewed</li>
                  <li><span className="text-gray-500">last:</span> Steps since last review</li>
                </ul>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="font-semibold">Risk Colors:</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-green-400">0-20% Fresh</span>
                    <span className="text-yellow-400">20-40% Due</span>
                    <span className="text-orange-400">40-70% Overdue</span>
                    <span className="text-red-400">70%+ Urgent</span>
                  </div>
                </div>
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
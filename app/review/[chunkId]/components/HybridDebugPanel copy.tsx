// app/review/[chunkId]/components/HybridDebugPanel.tsx

import React, { useState, useEffect } from "react";
import { CardState, DeckState, SRSConfig } from "../../../../lib/spacedRepetition/types";
import { calculateRisk } from "../../../../lib/spacedRepetition/lib/calculateRisk";
import { WordData } from "../types";

interface HybridDebugPanelProps {
  deckState: DeckState;
  currentCardState: CardState | null;
  config: SRSConfig;
  consecutiveEasy: number;
  isIntroducing: boolean;
  skipVerbs: boolean;
  knownWords: Array<{ data: WordData; rating: number; lastSeen: number; interval: number; repetitions: number; easeFactor: number; }>;
  currentIndex: number;
}

// Using imported calculateRisk function from core library

export default function HybridDebugPanel({
  deckState,
  currentCardState,
  config,
  consecutiveEasy,
  isIntroducing,
  skipVerbs,
  knownWords,
  currentIndex
}: HybridDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(true);


  // Calculate stats for each card (from knownWords compatibility layer)
  const cardStats = knownWords.map((knownWord, idx) => {
    const stepsSince = knownWord.lastSeen;
    const stability = knownWord.interval; // Using interval as stability approximation
    const risk = calculateRisk(stability, stepsSince, config.beta);

    // Debug logging - show current card being reviewed
    if (knownWord.data.key === deckState.currentCardKey) {
      console.log('Debug - CURRENT card:', {
        word: knownWord.data.GeorgianWord,
        key: knownWord.data.key,
        stepsSince,
        stability,
        risk: (risk * 100).toFixed(1) + '%',
        deckStep: deckState.currentStep,
        cardLastReview: currentCardState?.lastReviewStep
      });
    }

    return {
      word: knownWord,
      risk,
      stepsSince,
      index: idx,
      stability
    };
  });

  // Sort by risk (highest first)
  const sortedStats = [...cardStats].sort((a, b) => b.risk - a.risk);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-gray-100 px-1 py-3 rounded-l-md z-40 shadow-lg text-xs md:hidden"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        DBG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      {/* Backdrop that closes on tap; separate from the panel */}
      <button
        aria-label="Close debug panel"
        onClick={() => setIsVisible(false)}
        className="absolute inset-0"
      />

      <div className="relative flex h-full w-full items-center justify-center p-2">
        <div
          className="
            bg-gray-900 text-gray-100 rounded-xl w-[95%] md:w-1/2
            h-[85dvh] md:max-h-[90vh]
            overflow-y-auto overscroll-contain
            shadow-xl
          "
          onClick={(e) => e.stopPropagation()}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-0 right-1 p-3 text-4xl text-gray-400 hover:text-gray-100 md:hidden"
          >
            ✕
          </button>

          <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Debug Panel</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Step:</span> {deckState.currentStep}
          </div>
          <div>
            <span className="text-gray-400">Cards:</span> {knownWords.length}
          </div>
          <div>
            <span className="text-gray-400">Current:</span> {currentIndex}
          </div>
          <div>
            <span className="text-gray-400">Skip Verbs:</span> {skipVerbs ? "Yes" : "No"}
          </div>
          <div>
            <span className="text-gray-400">Easy Count:</span> {consecutiveEasy}
          </div>
          <div>
            <span className="text-gray-400">Introducing:</span> {isIntroducing ? "Yes" : "No"}
          </div>
          <div>
            <span className="text-gray-400">Avg Risk:</span> {(deckState.stats.averageRisk * 100).toFixed(1)}%
          </div>
          <div>
            <span className="text-gray-400">Cards at Risk:</span> {deckState.stats.cardsAtRisk}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Config</h3>
        <div className="grid grid-cols-2 gap-1 text-xs mb-4">
          <div><span className="text-gray-500">Beta:</span> {config.beta}</div>
          <div><span className="text-gray-500">minStability:</span> {config.minStability}</div>
          <div><span className="text-gray-500">hardGrowth:</span> {config.hardGrowth}</div>
          <div><span className="text-gray-500">goodGrowth:</span> {config.goodGrowth}</div>
          <div><span className="text-gray-500">easyGrowth:</span> {config.easyGrowth}</div>
          <div><span className="text-gray-500">failShrink:</span> {config.failShrink}</div>
          <div><span className="text-gray-500">riskThreshold:</span> {config.riskThreshold}</div>
          <div><span className="text-gray-500">maxConsecutiveEasy:</span> {config.maxConsecutiveEasy}</div>
        </div>

        {currentCardState && (
          <>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Current Card State</h3>
            <div className="grid grid-cols-2 gap-1 text-xs mb-4">
              <div><span className="text-gray-500">Key:</span> {currentCardState.key}</div>
              <div><span className="text-gray-500">Stability:</span> {currentCardState.stability.toFixed(1)}</div>
              <div><span className="text-gray-500">Reviews:</span> {currentCardState.reviewCount}</div>
              <div><span className="text-gray-500">Lapses:</span> {currentCardState.lapseCount}</div>
              <div><span className="text-gray-500">Last Review:</span> {currentCardState.lastReviewStep}</div>
              <div><span className="text-gray-500">Steps Since:</span> {deckState.currentStep - currentCardState.lastReviewStep}</div>
            </div>
          </>
        )}

        <h3 className="text-sm font-semibold mb-2 text-gray-300">Cards (by risk)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-1 px-1">Idx</th>
                <th className="text-left py-1 px-1">Word</th>
                <th className="text-right py-1 px-1">Risk</th>
                <th className="text-right py-1 px-1">S</th>
                <th className="text-right py-1 px-1">Seen</th>
                <th className="text-right py-1 px-1">Since</th>
                <th className="text-right py-1 px-1">Next</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map(({ word, risk, stepsSince, index, stability }) => {
                const isCurrent = index === currentIndex;
                const wordText = word.data.EnglishWord || word.data.GeorgianWord;
                const displayWord = wordText.length > 20 ? wordText.slice(0, 18) + "..." : wordText;
                // Calculate when card should be reviewed next (at 50% recall)
                const nextReview = Math.round(stability * Math.pow(-Math.log(0.5), 1/config.beta));

                return (
                  <tr
                    key={index}
                    className={`
                      border-b border-gray-800
                      ${isCurrent ? "bg-blue-900 bg-opacity-40" : ""}
                      ${risk > 0.5 ? "text-red-400" : risk > 0.3 ? "text-yellow-400" : "text-green-400"}
                    `}
                  >
                    <td className="py-1 px-1">
                      {isCurrent ? "→" : ""}{index}
                    </td>
                    <td className="py-1 px-1" title={wordText}>
                      {displayWord}
                    </td>
                    <td className="text-right py-1 px-1">
                      {(risk * 100).toFixed(0)}%
                    </td>
                    <td className="text-right py-1 px-1">
                      {stability.toFixed(1)}
                    </td>
                    <td className="text-right py-1 px-1">
                      {word.repetitions}
                    </td>
                    <td className="text-right py-1 px-1">
                      {stepsSince}
                    </td>
                    <td className="text-right py-1 px-1">
                      {nextReview}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Stats</h3>
          <div className="text-xs space-y-1">
            <div>
              <span className="text-gray-500">Avg Risk:</span>{" "}
              {knownWords.length > 0
                ? (sortedStats.reduce((sum, s) => sum + s.risk, 0) / sortedStats.length * 100).toFixed(1) + "%"
                : "0%"}
            </div>
            <div>
              <span className="text-gray-500">New Cards (seen &lt; 2):</span>{" "}
              {knownWords.filter(w => w.repetitions < 2).length}
            </div>
            <div>
              <span className="text-gray-500">Mature Cards:</span>{" "}
              {knownWords.filter(w => w.repetitions >= 2).length}
            </div>
            <div>
              <span className="text-gray-500">Current Card Key:</span>{" "}
              {deckState.currentCardKey || "none"}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
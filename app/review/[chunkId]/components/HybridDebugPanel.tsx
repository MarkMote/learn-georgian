// app/review/[chunkId]/components/HybridDebugPanel.tsx

import React, { useState } from "react";
import { CardState, DeckState, SRSConfig, SelectNextCardResult } from "../../../../lib/spacedRepetition/types";
import { getRetrievability } from "../../../../lib/spacedRepetition/lib/fsrs";
import { WordData } from "../types";

interface HybridDebugPanelProps {
  deckState: DeckState;
  currentCardState: CardState | null;
  config: SRSConfig;
  source: SelectNextCardResult['source'];
  skipVerbs: boolean;
  knownWords: Array<{ data: WordData; rating: number; lastSeen: number; interval: number; repetitions: number; easeFactor: number; }>;
  currentIndex: number;
  cardStates?: Map<string, CardState>;
}

// Helper to format state enum
function formatState(state: number): string {
  switch (state) {
    case 0: return "New";
    case 1: return "Learning";
    case 2: return "Review";
    case 3: return "Relearning";
    default: return "Unknown";
  }
}

// Helper to format phase
function formatPhase(phase: string): string {
  switch (phase) {
    case 'learning': return 'Learning';
    case 'review': return 'Review';
    case 'graduated': return 'Graduated';
    default: return phase;
  }
}

// Helper to format due date
function formatDue(dueStr: string): string {
  const due = new Date(dueStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins < 60) return `${overdueMins}m overdue`;
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) return `${overdueHours}h overdue`;
    return `${Math.abs(diffDays)}d overdue`;
  }

  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `in ${diffDays}d`;
}

// Format learning step time
function formatStepTime(ms: number): string {
  if (ms < 60 * 1000) return `${ms / 1000}s`;
  if (ms < 60 * 60 * 1000) return `${ms / (60 * 1000)}m`;
  return `${ms / (60 * 60 * 1000)}h`;
}

export default function HybridDebugPanel({
  deckState,
  currentCardState,
  config,
  source,
  skipVerbs,
  knownWords,
  currentIndex,
  cardStates
}: HybridDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Calculate stats for each card using FSRS retrievability
  const cardStats = knownWords.map((knownWord, idx) => {
    const cardState = cardStates?.get(knownWord.data.key);
    const retrievability = cardState ? getRetrievability(cardState) : 1.0;
    const isDue = cardState ? new Date(cardState.due) <= new Date() : false;

    return {
      word: knownWord,
      retrievability,
      isDue,
      index: idx,
      cardState
    };
  });

  // Sort by retrievability (lowest first - most at risk of forgetting)
  const sortedStats = [...cardStats].sort((a, b) => a.retrievability - b.retrievability);

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
    <div
      className="fixed left-0 top-0 h-full w-full md:w-1/2 bg-gray-900 text-gray-100 overflow-y-auto z-50 shadow-xl"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-2 text-2xl text-gray-400 hover:text-gray-100 z-10 bg-gray-800 rounded-full"
      >
        ✕
      </button>

      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">Debug Panel (Learning Boxes)</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Due:</span> {deckState.stats.dueCount}
          </div>
          <div>
            <span className="text-gray-400">Learning:</span> {deckState.stats.learningCount}
          </div>
          <div>
            <span className="text-gray-400">Graduated:</span> {deckState.stats.graduatedCount}
          </div>
          <div>
            <span className="text-gray-400">Introduced:</span> {deckState.stats.totalIntroduced}
          </div>
          <div>
            <span className="text-gray-400">Total:</span> {deckState.stats.totalAvailable}
          </div>
          <div>
            <span className="text-gray-400">Current Idx:</span> {currentIndex}
          </div>
          <div>
            <span className="text-gray-400">Source:</span> {source}
          </div>
          <div>
            <span className="text-gray-400">Skip Verbs:</span> {skipVerbs ? "Yes" : "No"}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Config (Learning Box)</h3>
        <div className="grid grid-cols-2 gap-1 text-xs mb-4">
          <div><span className="text-gray-500">targetLearningCount:</span> {config.targetLearningCount}</div>
          <div><span className="text-gray-500">minInterleave:</span> {config.minInterleaveCount}</div>
          <div className="col-span-2">
            <span className="text-gray-500">learningSteps:</span>{' '}
            {config.learningSteps.map(formatStepTime).join(', ')}
          </div>
        </div>

        {currentCardState && (
          <>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Current Card State</h3>
            <div className="grid grid-cols-2 gap-1 text-xs mb-4">
              <div><span className="text-gray-500">Key:</span> {currentCardState.key}</div>
              <div><span className="text-gray-500">Phase:</span> {formatPhase(currentCardState.phase)}</div>
              <div><span className="text-gray-500">Learning Step:</span> {currentCardState.learningStep}/{config.learningSteps.length}</div>
              <div><span className="text-gray-500">Step Due:</span> {formatDue(currentCardState.stepDue)}</div>
              <div><span className="text-gray-500">FSRS State:</span> {formatState(currentCardState.state)}</div>
              <div><span className="text-gray-500">Stability:</span> {currentCardState.stability.toFixed(2)}</div>
              <div><span className="text-gray-500">Difficulty:</span> {currentCardState.difficulty.toFixed(2)}</div>
              <div><span className="text-gray-500">Reps:</span> {currentCardState.reps}</div>
              <div><span className="text-gray-500">Lapses:</span> {currentCardState.lapses}</div>
              <div><span className="text-gray-500">FSRS Due:</span> {formatDue(currentCardState.due)}</div>
              <div><span className="text-gray-500">Scheduled:</span> {currentCardState.scheduled_days}d</div>
              <div><span className="text-gray-500">Retrievability:</span> {(getRetrievability(currentCardState) * 100).toFixed(0)}%</div>
              <div><span className="text-gray-500">Last Grade:</span> {currentCardState.lastGrade ?? "none"}</div>
            </div>
          </>
        )}

        <h3 className="text-sm font-semibold mb-2 text-gray-300">Cards (by retrievability)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-1 px-1">Idx</th>
                <th className="text-left py-1 px-1">Word</th>
                <th className="text-right py-1 px-1">R%</th>
                <th className="text-right py-1 px-1">S</th>
                <th className="text-right py-1 px-1">Ph</th>
                <th className="text-right py-1 px-1">Stp</th>
                <th className="text-right py-1 px-1">Due</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map(({ word, retrievability, isDue, index, cardState }) => {
                const isCurrent = index === currentIndex;
                const wordText = word.data.EnglishWord || word.data.GeorgianWord;
                const displayWord = wordText.length > 15 ? wordText.slice(0, 13) + "..." : wordText;

                return (
                  <tr
                    key={index}
                    className={`
                      border-b border-gray-800
                      ${isCurrent ? "bg-blue-900 bg-opacity-40" : ""}
                      ${isDue ? "text-red-400" : retrievability < 0.7 ? "text-yellow-400" : "text-green-400"}
                    `}
                  >
                    <td className="py-1 px-1">
                      {isCurrent ? "→" : ""}{index}
                    </td>
                    <td className="py-1 px-1" title={wordText}>
                      {displayWord}
                    </td>
                    <td className="text-right py-1 px-1">
                      {(retrievability * 100).toFixed(0)}%
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState?.stability.toFixed(1) ?? "-"}
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState ? formatPhase(cardState.phase).charAt(0) : "-"}
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState ? `${cardState.learningStep}` : "-"}
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState ? formatDue(cardState.phase === 'learning' ? cardState.stepDue : cardState.due) : "-"}
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
              <span className="text-gray-500">Avg Retrievability:</span>{" "}
              {knownWords.length > 0
                ? (sortedStats.reduce((sum, s) => sum + s.retrievability, 0) / sortedStats.length * 100).toFixed(1) + "%"
                : "0%"}
            </div>
            <div>
              <span className="text-gray-500">Learning Cards:</span>{" "}
              {deckState.stats.learningCount}
            </div>
            <div>
              <span className="text-gray-500">Due Now:</span>{" "}
              {deckState.stats.dueCount}
            </div>
            <div>
              <span className="text-gray-500">Current Card Key:</span>{" "}
              {deckState.currentCardKey || "none"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/alphabet/deck/components/AlphabetDebugPanel.tsx

import React, { useState } from "react";
import { CardState, DeckState } from "../../../../lib/spacedRepetition/types";
import { getRetrievability } from "../../../../lib/spacedRepetition/lib/fsrs";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";
import { AlphabetData } from "../types";

interface AlphabetDebugPanelProps {
  deckState: DeckState;
  currentCardState: CardState | null;
  source: string;
  cardStates: Map<string, CardState>;
  allLetters: AlphabetData[];
}

function formatPhase(phase: string): string {
  switch (phase) {
    case 'learning': return 'L';
    case 'consolidation': return 'C';
    case 'graduated': return 'G';
    default: return phase;
  }
}

function formatDue(dueStr: string): string {
  const due = new Date(dueStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins < 60) return `${overdueMins}m ago`;
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) return `${overdueHours}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  }

  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `in ${diffDays}d`;
}

function formatStepTime(ms: number): string {
  if (ms < 60 * 1000) return `${ms / 1000}s`;
  if (ms < 60 * 60 * 1000) return `${ms / (60 * 1000)}m`;
  return `${ms / (60 * 60 * 1000)}h`;
}

export default function AlphabetDebugPanel({
  deckState,
  currentCardState,
  source,
  cardStates,
  allLetters,
}: AlphabetDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = getMergedConfig();

  // Build card stats
  const cardStats = Array.from(cardStates.entries()).map(([key, cardState]) => {
    const letter = allLetters.find(l => l.key === key);
    const retrievability = getRetrievability(cardState);
    const isDue = cardState.phase === 'learning' || cardState.phase === 'consolidation'
      ? new Date(cardState.stepDue) <= new Date()
      : new Date(cardState.due) <= new Date();

    return {
      key,
      letter: letter?.georgianLetter || key,
      english: letter?.englishLetter || key,
      cardState,
      retrievability,
      isDue,
    };
  });

  // Sort by phase then stepDue/due
  cardStats.sort((a, b) => {
    // Learning first, then consolidation, then graduated
    const phaseOrder = { learning: 0, consolidation: 1, graduated: 2 };
    const aPhase = phaseOrder[a.cardState.phase] ?? 3;
    const bPhase = phaseOrder[b.cardState.phase] ?? 3;
    if (aPhase !== bPhase) return aPhase - bPhase;

    // Within same phase, sort by due time
    const aDue = a.cardState.phase === 'graduated' ? a.cardState.due : a.cardState.stepDue;
    const bDue = b.cardState.phase === 'graduated' ? b.cardState.due : b.cardState.stepDue;
    return new Date(aDue).getTime() - new Date(bDue).getTime();
  });

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-gray-100 px-1 py-3 rounded-l-md z-40 shadow-lg text-xs"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        DBG
      </button>
    );
  }

  return (
    <div
      className="fixed left-0 top-0 h-full w-full md:w-1/2 bg-gray-900 text-gray-100 overflow-y-auto z-50 shadow-xl"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-2 text-2xl text-gray-400 hover:text-gray-100 z-10 bg-gray-800 rounded-full"
      >
        ✕
      </button>

      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">Alphabet Debug Panel</h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          <div><span className="text-gray-400">Due:</span> {deckState.stats.dueCount}</div>
          <div><span className="text-gray-400">Learning:</span> {deckState.stats.learningCount}</div>
          <div><span className="text-gray-400">Consolidation:</span> {deckState.stats.consolidationCount}</div>
          <div><span className="text-gray-400">Graduated:</span> {deckState.stats.graduatedCount}</div>
          <div><span className="text-gray-400">Introduced:</span> {deckState.stats.totalIntroduced}</div>
          <div><span className="text-gray-400">Total:</span> {deckState.stats.totalAvailable}</div>
          <div><span className="text-gray-400">Source:</span> <span className="font-bold text-yellow-400">{source}</span></div>
          <div><span className="text-gray-400">CurrentKey:</span> {deckState.currentCardKey?.slice(0, 8) || "none"}</div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Config</h3>
        <div className="grid grid-cols-2 gap-1 text-xs mb-4">
          <div><span className="text-gray-500">targetLearningCount:</span> {config.targetLearningCount}</div>
          <div><span className="text-gray-500">minInterleave:</span> {config.minInterleaveCount}</div>
          <div className="col-span-2">
            <span className="text-gray-500">learningSteps:</span>{' '}
            {config.learningSteps.map(formatStepTime).join(', ')}
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">consolidationSteps:</span>{' '}
            {config.consolidationSteps.map(formatStepTime).join(', ')}
          </div>
        </div>

        {currentCardState && (
          <>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Current Card</h3>
            <div className="grid grid-cols-2 gap-1 text-xs mb-4 bg-blue-900/30 p-2 rounded">
              <div><span className="text-gray-500">Key:</span> {currentCardState.key.slice(0, 12)}</div>
              <div><span className="text-gray-500">Phase:</span> <span className="font-bold">{currentCardState.phase}</span></div>
              <div><span className="text-gray-500">LearningStep:</span> {currentCardState.learningStep}</div>
              <div><span className="text-gray-500">StepDue:</span> {formatDue(currentCardState.stepDue)}</div>
              <div><span className="text-gray-500">FSRS Due:</span> {formatDue(currentCardState.due)}</div>
              <div><span className="text-gray-500">LastGrade:</span> {currentCardState.lastGrade ?? "none"}</div>
              <div><span className="text-gray-500">Reps:</span> {currentCardState.reps}</div>
              <div><span className="text-gray-500">Lapses:</span> {currentCardState.lapses}</div>
            </div>
          </>
        )}

        <h3 className="text-sm font-semibold mb-2 text-gray-300">All Cards ({cardStats.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-1 px-1">Letter</th>
                <th className="text-right py-1 px-1">Ph</th>
                <th className="text-right py-1 px-1">Stp</th>
                <th className="text-right py-1 px-1">Due</th>
                <th className="text-right py-1 px-1">Lg</th>
              </tr>
            </thead>
            <tbody>
              {cardStats.map(({ key, letter, english, cardState, isDue }) => {
                const isCurrent = key === deckState.currentCardKey;
                const dueTime = cardState.phase === 'graduated' ? cardState.due : cardState.stepDue;

                return (
                  <tr
                    key={key}
                    className={`
                      border-b border-gray-800
                      ${isCurrent ? "bg-blue-900/40 font-bold" : ""}
                      ${isDue ? "text-red-400" : cardState.phase === 'learning' ? "text-yellow-400" : cardState.phase === 'consolidation' ? "text-orange-400" : "text-green-400"}
                    `}
                  >
                    <td className="py-1 px-1">
                      {isCurrent ? "→" : ""}{letter} ({english})
                    </td>
                    <td className="text-right py-1 px-1">
                      {formatPhase(cardState.phase)}
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState.learningStep}
                    </td>
                    <td className="text-right py-1 px-1">
                      {formatDue(dueTime)}
                    </td>
                    <td className="text-right py-1 px-1">
                      {cardState.lastGrade ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

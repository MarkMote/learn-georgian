import React from "react";
import { Card, Deck, SRSConfig, forgettingRisk } from "../../../../lib/spacedRepetition";
import { WordData } from "../types";

interface DebugPanelProps {
  deck: Deck<WordData>;
  currentIndex: number;
  config: SRSConfig;
  consecutiveEasy: number;
  isIntroducing: boolean;
  skipVerbs: boolean;
}

export default function DebugPanel({
  deck,
  currentIndex,
  config,
  consecutiveEasy,
  isIntroducing,
  skipVerbs
}: DebugPanelProps) {
  // Calculate stats for each card
  const cardStats = deck.cards.map((card, idx) => {
    const risk = forgettingRisk(card, deck.currentStep, config);
    const stepsSince = deck.currentStep - card.lastReviewStep;
    return { card, risk, stepsSince, index: idx };
  });

  // Sort by risk (highest first)
  const sortedStats = [...cardStats].sort((a, b) => b.risk - a.risk);

  return (
    <div className="fixed left-0 top-0 h-full w-1/2 bg-gray-900 text-gray-100 overflow-y-auto z-50 shadow-xl">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold mb-2">Debug Panel</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Step:</span> {deck.currentStep}
          </div>
          <div>
            <span className="text-gray-400">Cards:</span> {deck.cards.length}
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
        </div>

        <h3 className="text-sm font-semibold mb-2 text-gray-300">Cards (by risk)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-1 px-1">#</th>
                <th className="text-left py-1 px-1">Idx</th>
                <th className="text-left py-1 px-1">Word</th>
                <th className="text-right py-1 px-1">Risk</th>
                <th className="text-right py-1 px-1">S</th>
                <th className="text-right py-1 px-1">Seen</th>
                <th className="text-right py-1 px-1">Fail</th>
                <th className="text-center py-1 px-1">Last</th>
                <th className="text-right py-1 px-1">Since</th>
                <th className="text-right py-1 px-1">Next</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map(({ card, risk, stepsSince, index }) => {
                const isCurrent = index === currentIndex;
                const word = card.data.EnglishWord || card.data.GeorgianWord;
                const displayWord = word.length > 20 ? word.slice(0, 18) + "..." : word;
                // Calculate when card should be reviewed next (at 50% recall)
                const nextReview = Math.round(card.stability * Math.pow(-Math.log(0.5), 1/config.beta));
                // Grade display not available in new system
                const gradeDisplay = "-";

                return (
                  <tr
                    key={index}
                    className={`
                      border-b border-gray-800
                      ${isCurrent ? "bg-blue-900 bg-opacity-40" : ""}
                      ${risk > 0.5 ? "text-red-400" : risk > 0.3 ? "text-yellow-400" : "text-green-400"}
                    `}
                  >
                    <td className="py-1 px-1 text-gray-500">
                      {card.introducedAtStep || "-"}
                    </td>
                    <td className="py-1 px-1">
                      {isCurrent ? "→" : ""}{index}
                    </td>
                    <td className="py-1 px-1" title={word}>
                      {displayWord}
                    </td>
                    <td className="text-right py-1 px-1">
                      {(risk * 100).toFixed(0)}%
                    </td>
                    <td className="text-right py-1 px-1">
                      {card.stability.toFixed(1)}
                    </td>
                    <td className="text-right py-1 px-1">
                      {card.reviewCount}
                    </td>
                    <td className="text-right py-1 px-1">
                      {card.lapseCount}
                    </td>
                    <td className="text-center py-1 px-1">
                      <span className="text-gray-600">
                        {gradeDisplay}
                      </span>
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
              {deck.cards.length > 0
                ? (sortedStats.reduce((sum, s) => sum + s.risk, 0) / sortedStats.length * 100).toFixed(1) + "%"
                : "0%"}
            </div>
            <div>
              <span className="text-gray-500">New Cards (seen &lt; 2):</span>{" "}
              {deck.cards.filter(c => c.reviewCount < 2).length}
            </div>
            <div>
              <span className="text-gray-500">Mature Cards:</span>{" "}
              {deck.cards.filter(c => c.reviewCount >= 2).length}
            </div>
            <div>
              <span className="text-gray-500">Failed Cards:</span>{" "}
              {deck.cards.filter(c => c.lapseCount > 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
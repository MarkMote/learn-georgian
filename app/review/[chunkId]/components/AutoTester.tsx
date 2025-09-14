"use client";

import React, { useEffect, useState } from "react";
import { DifficultyRating } from '../types';

interface AutoTesterProps {
  onRate: (rating: DifficultyRating) => void;
  knownWords: any[];
  averageRisk: number;
  isIntroducing: boolean;
  globalStep: number;
}

interface TestResult {
  step: number;
  cards: number;
  risk: number;
  introducing: boolean;
  action: string;
}

export default function AutoTester({
  onRate,
  knownWords,
  averageRisk,
  isIntroducing,
  globalStep
}: AutoTesterProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-run test when component mounts
  useEffect(() => {
    if (!isRunning && testResults.length === 0) {
      runEasySpamTest();
    }
  }, []);

  const runEasySpamTest = async () => {
    console.log("🚀 AUTO-RUNNING EASY SPAM TEST");
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(0);

    const results: TestResult[] = [];
    let step = 0;
    let stuckCounter = 0;
    let lastCardCount = knownWords.length;

    const runStep = () => {
      // Record current state
      const result: TestResult = {
        step,
        cards: knownWords.length,
        risk: +averageRisk.toFixed(3),
        introducing: isIntroducing,
        action: "easy"
      };
      results.push(result);
      setTestResults([...results]);

      console.log(`Step ${step}: Cards=${knownWords.length}, Risk=${averageRisk.toFixed(3)}, Introducing=${isIntroducing}`);

      // Check if stuck
      if (knownWords.length === lastCardCount) {
        stuckCounter++;
      } else {
        stuckCounter = 0;
        lastCardCount = knownWords.length;
      }

      // Stop conditions
      if (knownWords.length >= 15) {
        console.log("✅ SUCCESS: Reached 15 cards!");
        setIsRunning(false);
        return;
      }

      if (stuckCounter >= 8) {
        console.log(`❌ STUCK: No progress for 8 steps at ${knownWords.length} cards`);
        setIsRunning(false);
        return;
      }

      if (step >= 25) {
        console.log(`⏰ TIMEOUT: Stopped after 25 steps. Final: ${knownWords.length} cards`);
        setIsRunning(false);
        return;
      }

      // Press easy button
      onRate("easy");
      step++;
      setCurrentStep(step);

      // Continue after delay
      setTimeout(runStep, 600);
    };

    // Start first step
    setTimeout(runStep, 500);
  };

  return (
    <div className="fixed top-4 left-4 bg-gray-900 border border-gray-600 rounded-lg p-4 max-w-md z-40">
      <h3 className="text-white font-bold mb-2">Auto Test Runner</h3>
      
      <div className="text-sm text-gray-300 mb-3">
        <div>Status: {isRunning ? `Running step ${currentStep}...` : 'Completed'}</div>
        <div>Cards: {knownWords.length}</div>
        <div>Risk: {averageRisk.toFixed(3)}</div>
        <div>Introducing: {isIntroducing ? 'Yes' : 'No'}</div>
      </div>

      {testResults.length > 0 && (
        <div className="max-h-32 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-1">Last 8 steps:</div>
          {testResults.slice(-8).map((result, i) => (
            <div key={i} className="text-xs font-mono text-gray-300">
              {result.step}: {result.cards} cards, risk {result.risk}, {result.introducing ? 'intro' : 'review'}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setTestResults([]);
          setCurrentStep(0);
          runEasySpamTest();
        }}
        disabled={isRunning}
        className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm text-white"
      >
        {isRunning ? 'Running...' : 'Run Again'}
      </button>
    </div>
  );
}
"use client";

import React, { useState, useRef } from "react";
import { DifficultyRating } from '../types';

interface AlgorithmTesterProps {
  onRate: (rating: DifficultyRating) => void;
  knownWords: any[];
  averageRisk: number;
  isIntroducing: boolean;
  globalStep: number;
  consecutiveEasyCount?: number;
}

interface TestResult {
  name: string;
  steps: number;
  finalCards: number;
  avgRiskHistory: number[];
  success: boolean;
  error?: string;
}

export default function AlgorithmTester({
  onRate,
  knownWords,
  averageRisk,
  isIntroducing,
  globalStep,
  consecutiveEasyCount = 0
}: AlgorithmTesterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  const runTest = async (
    testName: string,
    buttonSequence: DifficultyRating[],
    expectedMinCards: number,
    maxSteps: number = 100
  ) => {
    console.log(`🧪 Starting test: ${testName}`);
    setIsRunning(true);
    
    const startCards = knownWords.length;
    const riskHistory: number[] = [];
    const cardHistory: number[] = [];
    let step = 0;
    let lastCardCount = knownWords.length;
    let stuckCounter = 0;
    
    return new Promise<TestResult>((resolve) => {
      const simulateStep = () => {
        // Record current state
        riskHistory.push(averageRisk);
        cardHistory.push(knownWords.length);
        
        // Check if we're stuck (no progress in last 10 steps)
        if (knownWords.length === lastCardCount) {
          stuckCounter++;
        } else {
          stuckCounter = 0;
          lastCardCount = knownWords.length;
        }
        
        if (stuckCounter >= 10) {
          resolve({
            name: testName,
            steps: step,
            finalCards: knownWords.length,
            avgRiskHistory: riskHistory,
            success: false,
            error: `Stuck at ${knownWords.length} cards for 10 steps`
          });
          return;
        }
        
        if (step >= maxSteps) {
          resolve({
            name: testName,
            steps: step,
            finalCards: knownWords.length,
            avgRiskHistory: riskHistory,
            success: false,
            error: `Timeout after ${maxSteps} steps. Final: ${knownWords.length} cards`
          });
          return;
        }
        
        // Check success condition
        if (knownWords.length >= expectedMinCards) {
          resolve({
            name: testName,
            steps: step,
            finalCards: knownWords.length,
            avgRiskHistory: riskHistory,
            success: true
          });
          return;
        }
        
        // Simulate button press
        const ratingIndex = step % buttonSequence.length;
        const rating = buttonSequence[ratingIndex];
        
        console.log(`Step ${step}: Pressing "${rating}" (cards: ${knownWords.length}, risk: ${averageRisk.toFixed(3)}, introducing: ${isIntroducing})`);
        
        onRate(rating);
        step++;
        
        // Wait longer for state updates to propagate properly
        setTimeout(simulateStep, 500);
      };
      
      // Start first step
      setTimeout(simulateStep, 100);
    });
  };

  const runAllTests = async () => {
    setTestResults([]);
    setIsRunning(true);
    
    const tests = [
      {
        name: "Spam Easy (current issue - should progress but likely gets stuck)",
        sequence: ["easy" as DifficultyRating],
        expectedCards: 8, // Lower expectation to see where it actually gets stuck
        maxSteps: 30
      },
      {
        name: "Detection Test - See how many cards we can actually reach",
        sequence: ["easy" as DifficultyRating],
        expectedCards: 20, // High target to detect the actual limit
        maxSteps: 40 
      },
      {
        name: "Mixed ratings (realistic expectation)",
        sequence: ["good" as DifficultyRating, "easy" as DifficultyRating],
        expectedCards: 6, // Conservative
        maxSteps: 25
      },
      {
        name: "Conservative test (should definitely pass)",
        sequence: ["easy" as DifficultyRating, "easy" as DifficultyRating, "good" as DifficultyRating],
        expectedCards: 4, // Very low bar
        maxSteps: 20
      }
    ];
    
    const results: TestResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await runTest(test.name, test.sequence, test.expectedCards, test.maxSteps);
        results.push(result);
        console.log(`✅ Test "${test.name}" completed:`, result);
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          name: test.name,
          steps: 0,
          finalCards: knownWords.length,
          avgRiskHistory: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setTestResults(results);
    setIsRunning(false);
    console.log('🎯 All tests completed:', results);
  };

  const stopTest = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded text-sm z-50"
      >
        Debug Tests
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Algorithm Debug Tests</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Current State</div>
            <div className="text-white">Cards: {knownWords.length}</div>
            <div className="text-white">Risk: {averageRisk.toFixed(3)}</div>
            <div className="text-white">Introducing: {isIntroducing ? 'Yes' : 'No'}</div>
            <div className="text-white">Global Step: {globalStep}</div>
            <div className="text-white">Easy Streak: {consecutiveEasyCount}</div>
            <div className="text-xs text-gray-400 mt-1">
              Threshold: {Math.min(4, knownWords.length)}
            </div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Manual Controls</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => onRate('easy')} className="bg-green-600 px-2 py-1 rounded text-sm">Easy</button>
              <button onClick={() => onRate('good')} className="bg-blue-600 px-2 py-1 rounded text-sm">Good</button>
              <button onClick={() => onRate('hard')} className="bg-orange-600 px-2 py-1 rounded text-sm">Hard</button>
              <button onClick={() => onRate('fail')} className="bg-red-600 px-2 py-1 rounded text-sm">Fail</button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded text-white mr-3"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
          <button
            onClick={() => runTest("Quick Easy Test", ["easy"], 6, 15).then(result => {
              setTestResults([result]);
              setIsRunning(false);
            })}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-white mr-3"
          >
            Quick Test (15 Easy)
          </button>
          {isRunning && (
            <button
              onClick={stopTest}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            >
              Stop
            </button>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Test Results</h3>
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded ${result.success ? 'bg-green-900' : 'bg-red-900'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{result.name}</h4>
                  <span className={`px-2 py-1 rounded text-sm ${result.success ? 'bg-green-600' : 'bg-red-600'}`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>Steps: {result.steps}</div>
                  <div>Final Cards: {result.finalCards}</div>
                  {result.error && <div className="text-red-400">Error: {result.error}</div>}
                  {result.avgRiskHistory.length > 0 && (
                    <div className="mt-2">
                      <div>Risk progression:</div>
                      <div className="text-xs font-mono bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                        {result.avgRiskHistory.slice(0, 20).map(r => r.toFixed(3)).join(' → ')}
                        {result.avgRiskHistory.length > 20 && ' ...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
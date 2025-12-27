// app/structure/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MODULES } from './[moduleId]/utils/modules';
import {
  parseFramesCSV,
  parseExamplesCSV,
  getExamplesForModule,
  getFramesForModule,
} from './[moduleId]/utils/dataProcessing';
import { FrameData, FrameExampleData, ModuleProgress } from './[moduleId]/types';

function loadModuleProgress(moduleId: number, moduleExamples: FrameExampleData[]): ModuleProgress {
  const totalCount = moduleExamples.length;
  const emptyProgress: ModuleProgress = {
    seenCount: 0,
    knownCount: 0,
    totalCount,
  };

  if (typeof window === 'undefined') return emptyProgress;

  const storageKey = `srs_structure_v3_${moduleId}_normal`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return emptyProgress;

    const data = JSON.parse(stored);
    const cardStates = data.cardStates || {};

    let seenCount = 0;
    let knownCount = 0;

    const exampleIds = new Set(moduleExamples.map(ex => ex.example_id));

    for (const [cardKey, cardState] of Object.entries(cardStates)) {
      if (exampleIds.has(cardKey)) {
        seenCount++;
        const state = cardState as { phase?: string };
        const phase = state.phase || 'learning';
        if (phase === 'graduated' || phase === 'consolidation') {
          knownCount++;
        }
      }
    }

    return { seenCount, knownCount, totalCount };
  } catch (error) {
    console.warn("Failed to load module progress:", error);
    return emptyProgress;
  }
}

function countDueExamples(allExamples: FrameExampleData[]): number {
  if (typeof window === 'undefined') return 0;

  const now = new Date();
  let dueCount = 0;

  for (const mod of MODULES) {
    const storageKey = `srs_structure_v3_${mod.id}_normal`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) continue;

      const data = JSON.parse(stored);
      const cardStates = data.cardStates || {};

      for (const cardState of Object.values(cardStates)) {
        const state = cardState as { phase?: string; due?: string };
        const phase = state.phase || 'learning';
        if ((phase === 'graduated' || phase === 'consolidation') && state.due) {
          const dueDate = new Date(state.due);
          if (dueDate <= now) {
            dueCount++;
          }
        }
      }
    } catch {
      continue;
    }
  }

  return dueCount;
}

export default function StructureHomePage() {
  const router = useRouter();
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [examples, setExamples] = useState<FrameExampleData[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Map<number, ModuleProgress>>(new Map());
  const [dueCount, setDueCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset body scroll styles
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
  }, []);

  // Load CSV data
  useEffect(() => {
    Promise.all([
      fetch("/frames.csv").then(res => res.text()),
      fetch("/frame_examples.csv").then(res => res.text())
    ])
      .then(([framesCSV, examplesCSV]) => {
        const parsedFrames = parseFramesCSV(framesCSV);
        const parsedExamples = parseExamplesCSV(examplesCSV);
        setFrames(parsedFrames);
        setExamples(parsedExamples);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        setIsLoading(false);
      });
  }, []);

  // Load progress for all modules
  useEffect(() => {
    if (examples.length === 0) return;

    const progressMap = new Map<number, ModuleProgress>();
    for (const mod of MODULES) {
      const moduleExamples = getExamplesForModule(examples, mod.id);
      progressMap.set(mod.id, loadModuleProgress(mod.id, moduleExamples));
    }
    setModuleProgress(progressMap);
    setDueCount(countDueExamples(examples));
  }, [examples]);

  const handleModuleClick = (moduleId: number) => {
    router.push(`/structure/${moduleId}`);
  };

  // Calculate total stats
  const totalStats = Array.from(moduleProgress.values()).reduce(
    (acc, progress) => ({
      seen: acc.seen + progress.seenCount,
      known: acc.known + progress.knownCount,
      total: acc.total + progress.totalCount,
    }),
    { seen: 0, known: 0, total: 0 }
  );

  const hasKnownExamples = totalStats.known > 0;
  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium pt-1">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <h1 className={`text-3xl sm:text-4xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
          Sentence Structure
        </h1>

        <p className="text-sm sm:text-base text-gray-400 mb-6 mt-2 text-center max-w-md md:max-w-2xl lg:max-w-4xl px-4">
          Learn how to construct Georgian sentences through semantic frames. Each module teaches
          common grammatical patterns with example sentences.
        </p>

        {/* Progress Summary */}
        {totalStats.seen > 0 && (
          <div className="flex gap-6 mb-8 text-sm">
            <div className="text-center">
              <div className="text-gray-300 font-light text-sm">
                <span className="text-green-400 text-3xl font-bold pr-1">{totalStats.known}</span>/{totalStats.total}
              </div>
              <div className="text-gray-500">Sentences Learned</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300 font-light text-sm">
                <span className="text-blue-200 text-3xl font-bold pr-1">{totalStats.seen}</span>/{totalStats.total}
              </div>
              <div className="text-gray-500">Sentences Seen</div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-6 w-full max-w-md md:max-w-2xl lg:max-w-4xl px-4 sm:px-0">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400 py-8">Loading modules...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULES.map((module) => {
                  const progress = moduleProgress.get(module.id);
                  const hasProgress = progress && progress.seenCount > 0;

                  return (
                    <button
                      key={module.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="px-4 py-4 min-h-[80px] text-left border border-gray-600 rounded-lg text-sm sm:text-base hover:bg-gray-800 hover:border-gray-500 transition-all duration-150 ease-in-out cursor-pointer active:scale-98 flex flex-col justify-center"
                    >
                      <div className="font-medium text-gray-200">
                        {module.id}. {module.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {module.description}
                      </div>
                      {hasProgress && (
                        <div className="text-xs text-gray-400 mt-2">
                          <span className="text-gray-300">{progress.knownCount}</span>
                          <span className="text-gray-400"> of {progress.totalCount} learned</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-gray-700 space-y-3">
            {hasKnownExamples && dueCount > 0 && (
              <Link
                href="/structure/practice"
                className="block px-6 py-4 w-full text-center bg-amber-950/50 border border-amber-400/70 rounded-lg text-base hover:bg-amber-900/40 transition-all duration-150 ease-in-out font-medium active:scale-98"
              >
                <div className="text-amber-300 text-lg">{dueCount} sentences due for review</div>
                <div className="text-amber-400/70 text-sm mt-1">Tap to review now</div>
              </Link>
            )}
            {hasKnownExamples && dueCount === 0 && (
              <Link
                href="/structure/practice?practice=true"
                className="block px-6 py-4 w-full text-center bg-green-950/30 border border-green-400/50 rounded-lg text-base hover:bg-green-900/30 transition-all duration-150 ease-in-out text-green-300/80 font-medium active:scale-98"
              >
                <div>All caught up!</div>
                <div className="text-green-400/60 text-sm mt-1">Practice {totalStats.known} known sentences</div>
              </Link>
            )}
          </div>

          {/* Frame Reference Section */}
          {frames.length > 0 && examples.length > 0 && (
            <div className="pt-8 border-t border-gray-700">
              <h2 className="text-xl font-light text-gray-300 mb-6 text-center">Frame Reference</h2>
              <div className="space-y-8">
                {MODULES.map((mod) => {
                  const moduleFrames = getFramesForModule(frames, mod.id);
                  const moduleExamples = getExamplesForModule(examples, mod.id);

                  return (
                    <div key={mod.id} className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                        {mod.id}. {mod.name}
                      </h3>
                      <div className="space-y-3">
                        {moduleFrames.map((frame) => {
                          const frameExamples = moduleExamples.filter(
                            (ex) => ex.frame_id === frame.frame_id
                          );
                          const sampleExample = frameExamples[0];

                          return (
                            <div
                              key={frame.frame_id}
                              className="bg-gray-800/50 rounded-lg p-4 space-y-2"
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-gray-200 text-sm">
                                  {frame.frame_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {frameExamples.length} examples
                                </div>
                              </div>
                              <p className="text-xs text-gray-400">
                                {frame.usage_summary}
                              </p>
                              {sampleExample && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <div className="text-xs text-gray-300">
                                    {sampleExample.georgian}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {sampleExample.english}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

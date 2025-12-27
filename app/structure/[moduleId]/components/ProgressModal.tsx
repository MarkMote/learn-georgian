// app/structure/[moduleId]/components/ProgressModal.tsx
"use client";

import React from "react";
import { X } from 'lucide-react';
import { KnownExampleState } from '../types';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownExamples: KnownExampleState[];
  currentIndex: number;
}

export default function ProgressModal({
  isOpen,
  onClose,
  knownExamples,
  currentIndex,
}: ProgressModalProps) {
  if (!isOpen) return null;

  // Group examples by frame
  const examplesByFrame = new Map<string, KnownExampleState[]>();
  for (const example of knownExamples) {
    const frameId = example.frame.frame_id;
    if (!examplesByFrame.has(frameId)) {
      examplesByFrame.set(frameId, []);
    }
    examplesByFrame.get(frameId)!.push(example);
  }

  const currentExample = knownExamples[currentIndex];

  return (
    <div className="fixed inset-0 bg-neutral-950 bg-opacity-90 z-50 flex items-center justify-center top-0 bottom-0 p-0">
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

        <div className="overflow-y-auto flex-1 p-6">
          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="text-lg font-semibold text-white mb-2">
              {knownExamples.length} Sentences Introduced
            </div>
            <div className="text-sm text-gray-400">
              Grouped by {examplesByFrame.size} frames
            </div>
          </div>

          {/* Examples grouped by frame */}
          <div className="space-y-6">
            {Array.from(examplesByFrame.entries()).map(([frameId, frameExamples]) => {
              const frame = frameExamples[0]?.frame;
              if (!frame) return null;

              return (
                <div key={frameId} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    {frame.frame_name}
                  </h3>
                  <div className="space-y-1">
                    {frameExamples.map((example) => {
                      const isCurrent = currentExample?.data.example_id === example.data.example_id;

                      return (
                        <div
                          key={example.data.example_id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isCurrent ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {example.data.georgian}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {example.data.english}
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="ml-2 text-xs text-blue-400 font-medium">
                              Current
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {knownExamples.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No sentences introduced yet. Start learning to see progress here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

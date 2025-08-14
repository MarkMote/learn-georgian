"use client";

import React from "react";
import { PlayLine, KnownLineState } from "../types";

interface StoryContextProps {
  allLines: PlayLine[];
  knownLines: KnownLineState[];
  currentLineId: string;
  showEnglishFirst: boolean;
}

export default function StoryContext({
  allLines,
  knownLines,
  currentLineId,
  showEnglishFirst,
}: StoryContextProps) {
  const knownLineIds = new Set(knownLines.map(kl => kl.data.id));
  const currentLineIndex = allLines.findIndex(line => line.id === currentLineId);
  
  const renderText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const getLineStatus = (line: PlayLine, index: number) => {
    if (line.id === currentLineId) return 'current';
    if (knownLineIds.has(line.id)) return 'learned';
    if (index < currentLineIndex) return 'past';
    return 'future';
  };

  return (
    <div className="max-h-48 overflow-y-auto px-4 py-2 border-b border-gray-800 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="space-y-2">
        {allLines.map((line, index) => {
          const status = getLineStatus(line, index);
          
          let className = "text-xs py-1 px-2 rounded ";
          
          switch (status) {
            case 'current':
              className += "bg-blue-900 text-white border border-blue-500";
              break;
            case 'learned':
              className += "text-gray-300 bg-gray-800/50";
              break;
            case 'past':
              className += "text-gray-500";
              break;
            case 'future':
              className += "text-gray-600 opacity-50";
              break;
          }

          const shouldShow = status === 'current' || 
                           status === 'learned' || 
                           (status === 'past' && index >= currentLineIndex - 5) ||
                           (status === 'future' && status === 'learned');

          if (!shouldShow) return null;

          return (
            <div key={line.id} className={className}>
              <div className="text-gray-400 text-xs mb-1">
                {line.speaker} {status === 'current' && '← Current'}
              </div>
              
              {/* Show both languages for past/learned lines, single language for current */}
              {status === 'current' ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderText(showEnglishFirst ? line.english : line.georgian) 
                  }} 
                />
              ) : (
                <div className="space-y-1">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: renderText(line.georgian) 
                    }} 
                  />
                  <div 
                    className="text-xs opacity-75"
                    dangerouslySetInnerHTML={{ 
                      __html: renderText(line.english) 
                    }} 
                  />
                </div>
              )}
              
              {status === 'current' && (
                <div className="text-xs text-gray-400 mt-1">
                  {showEnglishFirst ? 'Tap to see Georgian' : 'Tap to see English'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
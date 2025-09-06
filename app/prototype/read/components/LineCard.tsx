"use client";

import React from "react";
import { PlayLine } from "../types";

interface LineCardProps {
  currentLine: PlayLine;
  contextLines: PlayLine[];
  isFlipped: boolean;
  showEnglishFirst: boolean;
}

export default function LineCard({
  currentLine,
  contextLines,
  isFlipped,
  showEnglishFirst,
}: LineCardProps) {
  const renderText = (text: string) => {
    // Simple markdown rendering for bold text
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg px-4">
      {/* Current line - mobile-first design */}
      <div className="border border-gray-600 rounded-lg p-4 bg-gray-900 w-full">
        <div className="text-gray-300 text-xs mb-2">{currentLine.speaker}</div>
        
        {!isFlipped ? (
          <div className="text-lg leading-relaxed">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: renderText(showEnglishFirst ? currentLine.english : currentLine.georgian) 
              }} 
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-base leading-relaxed text-gray-300">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderText(showEnglishFirst ? currentLine.english : currentLine.georgian) 
                }} 
              />
            </div>
            <div className="text-lg leading-relaxed">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderText(showEnglishFirst ? currentLine.georgian : currentLine.english) 
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {!isFlipped && (
        <div className="mt-3 text-xs text-gray-400">
          Tap to reveal {showEnglishFirst ? 'Georgian' : 'English'}
        </div>
      )}
    </div>
  );
}
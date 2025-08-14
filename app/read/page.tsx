"use client";

import React, { useEffect, useState } from "react";
import BottomBar from '../components/BottomBar';
import LineCard from './components/LineCard';
import StoryContext from './components/StoryContext';
import { useReadState } from './hooks/useReadState';
import { PlayData, PlayLine } from './types';

export default function ReadPage() {
  const [playData, setPlayData] = useState<PlayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    knownLines,
    currentIndex,
    isFlipped,
    showEnglishFirst,
    readingPosition,
    setIsFlipped,
    setShowEnglishFirst,
    handleScore,
    getContextLines,
    clearProgress,
  } = useReadState(playData?.lines || []);

  useEffect(() => {
    fetch("/play-sample.json")
      .then((res) => res.json())
      .then((data: PlayData) => {
        setPlayData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading play data:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
          break;
        case "t":
          setShowEnglishFirst((prev) => !prev);
          break;
        case "r":
          if (isFlipped) handleScore("easy");
          break;
        case "e":
          if (isFlipped) handleScore("good");
          break;
        case "w":
          if (isFlipped) handleScore("hard");
          break;
        case "q":
          if (isFlipped) handleScore("fail");
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, handleScore, setIsFlipped, setShowEnglishFirst]);

  useEffect(() => {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Loading play...</p>
      </div>
    );
  }

  if (!playData) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <p className="text-lg">Error loading play data</p>
      </div>
    );
  }

  if (knownLines.length === 0) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="w-96 h-32 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-48 mx-auto"></div>
        </div>
        <p className="text-lg">Preparing your first line...</p>
      </div>
    );
  }

  const currentLine = knownLines[currentIndex];
  if (!currentLine) {
    return (
      <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <p>Loading next line...</p>
      </div>
    );
  }

  const contextLines = getContextLines();

  const handleFlip = () => {
    setIsFlipped(true);
  };

  return (
    <div 
      className="relative w-full bg-black text-white flex flex-col" 
      style={{ height: '100dvh' }}
    >
      {/* Compact top bar */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold">{playData.title}</h1>
          <p className="text-xs text-gray-400">by {playData.author}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {readingPosition}/{playData.lines.length} • {knownLines.length} known
          </p>
          <button
            onClick={() => setShowEnglishFirst(prev => !prev)}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded mt-1"
          >
            {showEnglishFirst ? 'EN→GE' : 'GE→EN'}
          </button>
        </div>
      </div>

      {/* Scrollable story context */}
      <StoryContext
        allLines={playData.lines}
        knownLines={knownLines}
        currentLineId={currentLine.data.id}
        showEnglishFirst={showEnglishFirst}
      />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-2 py-4">
        <LineCard
          currentLine={currentLine.data}
          contextLines={contextLines}
          isFlipped={isFlipped}
          showEnglishFirst={showEnglishFirst}
        />
      </div>

      {/* Bottom bar for ratings */}
      <div className="flex-shrink-0">
        <BottomBar
          isFlipped={isFlipped}
          isLeftHanded={false} // Can add this as state later if needed
          onFlip={handleFlip}
          onRate={handleScore}
          onToggleHandedness={() => {}} // Placeholder for now
        />
      </div>
    </div>
  );
}
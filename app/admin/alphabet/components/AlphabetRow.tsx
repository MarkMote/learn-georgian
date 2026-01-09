// app/admin/alphabet/components/AlphabetRow.tsx
"use client";

import React, { useState, useRef } from "react";
import { Volume2, Loader2 } from "lucide-react";

type AlphabetData = {
  georgianLetter: string;
  englishLetter: string;
  ipaSymbol: string;
  explanation: string;
  georgianExample: string;
  englishExample: string;
  translation: string;
  englishEquivalent: string;
};

interface AlphabetRowProps {
  letter: AlphabetData;
  onAudioGenerated?: (georgianLetter: string) => void;
  hasAudio?: boolean;
}

export default function AlphabetRow({ letter, onAudioGenerated, hasAudio = true }: AlphabetRowProps) {
  // Audio state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      // Extract just the Georgian part from georgianExample (e.g., "მამა (mama)" -> "მამა")
      const cleanExample = letter.georgianExample.split('(')[0].trim();

      const response = await fetch("/api/admin/generate-alphabet-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          georgianLetter: letter.georgianLetter,
          georgianExample: cleanExample,
          englishLetter: letter.englishLetter,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      onAudioGenerated?.(letter.georgianLetter);
      alert("Audio generated successfully!");
    } catch (error: any) {
      console.error("Error generating audio:", error);
      alert(`Failed to generate audio: ${error.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playAudioSequence = async (basePath: string, setPlaying: (val: boolean) => void) => {
    setPlaying(true);
    try {
      // Play v1
      await playAudio(`${basePath}_v1.mp3`);
      // Pause
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Play v2
      await playAudio(`${basePath}_v2.mp3`);
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setPlaying(false);
    }
  };

  const playAudio = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Failed to play audio"));

      audio.play().catch(reject);
    });
  };

  const handlePlayWord = () => {
    playAudioSequence(`/audio/alphabet/${letter.georgianLetter}/word`, setIsPlayingWord);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Letter Display */}
        <div className="flex-shrink-0 w-[100px] h-[100px] bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-5xl">{letter.georgianLetter}</span>
        </div>

        {/* Letter Info */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col">
            <h3 className="text-base font-medium text-white pb-1">
              {letter.englishLetter} - {letter.ipaSymbol}
            </h3>
            <p className="text-gray-300 text-base">{letter.explanation}</p>
          </div>
          {letter.georgianExample && (
            <div className="mt-2 text-base text-gray-200">
              <p className="text-gray-200">{letter.georgianExample}</p>
              {letter.translation && (
                <p className="text-gray-400 text-sm">{letter.translation}</p>
              )}
            </div>
          )}

          {/* Audio controls */}
          <div className="flex-shrink-0 flex flex-wrap gap-2 w-full mt-3 md:w-auto">
            <button
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
              className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-2"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Generate Audio
                </>
              )}
            </button>
            {letter.georgianExample && (
              <button
                onClick={handlePlayWord}
                disabled={!hasAudio || isPlayingWord}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white text-sm rounded-lg transition-colors touch-manipulation flex items-center justify-center gap-2"
              >
                {isPlayingWord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Play Word
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

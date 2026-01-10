// app/alphabet/deck/components/FlashCard.tsx
"use client";

import React, { useState, useRef } from "react";
import { Volume2 } from "lucide-react";
import { AlphabetData } from "../types";

interface FlashCardProps {
  letter: AlphabetData;
  isFlipped: boolean;
}

export default function FlashCard({
  letter,
  isFlipped,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(letter.georgianLetter);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
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

  const handlePlayWord = async () => {
    const currentPlaybackId = ++playbackIdRef.current;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(true);
    try {
      await playAudio(`/audio/alphabet/${letter.georgianLetter}/word_v1.mp3`);

      if (playbackIdRef.current !== currentPlaybackId) return;

      await new Promise((resolve) => setTimeout(resolve, 50));

      if (playbackIdRef.current !== currentPlaybackId) return;

      await playAudio(`/audio/alphabet/${letter.georgianLetter}/word_v2.mp3`);
    } catch (error) {
      if (playbackIdRef.current === currentPlaybackId) {
        console.error("Error playing audio:", error);
      }
    } finally {
      if (playbackIdRef.current === currentPlaybackId) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg min-h-[400px]">
      {!isFlipped ? (
        // Front of card - just the Georgian letter in large font
        <div className="flex items-center justify-center py-8">
          <p className="text-8xl md:text-9xl tracking-wider">
            {letter.georgianLetter}
          </p>
        </div>
      ) : (
        // Back of card - Georgian letter + transliteration + IPA + explanation + example
        <div className="flex flex-col items-center justify-start space-y-2 w-full py-8  ">
          {/* Georgian letter (still shown) */}
          <p
            className={`text-6xl md:text-7xl tracking-wider cursor-pointer mb-6 ${justCopied ? 'text-green-400' : ''}`}
            onClick={handleCopyGeorgian}
            title="Click to copy Georgian letter"
          >
            {letter.georgianLetter}
          </p>
          <div className="w-full h-px bg-gray-800 my-1 max-w-[200px]"></div>

          {/* Transliteration and IPA */}
          <p className="text-2xl pt-3 text-gray-200 mt-6">
            {letter.englishLetter} <span className="text-gray-300">({letter.ipaSymbol})</span>
          </p>

          {/* Explanation */}
          <p className="text-lg text-gray-400 max-w-md px-4">
            {letter.explanation}
          </p>


          {/* Georgian example with translation */}
          {letter.georgianExample && (
            <div className="mt-6 pt-6">
              <button
                onClick={handlePlayWord}
                className="group flex flex-col items-center gap-1 touch-manipulation"
                aria-label={`Play pronunciation of ${letter.georgianExample}`}
              >
                <span className="flex items-center gap-3 text-2xl text-gray-200 group-hover:text-cyan-300 transition-colors">
                  {letter.georgianExample}
                  <Volume2 size={26} className={`text-gray-400 group-hover:text-cyan-400 transition-colors ${isPlaying ? "text-cyan-400 animate-pulse" : ""}`} />
                </span>
                {letter.translation && (
                  <span className="text-lg text-gray-400">
                    {letter.translation}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* English example (if provided) */}
          {/* {letter.englishExample && (
            <p className="text-sm text-gray-300 italic mt-2">
              "{letter.englishExample}"
            </p>
          )} */}
        </div>
      )}
    </div>
  );
}

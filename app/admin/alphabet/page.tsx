// app/admin/alphabet/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Home, Loader2 } from "lucide-react";
import Papa from 'papaparse';
import AlphabetRow from "./components/AlphabetRow";

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

function parseCSV(csvText: string): AlphabetData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any) => ({
    georgianLetter: row.georgianLetter || "",
    englishLetter: row.englishLetter || "",
    ipaSymbol: row.ipaSymbol || "",
    explanation: row.explanation || "",
    georgianExample: row.georgianExample || "",
    englishExample: row.englishExample || "",
    translation: row.translation || "",
    englishEquivalent: row.englishEquivalent || "",
  }));
}

export default function AdminAlphabetPage() {
  const [letters, setLetters] = useState<AlphabetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingAudio, setMissingAudio] = useState<AlphabetData[]>([]);
  const [checkingAudio, setCheckingAudio] = useState(false);

  useEffect(() => {
    fetch("/alphabet.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setLetters(parsed);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading alphabet:", error);
        setLoading(false);
      });
  }, []);

  // Check which audio files are missing (find first N missing)
  const checkMissingAudio = useCallback(async (limit?: number): Promise<AlphabetData[]> => {
    setCheckingAudio(true);
    const missing: AlphabetData[] = [];

    for (const letter of letters) {
      if (limit && missing.length >= limit) {
        break;
      }

      try {
        // Check if word audio exists (checking just one file as representative)
        const response = await fetch(`/audio/alphabet/${letter.georgianLetter}/word_v1.mp3`, { method: "HEAD" });
        if (!response.ok) {
          missing.push(letter);
        }
      } catch {
        missing.push(letter);
      }
    }

    setMissingAudio(missing);
    setCheckingAudio(false);
    return missing;
  }, [letters]);

  // Check for missing audio when letters load (only first 10 to prevent lag)
  useEffect(() => {
    if (letters.length > 0) {
      checkMissingAudio(10);
    }
  }, [letters, checkMissingAudio]);

  const handleAudioGenerated = (georgianLetter: string) => {
    // Remove the letter from missing audio list
    setMissingAudio((prevMissing) =>
      prevMissing.filter((letter) => letter.georgianLetter !== georgianLetter)
    );
  };

  // Create a Set of Georgian letters that are known to be missing audio (for fast lookup)
  const missingAudioLetters = useMemo(() => {
    return new Set(missingAudio.map(letter => letter.georgianLetter));
  }, [missingAudio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading alphabet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-6xl mx-auto px-3 py-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation"
                aria-label="Go to Home"
              >
                <Home size={20} />
              </Link>
              <h1 className="text-xl md:text-2xl font-light">Alphabet Audio Admin</h1>
            </div>
            <div className="text-xs md:text-sm text-gray-400">
              {letters.length} letters
            </div>
          </div>

          {/* Audio Status */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs font-semibold text-gray-400 mb-2">AUDIO</div>
            {checkingAudio ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Checking for missing audio...
              </div>
            ) : missingAudio.length > 0 ? (
              <div className="text-sm text-gray-400">
                {missingAudio.length}+ missing audio file{missingAudio.length !== 1 ? "s" : ""} (sample check)
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                First 10 letters have audio - <button onClick={() => checkMissingAudio()} className="text-blue-400 hover:text-blue-300 underline">check all</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 py-3 md:p-4">
        <div className="space-y-2 md:space-y-3">
          {letters.map((letter, index) => (
            <AlphabetRow
              key={index}
              letter={letter}
              onAudioGenerated={handleAudioGenerated}
              hasAudio={!missingAudioLetters.has(letter.georgianLetter)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

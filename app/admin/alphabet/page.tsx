// app/admin/alphabet/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Home, Loader2, Play, Square } from "lucide-react";
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

interface BatchProgress {
  current: number;
  total: number;
  currentLetter: string;
  errors: Array<{ letter: string; error: string }>;
}

export default function AdminAlphabetPage() {
  const [letters, setLetters] = useState<AlphabetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingAudio, setMissingAudio] = useState<AlphabetData[]>([]);
  const [checkingAudio, setCheckingAudio] = useState(false);

  // Batch generation state
  const [batchAudioProgress, setBatchAudioProgress] = useState<BatchProgress | null>(null);
  const [batchAudioLimit, setBatchAudioLimit] = useState(10);
  const stopBatchAudioRef = useRef(false);

  // Similar sounds audio state
  const [similarSoundsGenerating, setSimilarSoundsGenerating] = useState(false);
  const [similarSoundsResult, setSimilarSoundsResult] = useState<{ success: boolean; message: string } | null>(null);

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

  // Generate audio for a single letter
  const generateAudioForLetter = async (letter: AlphabetData): Promise<void> => {
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
  };

  // Start batch audio generation
  const startBatchAudioGeneration = async () => {
    // First, check all files to get accurate missing count
    const allMissing = await checkMissingAudio();

    // Use the accurate missing list
    const lettersToGenerate = allMissing.slice(0, batchAudioLimit);
    if (lettersToGenerate.length === 0) return;

    stopBatchAudioRef.current = false;
    setBatchAudioProgress({
      current: 0,
      total: lettersToGenerate.length,
      currentLetter: lettersToGenerate[0].englishLetter,
      errors: [],
    });

    for (let i = 0; i < lettersToGenerate.length; i++) {
      if (stopBatchAudioRef.current) break;

      const letter = lettersToGenerate[i];
      setBatchAudioProgress((prev) => prev ? {
        ...prev,
        current: i,
        currentLetter: letter.englishLetter,
      } : null);

      try {
        await generateAudioForLetter(letter);
        setMissingAudio((prev) => prev.filter((l) => l.georgianLetter !== letter.georgianLetter));
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        setBatchAudioProgress((prev) => prev ? {
          ...prev,
          errors: [...prev.errors, { letter: letter.englishLetter, error: error.message }],
        } : null);
      }
    }

    setBatchAudioProgress((prev) => prev ? { ...prev, current: prev.total, currentLetter: "Done!" } : null);
  };

  // Stop batch audio generation
  const stopBatchAudioGeneration = () => {
    stopBatchAudioRef.current = true;
  };

  // Generate similar sounds audio
  const generateSimilarSoundsAudio = async () => {
    setSimilarSoundsGenerating(true);
    setSimilarSoundsResult(null);

    try {
      const response = await fetch("/api/admin/generate-similar-sounds-audio", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSimilarSoundsResult({
          success: true,
          message: `Generated ${data.generated?.length || 0} audio files`,
        });
      } else {
        setSimilarSoundsResult({
          success: false,
          message: data.error || "Failed to generate audio",
        });
      }
    } catch (error: any) {
      setSimilarSoundsResult({
        success: false,
        message: error.message || "Network error",
      });
    } finally {
      setSimilarSoundsGenerating(false);
    }
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
            ) : batchAudioProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-400">Generating: </span>
                    <span className="text-white">{batchAudioProgress.currentLetter}</span>
                    <span className="text-gray-500 ml-2">
                      ({batchAudioProgress.current + 1}/{batchAudioProgress.total})
                    </span>
                  </div>
                  {batchAudioProgress.current < batchAudioProgress.total && (
                    <button
                      onClick={stopBatchAudioGeneration}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchAudioProgress.current / batchAudioProgress.total) * 100}%` }}
                  />
                </div>
                {batchAudioProgress.errors.length > 0 && (
                  <div className="text-xs text-red-400">
                    {batchAudioProgress.errors.length} error(s)
                  </div>
                )}
                {batchAudioProgress.current >= batchAudioProgress.total && (
                  <button
                    onClick={() => {
                      setBatchAudioProgress(null);
                      checkMissingAudio();
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Done - Refresh
                  </button>
                )}
              </div>
            ) : missingAudio.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {missingAudio.length}+ missing audio file{missingAudio.length !== 1 ? "s" : ""} (sample check)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={missingAudio.length}
                      value={batchAudioLimit}
                      onChange={(e) => setBatchAudioLimit(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                    />
                    <button
                      onClick={startBatchAudioGeneration}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Play size={14} />
                      Generate Next {Math.min(batchAudioLimit, missingAudio.length)}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                First 10 letters have audio - <button onClick={() => checkMissingAudio()} className="text-blue-400 hover:text-blue-300 underline">check all</button>
              </div>
            )}
          </div>

          {/* Similar Sounds Audio */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs font-semibold text-gray-400 mb-2">SIMILAR SOUNDS AUDIO</div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Generate audio for minimal pairs (20 words)
              </div>
              <button
                onClick={generateSimilarSoundsAudio}
                disabled={similarSoundsGenerating}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                {similarSoundsGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Generate All
                  </>
                )}
              </button>
            </div>
            {similarSoundsResult && (
              <div className={`mt-2 text-sm ${similarSoundsResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {similarSoundsResult.message}
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

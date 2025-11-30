// app/admin/images/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Home, AlertTriangle, Play, Square, Loader2 } from "lucide-react";
import { WordData } from "@/lib/spacedRepetition/types";
import { parseCSV } from "@/app/review/[chunkId]/utils/dataProcessing";
import ImageRow from "./components/ImageRow";
import PreviewModal from "./components/PreviewModal";
import { GeneratedImage } from "./types";

interface BatchProgress {
  current: number;
  total: number;
  currentWord: string;
  errors: Array<{ word: string; error: string }>;
}

export default function AdminImagesPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [tipSuggestions, setTipSuggestions] = useState<Record<string, Array<{ timestamp: string; tip: string }>>>({});

  // Batch generation state
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [missingImages, setMissingImages] = useState<WordData[]>([]);
  const [checkingImages, setCheckingImages] = useState(false);
  const stopBatchRef = useRef(false);

  useEffect(() => {
    // Load words
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading words:", error);
        setLoading(false);
      });

    // Load tip suggestions
    fetch("/api/tip-suggestions")
      .then((res) => res.json())
      .then((data) => {
        setTipSuggestions(data.suggestions || {});
      })
      .catch((error) => {
        console.error("Error loading tip suggestions:", error);
      });
  }, []);

  const handleImageGenerated = (generatedImage: GeneratedImage) => {
    setPreviewImage(generatedImage);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleWordUpdated = (key: string, updates: Partial<WordData>) => {
    // Update the specific word by key
    setAllWords((prevWords) =>
      prevWords.map((word) =>
        word.key === key
          ? { ...word, ...updates }
          : word
      )
    );
  };

  // Check which images are missing
  const checkMissingImages = useCallback(async () => {
    setCheckingImages(true);
    const missing: WordData[] = [];

    for (const word of allWords) {
      try {
        const response = await fetch(`/img/${word.img_key}.webp`, { method: "HEAD" });
        if (!response.ok) {
          missing.push(word);
        }
      } catch {
        missing.push(word);
      }
    }

    setMissingImages(missing);
    setCheckingImages(false);
  }, [allWords]);

  // Check for missing images when words load
  useEffect(() => {
    if (allWords.length > 0) {
      checkMissingImages();
    }
  }, [allWords, checkMissingImages]);

  // Generate a single image for a word
  const generateImageForWord = async (word: WordData): Promise<GeneratedImage> => {
    // First, generate a creative prompt using the LLM
    const promptResponse = await fetch("/api/admin/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        englishWord: word.EnglishWord,
        georgianWord: word.GeorgianWord,
        exampleEnglish: word.ExampleEnglish1,
        partOfSpeech: word.PartOfSpeech,
      }),
    });

    if (!promptResponse.ok) {
      const errorData = await promptResponse.json();
      throw new Error(errorData.error || "Failed to generate prompt");
    }

    const promptData = await promptResponse.json();
    const generatedPrompt = promptData.prompt;

    // Now generate the image
    const response = await fetch("/api/admin/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: generatedPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate image");
    }

    const data = await response.json();
    return {
      imageBase64: data.image,
      prompt: generatedPrompt,
      imgKey: word.img_key,
    };
  };

  // Start batch generation
  const startBatchGeneration = async () => {
    if (missingImages.length === 0) return;

    stopBatchRef.current = false;
    setBatchProgress({
      current: 0,
      total: missingImages.length,
      currentWord: missingImages[0].EnglishWord,
      errors: [],
    });

    for (let i = 0; i < missingImages.length; i++) {
      if (stopBatchRef.current) break;

      const word = missingImages[i];
      setBatchProgress((prev) => prev ? {
        ...prev,
        current: i,
        currentWord: word.EnglishWord,
      } : null);

      try {
        const generatedImage = await generateImageForWord(word);
        // Show in preview modal so user can save
        setPreviewImage(generatedImage);

        // Wait a bit between generations to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        setBatchProgress((prev) => prev ? {
          ...prev,
          errors: [...prev.errors, { word: word.EnglishWord, error: error.message }],
        } : null);
      }
    }

    setBatchProgress((prev) => prev ? { ...prev, current: prev.total, currentWord: "Done!" } : null);
  };

  // Stop batch generation
  const stopBatchGeneration = () => {
    stopBatchRef.current = true;
  };

  // Find duplicate keys
  const duplicates = useMemo(() => {
    const keyCount: Record<string, WordData[]> = {};
    allWords.forEach((word) => {
      if (!keyCount[word.key]) {
        keyCount[word.key] = [];
      }
      keyCount[word.key].push(word);
    });

    // Return only keys that appear more than once
    return Object.entries(keyCount)
      .filter(([, words]) => words.length > 1)
      .map(([key, words]) => ({ key, words, count: words.length }));
  }, [allWords]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading words...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
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
              <h1 className="text-xl md:text-2xl font-light">Image Admin</h1>
            </div>
            <div className="text-xs md:text-sm text-gray-400">
              {allWords.length} words
            </div>
          </div>

          {/* Batch Generation Controls */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            {checkingImages ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Checking for missing images...
              </div>
            ) : batchProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-400">Generating: </span>
                    <span className="text-white">{batchProgress.currentWord}</span>
                    <span className="text-gray-500 ml-2">
                      ({batchProgress.current + 1}/{batchProgress.total})
                    </span>
                  </div>
                  {batchProgress.current < batchProgress.total && (
                    <button
                      onClick={stopBatchGeneration}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
                {batchProgress.errors.length > 0 && (
                  <div className="text-xs text-red-400">
                    {batchProgress.errors.length} error(s)
                  </div>
                )}
                {batchProgress.current >= batchProgress.total && (
                  <button
                    onClick={() => {
                      setBatchProgress(null);
                      checkMissingImages();
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Done - Refresh
                  </button>
                )}
              </div>
            ) : missingImages.length > 0 ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {missingImages.length} missing image{missingImages.length !== 1 ? "s" : ""}
                </div>
                <button
                  onClick={startBatchGeneration}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Play size={14} />
                  Generate All Missing
                </button>
              </div>
            ) : (
              <div className="text-sm text-green-400">
                All images present
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicates Warning */}
      {duplicates.length > 0 && (
        <div className="max-w-6xl mx-auto px-3 pt-3 md:px-4 md:pt-4">
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-amber-500" size={20} />
              <h2 className="text-amber-400 font-medium">
                Duplicate Keys Found ({duplicates.length})
              </h2>
            </div>
            <p className="text-amber-200/70 text-sm mb-4">
              The following word keys appear multiple times. Keys should be unique.
            </p>
            <div className="space-y-3">
              {duplicates.map(({ key, words, count }) => (
                <div key={key} className="bg-black/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-amber-300">{key}</span>
                    <span className="text-xs text-amber-500">{count} occurrences</span>
                  </div>
                  <div className="space-y-1">
                    {words.map((word, idx) => (
                      <div key={idx} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span>{word.georgian}</span>
                        <span className="text-gray-500">→</span>
                        <span>{word.english}</span>
                        {word.chunk && (
                          <span className="text-gray-600 text-xs">
                            (chunk: {word.chunk})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 py-3 md:p-4">
        <div className="space-y-2 md:space-y-3">
          {allWords.map((word) => (
            <ImageRow
              key={word.key}
              word={word}
              onImageGenerated={handleImageGenerated}
              onWordUpdated={handleWordUpdated}
              suggestedTips={tipSuggestions[word.key] || []}
            />
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <PreviewModal
          generatedImage={previewImage}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

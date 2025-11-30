// app/admin/images/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import { WordData } from "@/lib/spacedRepetition/types";
import { parseCSV } from "@/app/review/[chunkId]/utils/dataProcessing";
import ImageRow from "./components/ImageRow";
import PreviewModal from "./components/PreviewModal";
import { GeneratedImage } from "./types";

export default function AdminImagesPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [tipSuggestions, setTipSuggestions] = useState<Record<string, Array<{ timestamp: string; tip: string }>>>({});

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

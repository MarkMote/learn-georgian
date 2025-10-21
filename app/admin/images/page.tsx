// app/admin/images/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { WordData } from "@/lib/spacedRepetition/types";
import { parseCSV } from "@/app/review/[chunkId]/utils/dataProcessing";
import ImageRow from "./components/ImageRow";
import PreviewModal from "./components/PreviewModal";
import { GeneratedImage } from "./types";

export default function AdminImagesPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [uniqueWords, setUniqueWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);

        // Get unique words by img_key (since multiple word forms share the same image)
        const uniqueByImgKey = new Map<string, WordData>();
        for (const word of parsed) {
          if (!uniqueByImgKey.has(word.img_key)) {
            uniqueByImgKey.set(word.img_key, word);
          }
        }

        setUniqueWords(Array.from(uniqueByImgKey.values()));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading words:", error);
        setLoading(false);
      });
  }, []);

  const handleImageGenerated = (generatedImage: GeneratedImage) => {
    setPreviewImage(generatedImage);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

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
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Go to Home"
              >
                <Home size={20} />
              </Link>
              <h1 className="text-2xl font-light">Image Admin</h1>
            </div>
            <div className="text-sm text-gray-400">
              {uniqueWords.length} unique images
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-2">
          {uniqueWords.map((word) => (
            <ImageRow
              key={word.img_key}
              word={word}
              onImageGenerated={handleImageGenerated}
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

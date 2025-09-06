"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { ArrowLeft } from 'lucide-react';

type ChunkData = {
  chunk_key: string;
  chunk_en: string;
  chunk_ka: string;
  explanation: string;
  example_en: string;
  example_ka: string;
};

const CHUNK_SIZE = 50;

function parseCSV(csvText: string): ChunkData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any, index: number) => ({
    chunk_key: `chunk_${index}`,
    chunk_en: row.chunk_en || "",
    chunk_ka: row.chunk_ka || "",
    explanation: row.explanation || "",
    example_en: row.example_en || "",
    example_ka: row.example_ka || "",
  }));
}

function getChunkCount(allChunks: ChunkData[]): number {
  return Math.ceil(allChunks.length / CHUNK_SIZE);
}

export default function ChunkHomePage() {
  const router = useRouter();
  const [allChunks, setAllChunks] = useState<ChunkData[]>([]);
  const [chunkCount, setChunkCount] = useState<number>(0);

  useEffect(() => {
    fetch("/chunks.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllChunks(parsed);
        setChunkCount(getChunkCount(parsed));
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);

  const handleChunkClick = (chunkNumber: number) => {
    router.push(`/chunks/${chunkNumber}`);
  };

  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <h1 className={`text-3xl sm:text-4xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
          Colloquial Georgian
        </h1>
        
        <p className="text-sm sm:text-base text-gray-400 mb-8 sm:mb-10 text-center max-w-md px-4">
          Practice with 50-phrase sets. Text-based flashcards with spaced repetition, examples, and explanations.
        </p>

        <div className="flex flex-col space-y-6 w-full max-w-md px-4 sm:px-0">
          <div className="space-y-3">
            {chunkCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: chunkCount }, (_, index) => {
                  const chunkNumber = index + 1;
                  const startChunk = index * CHUNK_SIZE + 1;
                  const endChunk = Math.min((index + 1) * CHUNK_SIZE, allChunks.length);
                  
                  return (
                    <button
                      key={chunkNumber}
                      onClick={() => handleChunkClick(chunkNumber)}
                      className="px-4 py-3 sm:py-4 text-center border border-gray-600 rounded-lg text-sm sm:text-base hover:bg-gray-800 hover:border-gray-500 transition-all duration-150 ease-in-out cursor-pointer active:scale-98"
                    >
                      Phrases {startChunk}-{endChunk}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">Loading phrase sets...</div>
            )}
          </div>

          {/* Review All Chunks Button */}
          <div className="pt-6 border-t border-gray-700">
            <Link 
              href="/chunks/all" 
              className="block px-6 py-4 w-full text-center border-2 border-blue-600 rounded-lg text-base sm:text-lg hover:bg-blue-900/20 transition-all duration-150 ease-in-out text-blue-400 font-medium active:scale-98"
            >
              Review All Phrases
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
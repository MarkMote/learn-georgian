"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

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
    router.push(`/chunk/${chunkNumber}`);
  };

  const containerClasses = "flex flex-col items-center justify-center min-h-screen bg-black text-white p-4";
  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className={containerClasses}>
      <h1 className={`text-4xl font-light mb-2 text-slate-300 ${carvedTextStyle}`}>
        Chunk Practice
      </h1>
      
      <p className="text-sm text-gray-400 mb-8 text-center max-w-md">
        Practice with 50-chunk sets. Text-based flashcards with spaced repetition, examples, and explanations.
      </p>

      <div className="flex flex-col space-y-6 text-sm max-w-md w-full">
        <div className="space-y-3">
          {chunkCount > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: chunkCount }, (_, index) => {
                const chunkNumber = index + 1;
                const startChunk = index * CHUNK_SIZE + 1;
                const endChunk = Math.min((index + 1) * CHUNK_SIZE, allChunks.length);
                
                return (
                  <button
                    key={chunkNumber}
                    onClick={() => handleChunkClick(chunkNumber)}
                    className="px-4 py-3 text-center border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out cursor-pointer"
                  >
                    Chunks {startChunk}-{endChunk}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400">Loading chunk sets...</div>
          )}
        </div>

        {/* Review All Chunks Button */}
        <div className="pt-6 border-t border-gray-700">
          <Link 
            href="/chunk/all" 
            className="block px-8 py-4 w-full text-center border border-blue-600 rounded text-lg hover:bg-blue-900/20 transition-colors duration-150 ease-in-out text-blue-400"
          >
            Review All Chunks
          </Link>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
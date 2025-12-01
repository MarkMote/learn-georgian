// app/alphabet/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, BookOpen } from 'lucide-react';
import Papa from 'papaparse';

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

function getEquivalentIcon(equiv: string) {
  if (equiv === "yes") return <span className="text-green-400 font-bold text-lg" title="Has English equivalent">●</span>;
  if (equiv === "similar") return <span className="text-yellow-400 font-bold text-lg" title="Similar to English">●</span>;
  if (equiv === "no") return <span className="text-red-400 font-bold text-lg" title="No English equivalent">●</span>;
  return null;
}

export default function AlphabetPage() {
  const [letters, setLetters] = useState<AlphabetData[]>([]);

  // Reset body scroll styles (in case deck page disabled them)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    fetch("/alphabet.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setLetters(parsed);
      })
      .catch((error) => {
        console.error("Error loading alphabet:", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-950/90 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Go to Home"
            >
              <Home size={20} />
            </Link>
            <h1 className="text-lg sm:text-2xl font-light">Georgian Alphabet</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 text-center">
            The Georgian alphabet has 33 letters. Each letter always represents the same sound and each letter of a word is always pronounced.
          </p>
          <Link
            href="/alphabet/deck"
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto px-6 py-3 
            bg-indigo-900/50 border-indigo-700 border hover:bg-indigo-900/80 rounded-lg transition-colors text-indigo-100"
          >
            <BookOpen size={18} />
            <span>Practice Georgian Alphabet</span>
          </Link>
        </div>

        {/* Legend */}
        <div className="mb-8 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-green-400 font-bold">●</span>
              <span className="text-gray-300">Has English equivalent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 font-bold">●</span>
              <span className="text-gray-300">Similar to English</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-red-400 font-bold">●</span>
              <span className="text-gray-300">No English equivalent</span>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {letters.map((letter, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-5xl mb-1 px-5">{letter.georgianLetter}</span>
                  {/* {getEquivalentIcon(letter.englishEquivalent)} */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span>{getEquivalentIcon(letter.englishEquivalent)}</span>
                    <span className="text-xl font-medium">{letter.englishLetter}</span>
                    <span className="text-xl text-gray-400">{letter.ipaSymbol}</span>
                  </div>
                  {letter.explanation && (
                    <p className="text-sm text-gray-300 mb-2">{letter.explanation}</p>
                  )}
                  {letter.georgianExample && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
                      <p className="text-sm">{letter.georgianExample}</p>
                      {letter.translation && (
                        <p className="text-xs text-gray-500">{letter.translation}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-300"></th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Letter</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Transliteration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">IPA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Explanation</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Example</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((letter, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="py-4 px-4 text-center">
                    {getEquivalentIcon(letter.englishEquivalent)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-5xl">{letter.georgianLetter}</span>
                  </td>
                  <td className="py-4 px-4 text-lg">{letter.englishLetter}</td>
                  <td className="py-4 px-4 text-lg text-gray-200">{letter.ipaSymbol}</td>
                  <td className="py-4 px-4 text-lg text-gray-200 max-w-md">{letter.explanation}</td>
                  <td className="py-4 px-4">
                    {letter.georgianExample && (
                      <div className="space-y-1">
                        <p className="text-base">{letter.georgianExample}</p>
                        {letter.translation && (
                          <p className="text-sm text-gray-500">{letter.translation}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Back to Home Link */}
        {/* <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
          <Link
            href="/"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-sm sm:text-base"
          >
            ← Back to Home
          </Link>
        </div> */}
      </div>
    </div>
  );
}

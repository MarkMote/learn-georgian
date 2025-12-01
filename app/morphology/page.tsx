// app/morphology/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, BookOpen } from 'lucide-react';
import Papa from 'papaparse';

type MorphologyData = {
  markerType: string;
  marker: string;
  meaning: string;
  example1: string;
  example2: string;
};

function parseCSV(csvText: string): MorphologyData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any) => ({
    markerType: row["Marker Type"] || "",
    marker: row["Marker"] || "",
    meaning: row["Meaning"] || "",
    example1: row["Example 1"] || "",
    example2: row["Example 2"] || "",
  }));
}

// Parse example to separate Georgian and English parts (format: "გაღება • opening")
function parseExample(example: string) {
  const parts = example.split("•").map(s => s.trim());
  return {
    georgian: parts[0] || "",
    english: parts[1] || ""
  };
}

// Get color for marker type
function getMarkerTypeColor(type: string): string {
  switch (type) {
    case "Preverb": return "bg-blue-900/30 text-blue-300 border-blue-700";
    case "Verb Marker (Subject)": return "bg-green-900/30 text-green-300 border-green-700";
    case "Verb Marker (Object)": return "bg-emerald-900/30 text-emerald-300 border-emerald-700";
    case "Version Marker": return "bg-purple-900/30 text-purple-300 border-purple-700";
    case "Circumfix (Noun)": return "bg-orange-900/30 text-orange-300 border-orange-700";
    case "Circumfix (Adj)": return "bg-amber-900/30 text-amber-300 border-amber-700";
    case "Suffix (Noun)": return "bg-pink-900/30 text-pink-300 border-pink-700";
    case "Suffix (Adj)": return "bg-rose-900/30 text-rose-300 border-rose-700";
    case "Suffix (Adverb)": return "bg-red-900/30 text-red-300 border-red-700";
    case "Postposition": return "bg-cyan-900/30 text-cyan-300 border-cyan-700";
    default: return "bg-gray-900/30 text-gray-300 border-gray-700";
  }
}

// Group markers by type
function groupByType(markers: MorphologyData[]): Map<string, MorphologyData[]> {
  const grouped = new Map<string, MorphologyData[]>();
  markers.forEach(marker => {
    const existing = grouped.get(marker.markerType) || [];
    existing.push(marker);
    grouped.set(marker.markerType, existing);
  });
  return grouped;
}

export default function MorphologyPage() {
  const [markers, setMarkers] = useState<MorphologyData[]>([]);

  // Reset body scroll styles (in case deck page disabled them)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    fetch("/morphology.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setMarkers(parsed);
      })
      .catch((error) => {
        console.error("Error loading morphology:", error);
      });
  }, []);

  const groupedMarkers = groupByType(markers);

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
            <h1 className="text-lg sm:text-2xl font-light">Georgian Morphology</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 text-center">
            Georgian uses prefixes, suffixes, and circumfixes to modify word meanings. Learning these markers helps you understand and construct words.
          </p>
          <Link
            href="/morphology/deck"
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto px-6 py-3
            bg-indigo-900/50 border-indigo-700 border hover:bg-indigo-900/80 rounded-lg transition-colors text-indigo-100"
          >
            <BookOpen size={18} />
            <span>Practice Morphology</span>
          </Link>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {Array.from(groupedMarkers.entries()).map(([type, typeMarkers]) => (
            <div key={type}>
              <h2 className={`text-sm font-medium px-3 py-1.5 rounded-lg mb-3 border ${getMarkerTypeColor(type)}`}>
                {type}
              </h2>
              <div className="space-y-3">
                {typeMarkers.map((marker, index) => {
                  const ex1 = parseExample(marker.example1);
                  const ex2 = parseExample(marker.example2);
                  return (
                    <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-3xl px-2">{marker.marker}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base text-gray-200 mb-2">{marker.meaning}</p>
                          {marker.example1 && (
                            <div className="mt-2 pt-2 border-t border-gray-800 space-y-1">
                              <p className="text-sm">
                                <span className="text-gray-100">{ex1.georgian}</span>
                                <span className="text-gray-500 ml-2">{ex1.english}</span>
                              </p>
                              {marker.example2 && (
                                <p className="text-sm">
                                  <span className="text-gray-100">{ex2.georgian}</span>
                                  <span className="text-gray-500 ml-2">{ex2.english}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block space-y-8">
          {Array.from(groupedMarkers.entries()).map(([type, typeMarkers]) => (
            <div key={type}>
              <h2 className={`text-sm font-medium px-3 py-1.5 rounded-lg mb-3 inline-block border ${getMarkerTypeColor(type)}`}>
                {type}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300 w-32">Marker</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Meaning</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Example 1</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Example 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeMarkers.map((marker, index) => {
                      const ex1 = parseExample(marker.example1);
                      const ex2 = parseExample(marker.example2);
                      return (
                        <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                          <td className="py-4 px-4">
                            <span className="text-2xl">{marker.marker}</span>
                          </td>
                          <td className="py-4 px-4 text-gray-200">{marker.meaning}</td>
                          <td className="py-4 px-4">
                            {marker.example1 && (
                              <div>
                                <p className="text-base">{ex1.georgian}</p>
                                <p className="text-sm text-gray-500">{ex1.english}</p>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {marker.example2 && (
                              <div>
                                <p className="text-base">{ex2.georgian}</p>
                                <p className="text-sm text-gray-500">{ex2.english}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// app/alphabet/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Volume2 } from 'lucide-react';
import BackHeader from '../components/BackHeader';
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

type MinimalPair = {
  aspirated: string;
  aspiratedRoman: string;
  aspiratedMeaning: string;
  ejective: string;
  ejectiveRoman: string;
  ejectiveMeaning: string;
};

function MinimalPairRow({
  contrast,
  pairs
}: {
  contrast: string;
  aspiratedLetter: string;
  ejectiveLetter: string;
  pairs: MinimalPair[];
}) {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);

  const handlePlayWord = async (word: string) => {
    const currentPlaybackId = ++playbackIdRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingWord(word);
    try {
      const audio = new Audio(`/audio/similar-sounds/${word}/word.mp3`);
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Failed to play audio"));
        audio.play().catch(reject);
      });
    } catch (error) {
      if (playbackIdRef.current === currentPlaybackId) {
        console.error("Error playing audio:", error);
      }
    } finally {
      if (playbackIdRef.current === currentPlaybackId) {
        setPlayingWord(null);
      }
    }
  };

  return (
    <div className="border-b border-neutral-800 last:border-b-0 py-4 first:pt-0">
      <div className="text-center text-xl text-gray-300 mb-3 pt-4">{contrast}</div>
      <div className="space-y-2">
        {pairs.map((pair, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-3 text-center">
            <button
              onClick={() => handlePlayWord(pair.aspirated)}
              className="group py-2 hover:bg-neutral-800/50 rounded transition-colors"
            >
              <span className="flex items-center justify-center gap-1.5 md:text-3xl text-2xl text-gray-200">
                {pair.aspirated}
                <Volume2 size={22} className={`text-gray-600 ml-2 group-hover:text-gray-400 ${playingWord === pair.aspirated ? "text-gray-300 animate-pulse" : ""}`} />
              </span>
              <span className="text-base text-gray-500">{pair.aspiratedRoman} · {pair.aspiratedMeaning}</span>
            </button>
            <button
              onClick={() => handlePlayWord(pair.ejective)}
              className="group py-2 hover:bg-neutral-800/50 rounded transition-colors pt-5"
            >
              <span className="flex items-center justify-center gap-1.5 md:text-3xl text-2xl text-gray-200">
                {pair.ejective}
                <Volume2 size={22} className={`text-gray-600 ml-2 group-hover:text-gray-400 ${playingWord === pair.ejective ? "text-gray-300 animate-pulse" : ""}`} />
              </span>
              <span className="text-base text-gray-500">{pair.ejectiveRoman} · {pair.ejectiveMeaning}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlphabetPage() {
  const [letters, setLetters] = useState<AlphabetData[]>([]);
  const [playingLetter, setPlayingLetter] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);

  // Reset body scroll styles (in case deck page disabled them)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
  }, []);

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

  const handlePlayWord = async (georgianLetter: string) => {
    // Increment playback ID to cancel any in-progress playback
    const currentPlaybackId = ++playbackIdRef.current;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlayingLetter(georgianLetter);
    try {
      await playAudio(`/audio/alphabet/${georgianLetter}/word_v1.mp3`);

      // Check if this playback was cancelled
      if (playbackIdRef.current !== currentPlaybackId) return;

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check again before playing v2
      if (playbackIdRef.current !== currentPlaybackId) return;

      await playAudio(`/audio/alphabet/${georgianLetter}/word_v2.mp3`);
    } catch (error) {
      // Only log if this playback wasn't cancelled
      if (playbackIdRef.current === currentPlaybackId) {
        console.error("Error playing audio:", error);
      }
    } finally {
      // Only clear playing state if this playback wasn't superseded
      if (playbackIdRef.current === currentPlaybackId) {
        setPlayingLetter(null);
      }
    }
  };

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

  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BackHeader />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className={`text-3xl sm:text-4xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
          Georgian Alphabet
        </h1>

        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base md:text-base text-gray-300/90 mb-6 py-3 text-left font-light">
            The Georgian alphabet (Mkhedruli) has 33 letters. There is no capitalization. Georgian spelling is almost perfectly phonemic: each letter always represents the same sound and each letter of a word is always pronounced (so it&apos;s kind of like the opposite of French). There are no silent letters, diacritics, or digraphs, and even complex consonant clusters are written exactly as spoken. 
            <span className="font-bold text-gray-300"> This means that once you learn the alphabet, pronounciation becomes predictable.</span>
          </p>
          <Link
            href="/alphabet/deck"
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto px-6 py-3 
            bg-cyan-800/20 border-cyan-700 border hover:bg-cyan-900/40 rounded-lg transition-colors text-cyan-100"
          >
            <BookOpen size={18} />
            <span>Practice Georgian Alphabet</span>
          </Link>
        </div>

        {/* Legend */}
        <div className="mb-8 p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg ">
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
            <div key={index} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayWord(letter.georgianLetter)}
                          className="p-2 mr-2 rounded-lg bg-cyan-500/50 hover:bg-cyan-600 transition-colors touch-manipulation"
                          aria-label={`Play pronunciation of ${letter.georgianExample}`}
                        >
                          <Volume2 size={20} className={playingLetter === letter.georgianLetter ? "animate-pulse" : ""} />
                        </button>
                        <div>
                          <p className="text-sm">{letter.georgianExample}</p>
                          {letter.translation && (
                            <p className="text-xs text-gray-400">{letter.translation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 bg-neutral-300/5 rounded-xl overflow-hidden border-2 border-gray-500/20">
            <thead>
              <tr className="bg-neutral-200/5">
                <th className="text-center py-5 px-4 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80"></th>
                <th className="text-left py-5 px-6 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80">Letter</th>
                <th className="text-left py-5 px-4 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80">Transliteration</th>
                <th className="text-left py-5 px-4 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80">IPA</th>
                <th className="text-left py-5 px-4 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80">Explanation</th>
                <th className="text-left py-5 px-4 text-base font-semibold text-gray-300 border-b-2 border-gray-500/80">Example</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((letter, index) => {
                const isLastRow = index === letters.length - 1;
                const borderClass = isLastRow ? "" : "border-b border-gray-800";
                return (
                  <tr key={index}>
                    <td className={`py-4 px-4 text-center ${borderClass}`}>
                      {getEquivalentIcon(letter.englishEquivalent)}
                    </td>
                    <td className={`py-4 px-6 ${borderClass}`}>
                      <span className="text-5xl">{letter.georgianLetter}</span>
                    </td>
                    <td className={`py-4 px-4 text-lg ${borderClass}`}>{letter.englishLetter}</td>
                    <td className={`py-4 px-4 text-lg text-gray-200 ${borderClass}`}>{letter.ipaSymbol}</td>
                    <td className={`py-4 px-4 text-lg text-gray-200 max-w-md ${borderClass}`}>{letter.explanation}</td>
                    <td className={`py-4 px-4 ${borderClass}`}>
                      {letter.georgianExample && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePlayWord(letter.georgianLetter)}
                            className="p-2 mr-2 rounded-xl bg-cyan-600/50 hover:bg-cyan-600/80 transition-colors"
                            aria-label={`Play pronunciation of ${letter.georgianExample}`}
                          >
                            <Volume2 size={22} className={playingLetter === letter.georgianLetter ? "animate-pulse" : ""} />
                          </button>
                          <div>
                            <p className="text-base">{letter.georgianExample}</p>
                            {letter.translation && (
                              <p className="text-sm text-gray-500">{letter.translation}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Similar Sounds Section */}
        <div className="mt-16">
          <h2 className={`text-2xl sm:text-3xl font-light mb-3 text-slate-300 ${carvedTextStyle}`}>
            Similar Sounds
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 font-light">
            Georgian has consonant pairs that sound identical to English speakers but are distinct to Georgians:
            aspirated (puff of air) vs ejective (sharp, no air). Tap to compare.
          </p>

          <div className="grid grid-cols-2 gap-3 text-center text-lg text-gray-500 uppercase tracking-wide mb-2">
            <div>Aspirated</div>
            <div>Ejective</div>
          </div>

          <div className="bg-[#141414] border-2 border-neutral-200/10 rounded-lg px-4">
            <MinimalPairRow
              contrast="თ / ტ"
              aspiratedLetter="თ"
              ejectiveLetter="ტ"
              pairs={[
                { aspirated: "თივა", aspiratedRoman: "tiva", aspiratedMeaning: "hay", ejective: "ტივა", ejectiveRoman: "t'iva", ejectiveMeaning: "raft" },
                { aspirated: "თამაში", aspiratedRoman: "tamashi", aspiratedMeaning: "game", ejective: "ტამაში", ejectiveRoman: "t'amashi", ejectiveMeaning: "beat" },
              ]}
            />

            {/* ქ vs კ */}
            <MinimalPairRow
              contrast="ქ / კ"
              aspiratedLetter="ქ"
              ejectiveLetter="კ"
              pairs={[
                { aspirated: "ქარი", aspiratedRoman: "kari", aspiratedMeaning: "wind", ejective: "კარი", ejectiveRoman: "k'ari", ejectiveMeaning: "door" },
                { aspirated: "ქანა", aspiratedRoman: "kana", aspiratedMeaning: "swing", ejective: "კანა", ejectiveRoman: "k'ana", ejectiveMeaning: "hemp" },
              ]}
            />

            {/* ფ vs პ */}
            <MinimalPairRow
              contrast="ფ / პ"
              aspiratedLetter="ფ"
              ejectiveLetter="პ"
              pairs={[
                { aspirated: "ფარი", aspiratedRoman: "pari", aspiratedMeaning: "shield", ejective: "პარი", ejectiveRoman: "p'ari", ejectiveMeaning: "parry" },
                { aspirated: "ფერი", aspiratedRoman: "peri", aspiratedMeaning: "color", ejective: "პერი", ejectiveRoman: "p'eri", ejectiveMeaning: "fairy" },
              ]}
            />

            {/* ც vs წ */}
            <MinimalPairRow
              contrast="ც / წ"
              aspiratedLetter="ც"
              ejectiveLetter="წ"
              pairs={[
                { aspirated: "ცილა", aspiratedRoman: "tsila", aspiratedMeaning: "egg white", ejective: "წილა", ejectiveRoman: "ts'ila", ejectiveMeaning: "portion" },
                { aspirated: "ცელი", aspiratedRoman: "tseli", aspiratedMeaning: "scythe", ejective: "წელი", ejectiveRoman: "ts'eli", ejectiveMeaning: "year" },
              ]}
            />

            {/* ჩ vs ჭ */}
            <MinimalPairRow
              contrast="ჩ / ჭ"
              aspiratedLetter="ჩ"
              ejectiveLetter="ჭ"
              pairs={[
                { aspirated: "ჩაი", aspiratedRoman: "chai", aspiratedMeaning: "tea", ejective: "ჭაი", ejectiveRoman: "ch'ai", ejectiveMeaning: "well" },
                { aspirated: "ჩირი", aspiratedRoman: "chiri", aspiratedMeaning: "dried fruit", ejective: "ჭირი", ejectiveRoman: "ch'iri", ejectiveMeaning: "plague" },
              ]}
            />
          </div>
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

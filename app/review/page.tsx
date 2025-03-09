// src/app/review/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

/**
 * CSV row structure.
 * Columns: key, img_key, EnglishWord, PartOfSpeech, GeorgianWord, hint
 */
type WordData = {
  key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
};

/**
 * Known card state with SM-2 properties:
 *   rating: 0..3 → 0=fail,1=hard,2=good,3=easy
 *   lastSeen: how many picks ago we last displayed it
 *   interval, repetitions, easeFactor are used to schedule reviews
 */
interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

/**
 * Parse CSV text into an array of WordData objects.
 * It assumes that the first row is the header and is skipped.
 */
function parseCSV(csvText: string): WordData[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // Skip the header line
  const rows = lines.slice(1);

  return rows.map((row) => {
    const cols = row.split(",");
    return {
      key: cols[0],
      img_key: cols[1],
      EnglishWord: cols[2],
      PartOfSpeech: cols[3],
      GeorgianWord: cols[4],
      hint: cols[5],
    };
  });
}

/** Convert difficulty label to a numeric score (0..3). */
function difficultyToScore(difficulty: "easy" | "good" | "hard" | "fail"): number {
  switch (difficulty) {
    case "easy":
      return 3;
    case "good":
      return 2;
    case "hard":
      return 1;
    case "fail":
      return 0;
  }
}

/**
 * Returns a brief verb hint if PartOfSpeech includes "verb".
 * Example: If GeorgianWord is "მე ვმუშაობ", we might show "მე ვმუშაობ ____" on the front.
 */
function getVerbHint(word: WordData): string | null {
  if (!word.PartOfSpeech.toLowerCase().includes("verb")) {
    return null;
  }
  const firstWord = word.GeorgianWord.split(" ")[0];
  return `${firstWord} ____`;
}

/**
 * Extract the "base" of a verb key so that we can group its various conjugations.
 * E.g. "work_p1s" => "work", "play_p3p" => "play".
 * If there's no "_p" suffix, just return the whole key (some verbs might be stored that way).
 */
function getVerbBaseKey(word: WordData): string | null {
  if (!word.PartOfSpeech.toLowerCase().includes("verb")) {
    return null;
  }
  const underscoreIdx = word.key.indexOf("_p");
  if (underscoreIdx > -1) {
    return word.key.slice(0, underscoreIdx);
  }
  // If no suffix => treat the entire key as the "base"
  return word.key;
}

// Key for localStorage usage
const LOCAL_STORAGE_KEY = "reviewState";

export default function ReviewPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [knownWords, setKnownWords] = useState<KnownWordState[]>([]);

  // Index of the current flashcard
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flip states
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  // Count how many total cards have been shown
  const [cardCounter, setCardCounter] = useState(0);

  // Modal state for AI lessons
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessonMarkdown, setLessonMarkdown] = useState("");
  const [isLessonLoading, setIsLessonLoading] = useState(false);

  // Basic styling
  const containerClasses = "relative w-full min-h-screen bg-black text-white";
  const mainAreaClasses =
    "min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4";

  // ---------------------------
  //  Handle Keyboard shortcuts
  // ---------------------------
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // If user is typing in an input/textarea, ignore
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
          break;
        case "i":
          // Toggle English
          setShowEnglish((prev) => !prev);
          break;
        case "r": // easy
          if (isFlipped) handleScore("easy");
          break;
        case "e": // good
          if (isFlipped) handleScore("good");
          break;
        case "w": // hard
          if (isFlipped) handleScore("hard");
          break;
        case "q": // fail
          if (isFlipped) handleScore("fail");
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, currentIndex]);

  // ---------------------------
  //  Load CSV on mount
  // ---------------------------
  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => setAllWords(parseCSV(csv)));
  }, []);

  // ----------------------------------------------------
  //  Try restoring from local storage once CSV is loaded
  // ----------------------------------------------------
  useEffect(() => {
    if (allWords.length === 0) return; // not loaded yet

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          setKnownWords(parsed.knownWords);
          setCurrentIndex(parsed.currentIndex ?? 0);
          return; // do not introduce new if we have stored data
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
    }

    // If no stored data, introduce a first word
    if (knownWords.length === 0) {
      introduceRandomKnownWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords]);

  // ----------------------------------------------------
  //  Whenever knownWords/currentIndex changes, store them
  // ----------------------------------------------------
  useEffect(() => {
    if (knownWords.length > 0) {
      const toSave = {
        knownWords,
        currentIndex,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [knownWords, currentIndex]);

  // ----------------------------------------------------
  //  Introduce a new random word. If it is a verb,
  //  also introduce all other conjugations with the same base.
  // ----------------------------------------------------
  function introduceRandomKnownWord() {
    if (allWords.length === 0) return;

    // Filter out words that are already introduced
    const knownKeys = new Set(knownWords.map((k) => k.data.key));
    const candidates = allWords.filter((w) => !knownKeys.has(w.key));
    if (candidates.length === 0) return;

    // Separate verb and non-verb candidates
    const verbCandidates = candidates.filter(w => 
      w.PartOfSpeech.toLowerCase().includes("verb")
    );
    const nonVerbCandidates = candidates.filter(w => 
      !w.PartOfSpeech.toLowerCase().includes("verb")
    );

    // Handle empty categories
    if (verbCandidates.length === 0 && nonVerbCandidates.length === 0) return;
    
    // Decide whether to introduce a verb (1/6 chance) or non-verb (5/6 chance)
    let newWord: WordData;
    const useVerb = Math.random() < 1/7 && verbCandidates.length > 0;
    
    if (useVerb) {
      // For verbs, try to use priority verbs first
      const priorityVerbs = [
        "be_p1s", "have_inanimate_p1s", "want_p1s", "know_p1s", 
        "have_animate_p1s", "speak_p1s", "work_p1s", "live_p1s", 
        "understand_p1s", "like_p1s", "go_p1s"
      ];
      
      // Try to find a priority verb that isn't known yet
      let priorityVerb: WordData | undefined;
      for (const verbKey of priorityVerbs) {
        if (!knownKeys.has(verbKey)) {
          priorityVerb = verbCandidates.find(w => w.key === verbKey);
          if (priorityVerb) break;
        }
      }
      
      // Use a priority verb if found, otherwise pick a random verb
      newWord = priorityVerb || verbCandidates[Math.floor(Math.random() * verbCandidates.length)];
    } else if (nonVerbCandidates.length > 0) {
      // Pick a random non-verb
      newWord = nonVerbCandidates[Math.floor(Math.random() * nonVerbCandidates.length)];
    } else {
      // If no non-verbs, fall back to verbs
      newWord = verbCandidates[Math.floor(Math.random() * verbCandidates.length)];
    }

    let wordsToIntroduce: WordData[] = [newWord];

    // If it's a verb, gather all of its conjugations by the same base
    if (newWord.PartOfSpeech.toLowerCase().includes("verb")) {
      const baseKey = getVerbBaseKey(newWord);
      if (baseKey) {
        // Collect all "sibling" forms that share the same base
        const siblingForms = candidates.filter((w) => {
          if (!w.PartOfSpeech.toLowerCase().includes("verb")) return false;
          return getVerbBaseKey(w) === baseKey;
        });
        // Merge them, removing duplicates
        wordsToIntroduce = [...new Set([...wordsToIntroduce, ...siblingForms])];
      }
    }

    // Convert them to KnownWordState
    const newEntries: KnownWordState[] = wordsToIntroduce.map((w) => ({
      data: w,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    }));

    // Add to knownWords
    setKnownWords((prev) => [...prev, ...newEntries]);
  }

  // ----------------------------
  //  Handle rating (SM-2 logic)
  // ----------------------------
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    setKnownWords((prev) => {
      const updated = [...prev];
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      cardState.rating = score;

      const normalizedScore = score / 3;
      // Simple SM-2 approach
      if (score === 0) {
        cardState.repetitions = 0;
        cardState.interval = 1;
      } else {
        cardState.repetitions += 1;
        if (cardState.repetitions === 1) {
          cardState.interval = 1;
        } else if (cardState.repetitions === 2) {
          cardState.interval = 6;
        } else {
          cardState.interval = Math.round(
            cardState.interval * cardState.easeFactor
          );
        }
      }
      // Adjust ease factor
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      cardState.easeFactor = Math.max(1.3, cardState.easeFactor + easeChange);

      cardState.lastSeen = 0;
      return updated;
    });

    // Possibly introduce more cards if we have a high overall success
    if (computeOverallScore() > 0.8) {
      introduceRandomKnownWord();
    }

    pickNextCard();
  }

  /** Average rating/3 across known words. */
  function computeOverallScore(): number {
    if (knownWords.length === 0) return 0;
    const sum = knownWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
    return sum / knownWords.length;
  }

  /** Priority for SM-2 scheduling: overdue cards get higher priority. */
  function calculateCardPriority(card: KnownWordState): number {
    const normalizedRating = card.rating / 3;
    const overdueFactor = card.lastSeen / card.interval;
    const difficultyFactor = 1 + (1 - normalizedRating) * 2;

    if (overdueFactor >= 1) {
      return overdueFactor * difficultyFactor;
    }
    // Not overdue => a small fraction so that eventually it's surfaced
    return 0.1 * overdueFactor * difficultyFactor;
  }

  /** Pick the next card by the highest priority. */
  function pickNextCard() {
    setCardCounter((n) => n + 1);

    setKnownWords((prev) => {
      const updated = prev.map((kw, i) =>
        i === currentIndex ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

      let bestIdx = 0;
      let bestVal = -Infinity;
      updated.forEach((kw, i) => {
        const priority = calculateCardPriority(kw);
        if (priority > bestVal) {
          bestVal = priority;
          bestIdx = i;
        }
      });

      setCurrentIndex(bestIdx);
      return updated;
    });

    setIsFlipped(false);
    setShowEnglish(false);
  }

  // --------------
  //  "Get Lesson"
  // --------------
  async function handleGetLesson() {
    if (!knownWords[currentIndex]) return;
    try {
      setIsModalOpen(true);
      setIsLessonLoading(true);
      setLessonMarkdown("");

      const word = knownWords[currentIndex].data.EnglishWord;
      const res = await fetch(`/api/lesson?word=${encodeURIComponent(word)}`);
      if (!res.ok) {
        throw new Error("Failed to get lesson");
      }
      const data = await res.json();
      setLessonMarkdown(data.lesson || "No lesson found");
    } catch (error) {
      console.error(error);
      setLessonMarkdown("Error fetching lesson from the server.");
    } finally {
      setIsLessonLoading(false);
    }
  }

  // -----------------------------------
  //  Button to clear progress
  // -----------------------------------
  function handleClearProgress() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setKnownWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEnglish(false);
    setCardCounter(0);
    introduceRandomKnownWord();
  }

  // The current card or null if we don't have one
  const currentCard = knownWords[currentIndex];

  /**
   * Customized ReactMarkdown rendering:
   * - If you want to style code blocks, blockquotes, etc., you can expand further.
   */
  const markdownComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className="text-3xl font-bold mb-3 mt-6 text-slate-300 font-light border-b pb-4"
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-2xl text-slate-300 font-bold mb-2 mt-5" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className="text-xl text-slate-200 tracking-wide font-semibold mb-2 mt-4"
        {...props}
      />
    ),
    p: ({ node, ...props }: any) => (
      <p
        className="mb-3 leading-relaxed text-slate-300 text-lg tracking-wide font-light"
        {...props}
      />
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className="list-disc list-inside mb-3 ml-4 text-slate-200 tracking-wide text-lg font-light"
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal list-inside mb-3 ml-4 text-slate-200 font-light"
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li className="mb-1 text-slate-200" {...props} />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold" {...props} />
    ),
  };

  // Modal classes for dark theme
  const modalBgClass =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50";
  const modalContentClass =
    "bg-black/70 backdrop-blur-lg text-white p-6 rounded-xl w-[95%] max-w-3xl max-h-[90vh] overflow-auto relative border-2 border-gray-700";

  // Loading or no data state
  if (!currentCard) {
    return (
      <div className="p-8 text-center">
        <p>Loading or no cards available...</p>
      </div>
    );
  }

  // Get what to display from the current card
  const { EnglishWord, GeorgianWord } = currentCard.data;
  const verbHint = getVerbHint(currentCard.data);

  return (
    <div className={containerClasses}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleClearProgress}
          className="px-3 py-2 border border-gray-400 rounded text-sm"
        >
          Reset
        </button>

        <div className="text-sm">Score: {knownWords.length}</div>

        <button
          onClick={handleGetLesson}
          className="px-3 py-2 border border-gray-400 rounded text-sm"
        >
          Get Lesson
        </button>
      </div>

      {/* Main Content */}
      <div className={mainAreaClasses}>
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm">
        <div className="relative h-[320px] w-full mb-3">
          <Image
            src={`/img/${currentCard.data.img_key}.webp`}
            alt={EnglishWord}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-contain"
            onClick={() => setShowEnglish((prev) => !prev)}
          />
        </div>

          {showEnglish && (
            <p className="text-base font-semibold mb-3">
              {EnglishWord}
            </p>
          )}

          <p className="text-3xl tracking-wider mb-4">
            {!isFlipped ? verbHint ?? "" : GeorgianWord}
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      {!isFlipped ? (
        // Show FLIP button
        <div className="fixed bottom-0 left-0 w-full flex text-white bg-black">
          <button
            onClick={() => setIsFlipped(true)}
            className="flex-1 py-3 text-center border-t-4 border-gray-400 text-xl tracking-wide h-[70px]"
          >
            Flip
          </button>
        </div>
      ) : (
        // Show RATING buttons
        <div className="fixed bottom-0 left-0 w-full h-[70px] text-xl font-semibold tracking-wide flex text-white bg-black">
          <button
            onClick={() => handleScore("fail")}
            className="flex-1 py-3 text-center border-t-4 border-red-500/0 text-red-400 bg-red-800/0"
          />
          <button
            onClick={() => handleScore("fail")}
            className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-800/10"
          >
            Fail
          </button>
          <button
            onClick={() => handleScore("hard")}
            className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-700/10"
          >
            Hard
          </button>
          <button
            onClick={() => handleScore("good")}
            className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-700/10"
          >
            Good
          </button>
          <button
            onClick={() => handleScore("easy")}
            className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-700/10"
          >
            Easy
          </button>
        </div>
      )}

      {/* Lesson Modal */}
      {isModalOpen && (
        <div className={modalBgClass} onClick={() => setIsModalOpen(false)}>
          <div
            className={modalContentClass}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-4xl text-gray-400 hover:text-gray-100"
            >
              ✕
            </button>

            {/* Loading spinner or the lesson */}
            {isLessonLoading ? (
              <div className="flex items-center justify-center mt-6 mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="mt-6">
                <h1 className="text-3xl font-bold mb-3">{GeorgianWord}</h1>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {lessonMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
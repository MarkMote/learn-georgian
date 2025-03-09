// app/review/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
 */
interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

/** Parse CSV text into WordData objects. */
function parseCSV(csvText: string): WordData[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
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

/** If `PartOfSpeech` includes 'verb', return a pronoun-hint if key ends with _pXs. */
function getVerbHint(word: WordData): string | null {
  if (!word.PartOfSpeech.toLowerCase().includes("verb")) {
    return null;
  }
  const firstWord = word.GeorgianWord.split(" ")[0];
  return `${firstWord} ____`;
}

// -- ADD THIS KEY for local storage --
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

  // Always dark mode
  const containerClasses = "relative w-full min-h-screen bg-black text-white";
  const mainAreaClasses =
    "min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4";

  // Lesson Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessonMarkdown, setLessonMarkdown] = useState("");
  const [isLessonLoading, setIsLessonLoading] = useState(false);

  // ---------------------------
  //  Keyboard
  // ---------------------------
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
          break;
        case "i":
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
  //  Load CSV
  // ---------------------------
  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => setAllWords(parseCSV(csv)));
  }, []);

  // ----------------------------------------------------
  //  On CSV load, try restoring from local storage first
  // ----------------------------------------------------
  useEffect(() => {
    if (allWords.length === 0) return; // not loaded yet?

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          setKnownWords(parsed.knownWords);
          setCurrentIndex(parsed.currentIndex ?? 0);
          return; // do not introduce a new word if we have stored data
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
    }

    // If no stored data or parse error, introduce first word
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

  // ----------------------------
  //  Introduce a new random word
  // ----------------------------
  function introduceRandomKnownWord() {
    if (allWords.length === 0) return;
    const knownKeys = new Set(knownWords.map((k) => k.data.key));
    const candidates = allWords.filter((w) => !knownKeys.has(w.key));
    if (candidates.length === 0) return;

    const randIndex = Math.floor(Math.random() * candidates.length);
    const newWord = candidates[randIndex];

    setKnownWords((prev) => [
      ...prev,
      {
        data: newWord,
        rating: 0,
        lastSeen: 0,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
      },
    ]);
  }

  // ----------------------------
  //  Handle rating for SM-2
  // ----------------------------
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    setKnownWords((prev) => {
      const updated = [...prev];
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      cardState.rating = score;

      const normalizedScore = score / 3;
      // Simple SM-2 logic
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

    // Possibly introduce more cards if overall is high
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

  /** Priority for SM-2 scheduling. */
  function calculateCardPriority(card: KnownWordState): number {
    const normalizedRating = card.rating / 3;
    const overdueFactor = card.lastSeen / card.interval;
    const difficultyFactor = 1 + (1 - normalizedRating) * 2;

    if (overdueFactor >= 1) {
      return overdueFactor * difficultyFactor;
    }
    return 0.1 * overdueFactor * difficultyFactor;
  }

  /** Pick next card by highest priority, reset flip. */
  function pickNextCard() {
    setCardCounter((n) => n + 1);

    setKnownWords((prev) => {
      const updated = prev.map((kw, i) =>
        i !== currentIndex ? { ...kw, lastSeen: kw.lastSeen + 1 } : kw
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
  // Optional: Button to clear progress
  // -----------------------------------
  function handleClearProgress() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setKnownWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEnglish(false);
    setCardCounter(0);
    // Introduce one fresh card
    introduceRandomKnownWord();
  }

  const currentCard = knownWords[currentIndex];
  if (!currentCard) {
    return (
      <div className="p-8 text-center">
        <p>Loading or no cards available...</p>
      </div>
    );
  }

  const { EnglishWord, GeorgianWord } = currentCard.data;
  const verbHint = getVerbHint(currentCard.data);

  // Modal classes for dark theme
  const modalBgClass =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50";
  const modalContentClass =
    "bg-black/70 backdrop-blur-lg text-white p-6 rounded-xl w-[95%] max-w-3xl max-h-[90vh] overflow-auto relative border-2 border-gray-700";

  /**
   * Customized ReactMarkdown rendering:
   * - h1, h2, h3, p, ul, ol, li, strong, etc.
   * - You can expand this mapping as needed.
   */
  const markdownComponents = {
    h1: ({ node, ...props }: any) => (
      <h1
        className="text-3xl font-bold mb-3 mt-6 text-slate-300 font-light border-b pb-4"
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2
        className="text-2xl text-slate-300 font-bold mb-2 mt-5"
        {...props}
      />
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
      <li
        className="mb-1 text-slate-200"
        {...props}
      />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold" {...props} />
    ),
  };

  return (
    <div className={containerClasses}>
      {/* --- Top bar: Reset + Score + "Get Lesson" --- */}
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

      {/* --- Main area (image, hint or word) --- */}
      <div className={mainAreaClasses}>
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm">
          <img
            src={`/img/${currentCard.data.img_key}.jpg`}
            alt={EnglishWord}
            className="max-h-[320px] object-contain mb-3"
            onClick={() => setShowEnglish((prev) => !prev)}
          />

          {showEnglish && (
            <p className="text-base font-semibold mb-3">
              {EnglishWord}
            </p>
          )}

          <p className="text-3xl tracking-wider mb-4">
            {!isFlipped ? (verbHint ?? "") : GeorgianWord}
          </p>
        </div>
      </div>

      {/* --- Bottom bar: EXACT original rating/flip buttons --- */}
      {!isFlipped ? (
        // Flip button
        <div className="fixed bottom-0 left-0 w-full flex text-white bg-black">
          <button
            onClick={() => setIsFlipped(true)}
            className="flex-1 py-3 text-center border-t-4 border-gray-400 bg-none text-xl tracking-wide h-[70px]"
          >
            Flip
          </button>
        </div>
      ) : (
        // Rating buttons
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

      {/* --- LESSON MODAL --- */}
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

            {/* Loading spinner or the markdown */}
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

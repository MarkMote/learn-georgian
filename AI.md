
# Project Information
Generated on: 2025-03-09 10:46:14

About: This document contains the NextJS project structure and source code files.
It provides a snapshot of the project's implementation and structure at the time
of generation.

## Project Structure:
- This is a NextJS 14 project using the App Router
- Key directories processed:
  - app/api: Backend API routes
  - app/review: Frontend review interface components
- We use a service called "Wristband" for authentication, we should not need to modify authentication code. 



# Top Level Configuration Files

## tsconfig.json

Location: learn-georgian/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

## tailwind.config.ts

Location: learn-georgian/tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;

```

## next.config.mjs

File not found.

## package.json

Location: learn-georgian/package.json

```json
{
  "name": "learn-georgian",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.33.1",
    "@tailwindcss/typography": "^0.5.16",
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^10.0.1",
    "remark-gfm": "^4.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}

```

## .eslintrc.json

File not found.

## README.md

Location: learn-georgian/README.md

```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

## middleware.ts

File not found.


# Directory Structure

```
app
├── api
│   └── lesson
│       └── route.ts
├── review
│   └── page.tsx
├── review_v0
│   └── page.tsx
├── favicon.ico
├── globals.css
├── layout.tsx
└── page.tsx
```


# Directory: app

## page.tsx

Location: app/page.tsx

```typescript
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/review');
}

```

## layout.tsx

Location: app/layout.tsx

```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Georgian Language Learning",
  description: "Learn Georgian with interactive examples and practice",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-black bg-gray-50`}
      >
        {/* <Header /> */}
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
```

## route.ts

Location: lesson/route.ts

```typescript

import { NextRequest, NextResponse } from "next/server";

// (Optional) If using the openai npm package: npm install openai
// Here we demonstrate a direct fetch call for clarity.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  if (!word) {
    return NextResponse.json(
      { error: "No word provided." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const prompt = `Teach me about the Georgian word "${word}" by providing a short lesson. 
    First, provide a list of 5 short usage examples, with english translations. They should be in simple Georgian, 2-3 words long.
    Next give 1-2 examples of when someone might use the word, adding quotations around the georgian word being used.
    Then provide a short list of synoynms and related words, and their meanings.
    Then provide a short list of antonyms and related words, and their meanings.
    Then provide a short explanation of the word's meaning and usage, interesting etymology, notes on usage or grammar, etc.

    Avoid transliteration but feel free to include the English translation.
    
    Answer in **markdown** format, using headings, bullet points, etc. 
    Write it as if for a language learner.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful Georgian language tutor.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const lessonMarkdown = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({ lesson: lessonMarkdown });
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    return NextResponse.json(
      { error: "Failed to fetch lesson." },
      { status: 500 }
    );
  }
}

```

## page.tsx

Location: review/page.tsx

```typescript
// src/app/review/page.tsx

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

    // Pick one at random
    const randIndex = Math.floor(Math.random() * candidates.length);
    const newWord = candidates[randIndex];

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

  // If no currentCard, we’re either loading or have no data
  const currentCard = knownWords[currentIndex];
  if (!currentCard) {
    return (
      <div className="p-8 text-center">
        <p>Loading or no cards available...</p>
      </div>
    );
  }

  // Decide what to display
  const { EnglishWord, GeorgianWord } = currentCard.data;
  const verbHint = getVerbHint(currentCard.data);

  // Modal classes for dark theme
  const modalBgClass =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50";
  const modalContentClass =
    "bg-black/70 backdrop-blur-lg text-white p-6 rounded-xl w-[95%] max-w-3xl max-h-[90vh] overflow-auto relative border-2 border-gray-700";

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

```

## page.tsx

Location: review_v0/page.tsx

```typescript
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

```

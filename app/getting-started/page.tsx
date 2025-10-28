// app/getting-started/page.tsx
"use client";

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Go to Home"
            >
              <Home size={20} />
            </Link>
            <h1 className="text-2xl font-light">Getting Started</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300 mb-8">
            This is a spaced repetition app for learning the Georgian language. Progress is saved in the browser so there is no login or download required. It looks best on mobile, but works on desktop too.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">What You Will and Won't Learn</h2>
          <p className="text-gray-300 mb-4">
            <span className="font-semibold pr-1 text-slate-100">No app is going to teach you Georgian — this one included.</span>
            You'll need to practice speaking, reading, and listening to gain fluency.
            The problem is, those things are nearly impossible when you're just starting out.
          </p>
          <p className="text-gray-300 mb-4">
            The purpose of this app is to give you an extremely efficient way to get from 0 → 1:
            to build the intuitive foundation around grammar and a base of vocabulary that makes Georgian comprehensible.
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Your first ~2,000 words, with images and real example sentences</li>
            <li>Common grammar and morphology patterns that show how words change</li>
            <li>The ability to recognize structures and meaning without translation</li>
          </ul>
          <p className="text-gray-300 mb-4">
            Once you reach that point, real-world reading, listening, and speaking become learnable.
          </p>

          {/* <h2 className="text-2xl font-semibold text-white mt-12 mb-4">What You'll Learn</h2> */}
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Learn the alphabet and sounds before starting</li>
          </ul>
          <p>
            Georgian is a highly phonemic writing system, which means the words sound the way they are written. 
            It is very worthwhile to not rely on transliterations.
          </p>
            
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Limitations</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>There is no audio or speaking practice here — use YouTube and iTalki for that</li>
            {/* <li>The focus is on understanding, not pronunciation or conversation</li> */}
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Best Way to Use the App</h2>
          <p>
            Note: word sets have 50-100 words. You start out with just a few and progress to the next word after you have pressed <span className="font-semibold">Easy</span> on three consecutive cards.
          </p>

          <h3 className="text-xl font-medium text-white mt-8 mb-3">Phase 1 — Words</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Study the base set (~800 cards).</li>
            <li>Focus on associating the word with its image and example.</li>
            <li>Let grammar patterns emerge naturally through repetition.</li>
          </ul>

          <h3 className="text-xl font-medium text-white mt-8 mb-3">Phase 2 — Examples</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Review the same set in Examples Mode.</li>
            <li>This time, focus on the full sentences.</li>
            <li>Reinforces vocabulary, context, and introduces new grammar intuitively.</li>
          </ul>

          <h3 className="text-xl font-medium text-white mt-8 mb-3">Phase 3 — Chunks</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Study the Chunks Deck: the most common 2–4 word combinations from real Georgian text.</li>
            <li>Builds fluency by teaching how Georgians actually combine words in daily use.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Tips for Learning Better</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>Pair this with listening and speaking: Georgian YouTube, shows, podcasts, or iTalki lessons</li>
            <li>Pay attention to patterns and roots: large words are built from smaller, repeated pieces</li>
            <li>Don&apos;t worry about grammar too much, first notice the pattern then look up the reason.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">FAQ</h2>
          <p className="mb-4">
            <strong>Why did you build this?</strong>
            <br />
            I couldn&apos;t find a good app to learn Georgian, so I built one. Also I like to learn languages and it&apos;s fun to iterate on the best method for grokking one efficiently.
          </p>
          <p className="mb-4">
            <strong>Why spaced repetition?</strong>
            <br />
            Experimented with a few different methods. Spaced repetition works better than anything else, but had a problem around not getting enough context, so I added examples.   
          </p>
          <p className="mb-4">
            <strong>Why is the app so dark?</strong>
            <br />
            I use it at night, before going to sleep. 
          </p>
          <p className="mb-4">
            <strong>I see is on GitHub, can I copy your code?</strong>
            <br />
            If you like AI slop code, yes, go ahead! Do whatever you want with it. 
          </p>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

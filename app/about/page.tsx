"use client";

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useEffect } from 'react';

export default function AboutPage() {
  const containerClasses = "min-h-screen bg-black text-white p-6 overflow-y-auto";
  const contentClasses = "max-w-4xl mx-auto pb-12";
  
  // Ensure scrolling is enabled (in case review page disabled it)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
    
    return () => {
      // Don't restore anything on unmount
    };
  }, []);
  
  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header with Home Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light text-slate-300">About This App</h1>
          <Link 
            href="/"
            className="p-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">
          
          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">How It Works</h2>
            <div className="space-y-4">
              <p>
                <strong>Your progress is automatically saved in your browser.</strong> You can close the app anytime 
                and pick up right where you left off.
              </p>

              <p>
                This is a spaced repetition flashcard app designed specifically for learning Georgian vocabulary. 
                The app uses an adaptive learning algorithm to help you memorize words efficiently by showing 
                you cards at optimal intervals.
              </p>
              
              <p>
                Words are organized into <strong>chunks of 100</strong> based roughly on how likely you are to need them. 
                Each chunk focuses on a specific set of vocabulary, allowing you to progress systematically 
                through the Georgian language.
              </p>
            </div>
          </section>

          {/* Pre-requisites */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Prerequisites</h2>
            <div className="space-y-4">
              <p>
                You just need to learn the alphabet. Georgian is a highly phonemic writing system, 
                which means the words sound the way they are written. 
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Design Decisions</h2>
            <div className="space-y-4">
              In case its of interest, here are some design decisions that went into this app:
              <p>
                • Words are <strong>not</strong> broken up by category. Learning similar meaning words at around the same time makes it easier to  mix them up.
              </p>
              <p>
                • English translations are <strong>not</strong> shown by default. You can tap the image to see them. It is more natural to recall words without the help of translations.
              </p>
              <p>
                • Transliteration is not used. Getting familiar with the alphabet is more work up front, but pays off in the long run.
              </p>
            </div>
          </section>

          {/* Learning System */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Learning System</h2>
            <div className="space-y-4">
              <p>
                The app introduces new words gradually as you master existing ones. When you rate a word, 
                the system uses a spaced repetition algorithm based on <strong>SM-2</strong> to determine when 
                to show it again:
              </p>
              
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li><strong>Easy (E)</strong> - You know this word well</li>
                <li><strong>Good (R)</strong> - You remembered it correctly</li>  
                <li><strong>Hard (W)</strong> - You struggled but got it</li>
                <li><strong>Fail (Q)</strong> - You didn&apos;t know it</li>
              </ul>

              <p>
                Words you find easy will appear less frequently, while difficult words will be reviewed 
                more often until you master them.
              </p>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              
              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">🖼️ Visual Learning</h3>
                <p>Each word includes a visual image to help with memory association and comprehension.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">📚 AI Lessons</h3>
                <p>Get detailed explanations, usage examples, and cultural context for any word with AI-powered lessons.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">🎯 Smart Progression</h3>
                <p>Words are introduced in curriculum order, with verb conjugations grouped together logically.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">📊 Progress Tracking</h3>
                <p>Monitor your progress with percentage scores and track how many words you&apos;ve unlocked in each chunk.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">⌨️ Keyboard Shortcuts</h3>
                <p>Use spacebar to flip cards, and Q/W/E/R keys to rate your knowledge for faster reviews.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">💾 Automatic Saving</h3>
                <p>Your progress is automatically saved locally, so you can pick up where you left off anytime.</p>
              </div>
            </div>
          </section>

          {/* How to Use */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">How to Use</h2>
            <div className="space-y-4">
              <ol className="list-decimal list-outside ml-6 space-y-3">
                <li>
                  <strong>Choose a word set</strong> from the home page (Words 1-100, 101-200, etc.)
                </li>
                <li>
                  <strong>Study the image</strong> and try to recall the Georgian word
                </li>
                <li>
                  <strong>Press spacebar</strong> or tap to reveal the answer
                </li>
                <li>
                  <strong>Rate your knowledge</strong> using the buttons or keyboard shortcuts:
                  <ul className="list-disc list-outside ml-6 mt-2 space-y-1">
                    <li>Q = Fail (didn&apos;t know it)</li>
                    <li>W = Hard (struggled)</li>
                    <li>E = Good (remembered correctly)</li>
                    <li>R = Easy (knew it well)</li>
                  </ul>
                </li>
                <li>
                  <strong>Use &quot;Get Lesson&quot;</strong> for detailed explanations and examples
                </li>
                <li>
                  <strong>Continue practicing</strong> as the app introduces new words and reviews old ones
                </li>
              </ol>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Learning Tips</h2>
            <div className="space-y-4">
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li>Be honest with your ratings - this helps the algorithm work effectively</li>
                <li>Practice regularly, even if just for 5-10 minutes per day</li>
                <li>Use the &quot;I&quot; key to toggle English translations when needed</li>
                <li>Take advantage of AI lessons to understand context and usage</li>
                <li>Focus on one chunk at a time rather than jumping between different word sets</li>
              </ul>
            </div>
          </section>

          {/* Credits */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Contribute or Report Issues</h2>
            <div className="space-y-4">
              <p>
                The app is a work in progress and a bit of an experiment as I teach myself the language. 
                If you want the code, to collaborate, or to give feeback on a translation, you can contact me on one of the links at <a href="https://markmote.com" className="underline text-blue-300" target="_blank" rel="noopener noreferrer">markmote.com</a>. 
                {/* Everything is AI generated, so if you want to make this app for another language, contact me an I can  */}
                {/* I will add audio one eleven labs releases the next version or their api, which supports Georgian. */}
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="pt-8 border-t border-gray-700">
            <p className="text-center text-gray-400">
              Happy learning! 🇬🇪 იუნისებული მისწავლება!
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
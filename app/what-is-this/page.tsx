//  short about page for the project

import Link from "next/link";

export default function WhatIsThisPage() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center min-h-screen bg-black text-white p-10">
      <h1 className="text-2xl mb-2 border-b border-gray-800 pb-2 font-bold">About</h1>
      {/* add q and a section */}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Q: What is this?</h2>
          <p className="text-md text-gray-400">
            Its a spaced repetition app I built to help me learn Georgian, but you can use it too.
            The words + images page has a list of ~1k words to bootstrap vocabulary, based on a list made by <a href="https://tim.blog/2014/07/16/how-to-learn-any-language-in-record-time-and-never-forget-it/" className="text-blue-600">Tim Ferris</a>. 
            The phrases page tracks a google sheet. I update it every couple days based on the specific things I&apos;m trying to learn.
            <br />
            There are no transliterations, so you&apos;ll need to learn the alphabet and phonetic transcription first.
        </p>
      </div>


      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Q: How does it work?</h2>
        <p className="text-md text-gray-400">
          It&apos;s like anki but with AI. It uses a spaced repetition algorithm based on the SM-2 algorithm, and it uses gpt-4o to generate lessons when you click the &quot;Get Lesson&quot; button. 
          You can tap the images to get the translation. Your progress is saved on your browser, so it will be lost if you clear your cookies or use a different browser.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Q: Why?</h2>
        <p className="text-md text-gray-400">
          Spaced repetition works. 
        </p>
      </div>
      {/* <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Q: Why are some of the translations incorrect?</h2>
        <p className="text-md text-gray-400">
          LLMs. 
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Q: Why is the &quot;get lesson&quot; button no longer working?</h2>
        <p className="text-md text-gray-400">
          If this isn&apos;t working, I&apos;ve either stopped working on the app or I just need to refresh the openai credits. Try again in a few days. 
        </p>
      </div> */}

      {/*  return to home page */}
      <Link href="/" className="text-blue-500 py-2">
        Return to home page
      </Link>

      </div>
    </div>
  );
}
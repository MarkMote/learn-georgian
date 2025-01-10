
# Project Information
Generated on: 2025-01-07 12:32:22

About: This document contains the NextJS project structure and source code files.
It provides a snapshot of the project's implementation and structure at the time
of generation.

## Project Context
- The application is built by Roostr AI, a company specializing in AI-powered solutions for logistics.
- This project is a frontend application for an AI-powered rate management system for freight forwarders.
- The backend uses AI agents to talk with partner agents over emails to get rate information.
- The frontend provides a way to review, edit, approve, and reject the rate information received.
- It will also provide a way to configure the AI agents (digital workers) behavior. 

## Project Structure:
- This is a NextJS 14 project using the App Router
- Key directories processed:
  - app/api: Backend API routes
  - app/review: Frontend review interface components
- We use a service called "Wristband" for authentication, we should not need to modify authentication code. 

## Here are the environment variables we use:
- NEXT_PUBLIC_API_URL
- GOOGLE_CLIENT_EMAIL
- GOOGLE_PRIVATE_KEY
- SSOT_SHEET_ID
- NEXT_PUBLIC_SKIP_AUTH
- WRISTBAND_CLIENT_ID
- WRISTBAND_CLIENT_SECRET
- WRISTBAND_APP_DOMAIN
- NEXT_PUBLIC_APP_URL
- SESSION_SECRET
- WRISTBAND_LOGIN_SECRET
- METRIC_SHEET_ID
- MONGO_URI
- MONGO_DB

## Additional Notes:
- We're using typescript and tailwindcss in this project.
- At the top of each file, you will see a comment with the file name and location. It's important to make sure this comment is present in all files.
- User experience is important: use attractive and consistent styling. 
- If we are restructuring and no longer need a certain file, please call it out to be removed.
- It's best to keep files short, under 300 lines of code if possible. If a file is getting too long, consider breaking it up into smaller files.
- IMPORTANT: if you are making updates to an existing script to add a new feature, please make sure you are not breaking any existing functionality. Make only the minimal changes necessary to add the new feature.

## Meaning of the tabs in the /review page:
- Pending: These are the rates that need to be reviewed. They show the rates in the staging_rates.json. 
- Valid: These are the rates which have been accepted by the user, but have not expired yet. These rates come from accepted_rates.json.
- Expired: These are the rates which have been accepted by the user, but have expired. These rates come from accepted_rates.json.
- Rejected: These are the rates which have been rejected by the user. They are all the rates in the rejected_rates.json file.


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
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
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
│   └── generate-examples
│       └── route.ts
├── dynamic-examples
│   └── page.tsx
├── examples
│   └── page.tsx
├── review
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
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
```

## route.ts

Location: generate-examples/route.ts

```typescript
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: prompt
      }]
    })

    // Parse the response to extract the examples
    const content = message.content[0].text
    let examples
    try {
      // Try to parse the entire response as JSON first
      examples = JSON.parse(content)
    } catch {
      // If that fails, try to extract JSON objects from the text
      const jsonMatches = content.match(/\{[^}]+\}/g)
      if (jsonMatches) {
        examples = jsonMatches.map(match => JSON.parse(match))
      } else {
        throw new Error('Could not parse examples from response')
      }
    }

    return NextResponse.json({ examples })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate examples' },
      { status: 500 }
    )
  }
}
```

## page.tsx

Location: examples/page.tsx

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Phrase {
  georgian_phrase: string
  transliteration: string
  english_phrase: string
}

interface VisibilityState {
  transliteration: boolean
  meaning: boolean
}

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [visibleStates, setVisibleStates] = useState<{ [key: number]: VisibilityState }>({})

  useEffect(() => {
    fetch('/examples.json')
      .then(response => response.json())
      .then(data => setPhrases(data))
      .catch(error => console.error('Error loading phrases:', error))
  }, [])

  const toggleTransliteration = (index: number) => {
    setVisibleStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || { transliteration: false, meaning: false },
        transliteration: !(prev[index]?.transliteration ?? false)
      }
    }))
  }

  const toggleMeaning = (index: number) => {
    setVisibleStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || { transliteration: false, meaning: false },
        meaning: !(prev[index]?.meaning ?? false)
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Georgian Phrases
        </h1>
        
        <div className="space-y-4">
          {phrases.map((phrase, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="space-y-4">
                {/* Georgian Phrase - Always visible */}
                <div className="text-xl font-medium text-gray-900">
                  {phrase.georgian_phrase}
                </div>
                
                {/* Toggle Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleTransliteration(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md
                             text-sm font-medium text-gray-700 bg-white
                             hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-indigo-500
                             transition-colors"
                  >
                    {visibleStates[index]?.transliteration ? 'Hide Transliteration' : 'Show Transliteration'}
                  </button>
                  
                  <button 
                    onClick={() => toggleMeaning(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md
                             text-sm font-medium text-gray-700 bg-white
                             hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-indigo-500
                             transition-colors"
                  >
                    {visibleStates[index]?.meaning ? 'Hide Meaning' : 'Show Meaning'}
                  </button>
                </div>
                
                {/* Transliteration - Conditionally visible */}
                {visibleStates[index]?.transliteration && (
                  <div className="text-gray-600">
                    <span className="font-medium">Transliteration:</span>{' '}
                    {phrase.transliteration}
                  </div>
                )}
                
                {/* English Meaning - Conditionally visible */}
                {visibleStates[index]?.meaning && (
                  <div className="text-gray-800">
                    <span className="font-medium">English:</span>{' '}
                    {phrase.english_phrase}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## page.tsx

Location: review/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Example {
  georgian: string
  transliteration: string
  english: string
}

interface Synonym {
  georgian: string
  transliteration: string
  description: string
}

interface Word {
  georgian: string
  english: string
  transliteration: string
  word_type: string
  category: string
  definition_georgian: string
  description_english: string
  synonyms: Synonym[]
  antonyms: Synonym[]
  examples: Example[]
}

interface ConjugationForm {
  georgian: string
  transliteration: string
  english: string
}

interface PresentTense {
  first_person_singular: ConjugationForm
  second_person_singular: ConjugationForm
  third_person_singular: ConjugationForm
  first_person_plural: ConjugationForm
  second_person_plural: ConjugationForm
  third_person_plural: ConjugationForm
}

interface Verb {
  english: string
  georgian: string
  transliteration: string
  word_type: string
  category: string
  definition_georgian: string
  description_english: string
  examples: Example[]
  conjugation_examples: {
    present_tense: PresentTense
  }
}

interface Phrase {
  english: string
  georgian: string
  transliteration: string
  description_english: string
  examples: Example[]
}

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'words' | 'verbs' | 'phrases'>('words')
  const [words, setWords] = useState<Word[]>([])
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [showTransliterations, setShowTransliterations] = useState<{ [key: string]: boolean }>({})
  const [showMeanings, setShowMeanings] = useState<{ [key: string]: boolean }>({})
  const [imageExists, setImageExists] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    Promise.all([
      fetch('/data/words.json').then(res => res.json()),
      fetch('/data/verbs.json').then(res => res.json()),
      fetch('/data/phrases.json').then(res => res.json())
    ]).then(([wordsData, verbsData, phrasesData]) => {
      // Reverse the arrays before setting state
      const reversedWords = [...wordsData].reverse()
      const reversedVerbs = [...verbsData].reverse()
      const reversedPhrases = [...phrasesData].reverse()

      setWords(reversedWords)
      setVerbs(reversedVerbs)
      setPhrases(reversedPhrases)

      // Check for image existence for all items
      const allItems = [...reversedWords, ...reversedVerbs, ...reversedPhrases]
      allItems.forEach(item => {
        fetch(`/img/${item.georgian}.png`)
          .then(response => {
            setImageExists(prev => ({
              ...prev,
              [item.georgian]: response.ok
            }))
          })
          .catch(() => {
            setImageExists(prev => ({
              ...prev,
              [item.georgian]: false
            }))
          })
      })
    })
  }, [])

  const createUniqueKey = (base: string, index: number) => `${base}-${index}`

  const toggleTransliteration = (id: string) => {
    setShowTransliterations(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const toggleMeaning = (id: string) => {
    setShowMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const TabButton = ({ tab, label }: { tab: 'words' | 'verbs' | 'phrases', label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-medium rounded-lg transition-colors
                ${activeTab === tab 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  )

  const renderWordCard = (word: Word, index: number) => (
    <div key={createUniqueKey(word.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-32 h-32 relative flex-shrink-0">
          {imageExists[word.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(word.georgian)}.png`}
              alt={word.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{word.georgian}</div>
          <div className="text-sm text-gray-600">{word.category}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(word.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(word.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(word.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(word.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(word.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {word.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(word.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {word.english}
          </div>
          <div>
            <span className="font-medium">Category:</span> {word.category}
          </div>
          <div>
            <span className="font-medium">Definition (Georgian):</span> {word.definition_georgian}
          </div>
          <div>
            <span className="font-medium">Description:</span> {word.description_english}
          </div>
          {word.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {word.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(word.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderVerbCard = (verb: Verb, index: number) => (
    <div key={createUniqueKey(verb.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-20 h-20 relative flex-shrink-0">
          {imageExists[verb.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(verb.georgian)}.png`}
              alt={verb.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{verb.georgian}</div>
          <div className="text-sm text-gray-600">{verb.category}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(verb.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(verb.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(verb.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(verb.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(verb.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {verb.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(verb.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {verb.english}
          </div>
          <div>
            <span className="font-medium">Category:</span> {verb.category}
          </div>
          <div>
            <span className="font-medium">Description:</span> {verb.description_english}
          </div>
          {verb.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {verb.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(verb.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
          <div>
            <span className="font-medium">Conjugation (Present Tense):</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {Object.entries(verb.conjugation_examples.present_tense).map(([person, form], conjugationIndex) => (
                <div key={`${createUniqueKey(verb.georgian, index)}-conjugation-${conjugationIndex}`} className="border rounded p-2">
                  <div className="font-medium">{form.english}</div>
                  <div>{form.georgian}</div>
                  <div className="text-gray-600 text-sm">{form.transliteration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPhraseCard = (phrase: Phrase, index: number) => (
    <div key={createUniqueKey(phrase.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-20 h-20 relative flex-shrink-0">
          {imageExists[phrase.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(phrase.georgian)}.png`}
              alt={phrase.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{phrase.georgian}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(phrase.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(phrase.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(phrase.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(phrase.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(phrase.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {phrase.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(phrase.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {phrase.english}
          </div>
          <div>
            <span className="font-medium">Description:</span> {phrase.description_english}
          </div>
          {phrase.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {phrase.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(phrase.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-black px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Learn Georgian
        </h1>

        <div className="flex gap-4 mb-8 justify-center">
          <TabButton tab="words" label="Words" />
          <TabButton tab="verbs" label="Verbs" />
          <TabButton tab="phrases" label="Phrases" />
        </div>

        <div className="space-y-4">
          {activeTab === 'words' && words.map((word, index) => renderWordCard(word, index))}
          {activeTab === 'verbs' && verbs.map((verb, index) => renderVerbCard(verb, index))}
          {activeTab === 'phrases' && phrases.map((phrase, index) => renderPhraseCard(phrase, index))}
        </div>
      </div>
    </div>
  )
}
```

## page.tsx

Location: dynamic-examples/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'

interface VocabItem {
  type: string
  english: string
  georgian: string
  created: string
  ease: number
  last_seen_index: number
}

interface GeneratedExample {
  georgian: string
  english: string
  transliteration: string
}

export default function DynamicExamplesPage() {
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [examples, setExamples] = useState<GeneratedExample[]>([])
  const [loading, setLoading] = useState(false)
  const [showTransliterations, setShowTransliterations] = useState<{ [key: number]: boolean }>({})
  const [showMeanings, setShowMeanings] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    fetch('/data/vocab.json')
      .then(res => res.json())
      .then(data => setVocab(data))
      .catch(error => console.error('Error loading vocabulary:', error))
  }, [])

  const toggleTransliteration = (index: number) => {
    setShowTransliterations(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleMeaning = (index: number) => {
    setShowMeanings(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleWordSelect = (georgian: string) => {
    setSelectedWords(prev => 
      prev.includes(georgian)
        ? prev.filter(word => word !== georgian)
        : [...prev, georgian]
    )
  }

  const selectAllWords = () => {
    setSelectedWords(vocab.map(item => item.georgian))
  }

  const clearSelection = () => {
    setSelectedWords([])
  }

  const generateExamples = async () => {
    setLoading(true)
    
    // Create the prompt for the API
    const selectedVocab = vocab.filter(item => selectedWords.includes(item.georgian))
    const prompt = `Create 5 example sentences in Georgian that use these words: ${selectedVocab.map(item => 
      `${item.georgian} (${item.english})`).join(', ')}. 

      Use simple language and common vocabulary. Keep the sentences short and clear.
      
      For each sentence, provide:
      1. The Georgian sentence
      2. English translation
      3. Latin transliteration
      
      Format each example as a JSON object with these properties:
      {
        "georgian": "Georgian sentence",
        "english": "English translation",
        "transliteration": "Latin transliteration"
      }`

    try {
      const response = await fetch('/api/generate-examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error('Failed to generate examples')
      }

      const data = await response.json()
      setExamples(data.examples)
    } catch (error) {
      console.error('Error generating examples:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Generate Practice Examples
        </h1>

        {/* Word Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-medium">Select Words to Practice</h2>
            <div className="space-x-4">
              <button
                onClick={selectAllWords}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vocab.map((item) => (
              <button
                key={`${item.georgian}-${item.english}`}
                onClick={() => handleWordSelect(item.georgian)}
                className={`p-2 rounded border text-left
                          ${selectedWords.includes(item.georgian)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'}`}
              >
                <div className="font-medium">{item.georgian}</div>
                <div className="text-sm text-gray-600">{item.english}</div>
              </button>
            ))}
          </div>

          <button
            onClick={generateExamples}
            disabled={selectedWords.length === 0 || loading}
            className={`mt-6 w-full py-3 rounded-md font-medium text-white
                      ${selectedWords.length === 0 || loading
                        ? 'bg-gray-400'
                        : 'bg-green-500 hover:bg-green-600'}`}
          >
            {loading ? 'Generating...' : 'Generate Examples'}
          </button>
        </div>

        {/* Generated Examples */}
        {examples.length > 0 && (
          <div className="space-y-4">
            {examples.map((example, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="text-xl font-medium text-gray-900">
                  {example.georgian}
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleTransliteration(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                             text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {showTransliterations[index] ? 'Hide Transliteration' : 'Show Transliteration'}
                  </button>
                  <button
                    onClick={() => toggleMeaning(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                             text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {showMeanings[index] ? 'Hide Meaning' : 'Show Meaning'}
                  </button>
                </div>

                {showTransliterations[index] && (
                  <div className="text-gray-600">
                    <span className="font-medium">Transliteration:</span>{' '}
                    {example.transliteration}
                  </div>
                )}

                {showMeanings[index] && (
                  <div className="text-gray-800">
                    <span className="font-medium">English:</span>{' '}
                    {example.english}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

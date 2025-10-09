# Learn Georgian

An interactive Georgian language learning application built with Next.js. This app uses spaced repetition flashcards with examples and lessons to help users learn Georgian vocabulary and grammar.

Flashcards are stored in `public/words.csv`. You can easily convert this app to the language of your choice by modifying the columns of this file.

## Features

- **Spaced Repetition Learning**: Smart flashcard system using the SM-2 algorithm
- **Visual Flashcards**: Image-based vocabulary learning
- **AI-Powered Lessons**: Get detailed explanations for words using OpenAI
- **Verb Conjugation Groups**: Automatically introduces related verb forms together
- **Progress Tracking**: Local storage saves your learning progress
- **Mobile Optimized**: Touch-friendly interface for learning on the go

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables: 
```bash
cp .env.example .env.local
```
Fill in your API keys in `.env.local`:
- `OPENAI_API_KEY`: For AI-generated lessons
- `ELEVENLABS_API_KEY`: For audio pronunciation (optional)
- Google Sheets credentials for vocabulary data (optional)

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start learning!

Note: most api keys are optional. e.g. we ElevenLabs is only used for a prototype feature. We're waiting for their text-to-speech to get better at pronouncing Georgian.


## Usage

- **Space bar**: Flip cards to reveal answers
- **Q/W/E/R keys**: Rate difficulty (Fail/Hard/Good/Easy)  
- **I key**: Toggle English translation
- **Get Lesson button**: Generate AI explanations for vocabulary

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API, Anthropic Claude
- **Data**: Google Sheets API, CSV processing
- **Audio**: ElevenLabs TTS API

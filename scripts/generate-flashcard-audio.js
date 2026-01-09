// scripts/generate-flashcard-audio.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: '.env.local' });

// HARDCODED WORD KEY - CHANGE THIS TO GENERATE DIFFERENT WORDS
const WORD_KEY = 'hello';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs from environment
const VOICE_1 = process.env.ELEVENLABS_VOICE_ID_1;  // Male voice
const VOICE_2 = process.env.ELEVENLABS_VOICE_ID_2;  // Female voice

async function generateAudio(text, outputPath, voiceId, voiceSettings) {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_v3',
      voice_settings: voiceSettings,
      output_format: 'mp3_44100_128'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`11labs API error: ${response.status} - ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
  console.log('✅ Generated:', path.basename(outputPath));
}

async function main() {
  // Read words.csv to find the word
  const csvPath = path.join(__dirname, '..', 'public', 'words.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const words = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  });

  // Find the word by key
  const word = words.find(w => w.key === WORD_KEY);
  if (!word) {
    throw new Error(`Word with key "${WORD_KEY}" not found in words.csv`);
  }

  console.log(`Generating audio for: ${word.EnglishWord} (${word.GeorgianWord})`);

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'public', 'audio', 'flashcards', WORD_KEY);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Voice settings for eleven_v3 (stability must be 0.0, 0.5, or 1.0)
  const naturalSettings = {
    stability: 1,           // Natural speaking style (0.5 = Natural, required value for v3)
    similarity_boost: 0.6,    // Moderate voice similarity
    style: 0.7,               // Subtle style for natural speech
    use_speaker_boost: false, // Off for natural speech
    speed: 0.9                // Slightly slower for easier listening (0.7-1.2, default 1.0)
  };

  const emphasisSettings = {
    stability: 1.0,             // Robust/clear pronunciation (1.0 = Robust, required value for v3)
    similarity_boost: 1,        // Maximum voice similarity
    style: 1,                   // More emphasis for teaching
    use_speaker_boost: true,    // Boost clarity for learning
    speed: 0.7                  // Slower for clear pronunciation
  };

  // Generate 4 files
  // V1 = Female + Emphasis, V2 = Male + Natural
  await generateAudio(word.GeorgianWord, path.join(outputDir, 'word_v2.mp3'), VOICE_2, emphasisSettings);
  await new Promise(resolve => setTimeout(resolve, 300));

  await generateAudio(word.GeorgianWord, path.join(outputDir, 'word_v1.mp3'), VOICE_1, naturalSettings);
  await new Promise(resolve => setTimeout(resolve, 300));

  if (word.ExampleGeorgian1) {
    await generateAudio(word.ExampleGeorgian1, path.join(outputDir, 'sentence_v2.mp3'), VOICE_2, emphasisSettings);
    await new Promise(resolve => setTimeout(resolve, 300));

    await generateAudio(word.ExampleGeorgian1, path.join(outputDir, 'sentence_v1.mp3'), VOICE_1, naturalSettings);
  }

  console.log(`\n✨ Done! Files created in: ${outputDir}`);
}

main().catch(console.error);

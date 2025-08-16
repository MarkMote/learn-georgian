      const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: '.env.local' });

// HARDCODED WORD KEY - CHANGE THIS TO GENERATE DIFFERENT WORDS
const WORD_KEY = 'happy';

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
      model_id: 'eleven_turbo_v2',
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
  const words = parse(csvContent, { columns: true, skip_empty_lines: true });

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

  // Voice settings
  const naturalSettings = {
    stability: 0.4,           // 0-1: Lower = more expressive/variable, Higher = monotone/consistent
    similarity_boost: 0.6,    // 0-1: Higher = closer to original voice, Lower = more creative interpretation
    style: 0.2,               // 0-1: Speaking style exaggeration (subtle for natural speech)
    use_speaker_boost: false  // Enhances clarity but can sound artificial - off for natural speech
  };
  
  const emphasisSettings = {
    stability: 1,          // Higher stability for clear, consistent pronunciation
    similarity_boost: 1,    // Very close to original voice for maximum clarity
    style: 1,               // More style/emphasis for teaching pronunciation
    use_speaker_boost: true   // Boost clarity and reduce artifacts for learning
  };

  // Generate 4 files
  await generateAudio(word.GeorgianWord, path.join(outputDir, 'word_v1.mp3'), VOICE_2, naturalSettings);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  await generateAudio(word.GeorgianWord, path.join(outputDir, 'word_v2.mp3'), VOICE_1, emphasisSettings);
  await new Promise(resolve => setTimeout(resolve, 300));

  if (word.ExampleGeorgian1) {
    await generateAudio(word.ExampleGeorgian1, path.join(outputDir, 'sentence_v1.mp3'), VOICE_2, naturalSettings);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await generateAudio(word.ExampleGeorgian1, path.join(outputDir, 'sentence_v2.mp3'), VOICE_1, emphasisSettings);
  }

  console.log(`\n✨ Done! Files created in: ${outputDir}`);
}

main().catch(console.error);
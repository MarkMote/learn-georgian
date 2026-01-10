// app/api/admin/generate-audio/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const VOICE_1 = process.env.ELEVENLABS_VOICE_ID_1; // Male voice
const VOICE_2 = process.env.ELEVENLABS_VOICE_ID_2; // Female voice

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
}

async function generateAudioFile(
  text: string,
  voiceId: string,
  voiceSettings: VoiceSettings
): Promise<Buffer> {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_v3',
      voice_settings: voiceSettings,
      output_format: 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const {
      word,
      georgianWord,
      exampleGeorgian,
      key,
    } = await request.json();

    if (!georgianWord || !key) {
      return NextResponse.json(
        { error: 'Georgian word and key are required' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY || !VOICE_1 || !VOICE_2) {
      return NextResponse.json(
        { error: 'ElevenLabs API credentials not configured' },
        { status: 500 }
      );
    }

    // Voice settings (hardcoded defaults from script)
    const naturalSettings: VoiceSettings = {
      stability: 0.5,           // Natural speaking style (0.5 = Natural, required value for v3)
      similarity_boost: 0.6,
      style: 0.6,
      use_speaker_boost: false,
      speed: 0.9,
    };

    const emphasisSettings: VoiceSettings = {
      stability: 1.0,           // Robust/clear pronunciation (1.0 = Robust, required value for v3)
      similarity_boost: 1,
      style: 1,
      use_speaker_boost: true,
      speed: 0.8,
    };

    // Create output directory using unique key (not img_key) for verbs with multiple forms
    const outputDir = path.join(process.cwd(), 'public', 'audio', 'flashcards', key);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate 4 files with small delays
    // V1 = Female + Emphasis, V2 = Male + Natural
    const wordV1 = await generateAudioFile(georgianWord, VOICE_2, emphasisSettings);
    fs.writeFileSync(path.join(outputDir, 'word_v1.mp3'), wordV1);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const wordV2 = await generateAudioFile(georgianWord, VOICE_1, naturalSettings);
    fs.writeFileSync(path.join(outputDir, 'word_v2.mp3'), wordV2);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (exampleGeorgian) {
      const sentenceV1 = await generateAudioFile(exampleGeorgian, VOICE_2, emphasisSettings);
      fs.writeFileSync(path.join(outputDir, 'sentence_v1.mp3'), sentenceV1);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const sentenceV2 = await generateAudioFile(exampleGeorgian, VOICE_1, naturalSettings);
      fs.writeFileSync(path.join(outputDir, 'sentence_v2.mp3'), sentenceV2);
    }

    return NextResponse.json({
      success: true,
      message: 'Audio files generated successfully',
      files: exampleGeorgian
        ? ['word_v1.mp3', 'word_v2.mp3', 'sentence_v1.mp3', 'sentence_v2.mp3']
        : ['word_v1.mp3', 'word_v2.mp3'],
    });
  } catch (error: any) {
    console.error('[Audio Gen] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Audio generation failed' },
      { status: 500 }
    );
  }
}

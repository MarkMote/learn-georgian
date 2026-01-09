// app/api/admin/generate-alphabet-audio/route.ts

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
  console.log('[Alphabet Audio] Generating for text:', JSON.stringify(text), 'Voice:', voiceId, 'Settings:', voiceSettings);

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
      georgianLetter,
      georgianExample,
      englishLetter,
    } = await request.json();

    console.log('[Alphabet Audio] Request:', { georgianLetter, georgianExample, englishLetter });

    if (!georgianLetter || !englishLetter) {
      return NextResponse.json(
        { error: 'Georgian letter and English letter are required' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY || !VOICE_1 || !VOICE_2) {
      return NextResponse.json(
        { error: 'ElevenLabs API credentials not configured' },
        { status: 500 }
      );
    }

    // Voice settings (hardcoded defaults)
    const naturalSettings: VoiceSettings = {
      stability: 1,           // Natural speaking style
      similarity_boost: 1,
      style: 1,
      use_speaker_boost: true,
      speed: 0.9,
    };

    const emphasisSettings: VoiceSettings = {
      stability: 1.0,           // Robust/clear pronunciation
      similarity_boost: 1,
      style: 1,
      use_speaker_boost: true,
      speed: 0.7,
    };

    // Create output directory using Georgian letter for folder name
    const outputDir = path.join(process.cwd(), 'public', 'audio', 'alphabet', georgianLetter);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate only word audio (single letters cause API errors)
    // V1 = Female + Emphasis, V2 = Male + Natural
    if (!georgianExample) {
      return NextResponse.json(
        { error: 'Georgian example is required (single letters not supported by API)' },
        { status: 400 }
      );
    }

    const wordV1 = await generateAudioFile(georgianExample, VOICE_2, emphasisSettings);
    fs.writeFileSync(path.join(outputDir, 'word_v1.mp3'), wordV1);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const wordV2 = await generateAudioFile(georgianExample, VOICE_1, naturalSettings);
    fs.writeFileSync(path.join(outputDir, 'word_v2.mp3'), wordV2);

    return NextResponse.json({
      success: true,
      message: 'Alphabet audio files generated successfully',
      files: ['word_v1.mp3', 'word_v2.mp3'],
    });
  } catch (error: any) {
    console.error('[Alphabet Audio Gen] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Alphabet audio generation failed' },
      { status: 500 }
    );
  }
}

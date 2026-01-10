// app/api/admin/generate-similar-sounds-audio/single/route.ts

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
    const { word, voice } = await request.json();

    if (!word || !voice) {
      return NextResponse.json(
        { error: 'Word and voice are required' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY || !VOICE_1 || !VOICE_2) {
      return NextResponse.json(
        { error: 'ElevenLabs API credentials not configured' },
        { status: 500 }
      );
    }

    const voiceSettings: VoiceSettings = {
      stability: 1.0,
      similarity_boost: 1,
      style: 0.5,
      use_speaker_boost: true,
      speed: 0.8,
    };

    // v1 = female (VOICE_2), v2 = male (VOICE_1)
    const voiceId = voice === "v1" ? VOICE_2 : VOICE_1;

    const outputDir = path.join(process.cwd(), 'public', 'audio', 'similar-sounds', word);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`[Similar Sounds Single] Regenerating: ${word} with ${voice}`);

    const audioBuffer = await generateAudioFile(word, voiceId!, voiceSettings);
    fs.writeFileSync(path.join(outputDir, 'word.mp3'), audioBuffer);

    return NextResponse.json({
      success: true,
      message: `Regenerated ${word}`,
    });
  } catch (error: any) {
    console.error('[Similar Sounds Single] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Audio generation failed' },
      { status: 500 }
    );
  }
}

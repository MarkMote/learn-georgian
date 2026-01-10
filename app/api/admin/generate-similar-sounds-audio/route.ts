// app/api/admin/generate-similar-sounds-audio/route.ts

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

// Minimal pairs data - first pair uses v1, second pair uses v2
const MINIMAL_PAIRS = [
  {
    contrast: "თ_vs_ტ",
    pairs: [
      { aspirated: "თივა", ejective: "ტივა", voice: "v1" },
      { aspirated: "თამაში", ejective: "ტამაში", voice: "v2" },
    ]
  },
  {
    contrast: "ქ_vs_კ",
    pairs: [
      { aspirated: "ქარი", ejective: "კარი", voice: "v1" },
      { aspirated: "ქანა", ejective: "კანა", voice: "v2" },
    ]
  },
  {
    contrast: "ფ_vs_პ",
    pairs: [
      { aspirated: "ფარი", ejective: "პარი", voice: "v1" },
      { aspirated: "ფერი", ejective: "პერი", voice: "v2" },
    ]
  },
  {
    contrast: "ც_vs_წ",
    pairs: [
      { aspirated: "ცილა", ejective: "წილა", voice: "v1" },
      { aspirated: "ცელი", ejective: "წელი", voice: "v2" },
    ]
  },
  {
    contrast: "ჩ_vs_ჭ",
    pairs: [
      { aspirated: "ჩაი", ejective: "ჭაი", voice: "v1" },
      { aspirated: "ჩირი", ejective: "ჭირი", voice: "v2" },
    ]
  },
];

async function generateAudioFile(
  text: string,
  voiceId: string,
  voiceSettings: VoiceSettings
): Promise<Buffer> {
  console.log('[Similar Sounds Audio] Generating for text:', text, 'Voice:', voiceId);

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
    if (!ELEVENLABS_API_KEY || !VOICE_1 || !VOICE_2) {
      return NextResponse.json(
        { error: 'ElevenLabs API credentials not configured' },
        { status: 500 }
      );
    }

    // Voice settings
    const voiceSettings: VoiceSettings = {
      stability: 1.0,
      similarity_boost: 1,
      style: 0.5,
      use_speaker_boost: true,
      speed: 0.8,
    };

    const baseDir = path.join(process.cwd(), 'public', 'audio', 'similar-sounds');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const generated: string[] = [];
    const errors: Array<{ word: string; error: string }> = [];

    for (const contrast of MINIMAL_PAIRS) {
      for (const pair of contrast.pairs) {
        const voiceId = pair.voice === "v1" ? VOICE_2 : VOICE_1; // v1 = female, v2 = male (matching alphabet convention)

        // Generate aspirated word
        try {
          const aspiratedDir = path.join(baseDir, pair.aspirated);
          if (!fs.existsSync(aspiratedDir)) {
            fs.mkdirSync(aspiratedDir, { recursive: true });
          }

          const aspiratedAudio = await generateAudioFile(pair.aspirated, voiceId, voiceSettings);
          fs.writeFileSync(path.join(aspiratedDir, 'word.mp3'), aspiratedAudio);
          generated.push(pair.aspirated);
          console.log(`[Similar Sounds] Generated: ${pair.aspirated}`);

          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error: any) {
          errors.push({ word: pair.aspirated, error: error.message });
        }

        // Generate ejective word
        try {
          const ejectiveDir = path.join(baseDir, pair.ejective);
          if (!fs.existsSync(ejectiveDir)) {
            fs.mkdirSync(ejectiveDir, { recursive: true });
          }

          const ejectiveAudio = await generateAudioFile(pair.ejective, voiceId, voiceSettings);
          fs.writeFileSync(path.join(ejectiveDir, 'word.mp3'), ejectiveAudio);
          generated.push(pair.ejective);
          console.log(`[Similar Sounds] Generated: ${pair.ejective}`);

          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error: any) {
          errors.push({ word: pair.ejective, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generated.length} audio files`,
      generated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Similar Sounds Audio] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Audio generation failed' },
      { status: 500 }
    );
  }
}

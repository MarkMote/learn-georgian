// app/api/admin/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow up to 5 minutes for image generation (localhost only - excluded from Vercel via .vercelignore)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    console.log('[Image Gen] Starting generation with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    // Generate image using gpt-image-1
    console.log('[Image Gen] Calling OpenAI API...');
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt,
      size: '1024x1024',
      n: 1,
    });
    console.log('[Image Gen] OpenAI API response received');

    if (!response.data || response.data.length === 0) {
      console.error('[Image Gen] No data in response');
      return NextResponse.json(
        { error: 'No image data returned from OpenAI' },
        { status: 500 }
      );
    }

    const imageBase64 = response.data[0].b64_json;
    console.log('[Image Gen] Base64 received, length:', imageBase64?.length);

    if (!imageBase64) {
      console.error('[Image Gen] No base64 data in response');
      return NextResponse.json(
        { error: 'No image data returned from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: imageBase64,
      prompt: prompt,
    });
  } catch (error: any) {
    console.error('[Image Gen] ERROR:', error);
    console.error('[Image Gen] Error message:', error.message);
    console.error('[Image Gen] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}

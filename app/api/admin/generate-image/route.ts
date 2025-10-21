// app/api/admin/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow up to 5 minutes for image generation
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json();
    console.log('[Image Gen] Starting generation with prompt:', prompt);
    console.log('[Image Gen] Style:', style || 'natural (default)');

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    // Generate image using dall-e-3
    console.log('[Image Gen] Calling OpenAI API...');
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      n: 1,
      style: style || 'vivid', // Default to 'natural' for educational images
    });
    console.log('[Image Gen] OpenAI API response received');

    if (!response.data || response.data.length === 0) {
      console.error('[Image Gen] No data in response');
      return NextResponse.json(
        { error: 'No image data returned from OpenAI' },
        { status: 500 }
      );
    }

    const imageUrl = response.data[0].url;
    console.log('[Image Gen] Image URL:', imageUrl);

    if (!imageUrl) {
      console.error('[Image Gen] No image URL in response');
      return NextResponse.json(
        { error: 'No image URL returned from OpenAI' },
        { status: 500 }
      );
    }

    // Fetch the image and convert to base64
    console.log('[Image Gen] Fetching image from URL...');
    const imageResponse = await fetch(imageUrl);
    console.log('[Image Gen] Image fetch response status:', imageResponse.status);

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('[Image Gen] Image buffer size:', imageBuffer.byteLength);

    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    console.log('[Image Gen] Converted to base64, length:', imageBase64.length);

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

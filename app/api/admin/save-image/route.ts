// app/api/admin/save-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processAndSaveImage } from '@/app/admin/images/lib/imageProcessing';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, imgKey } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Valid image data is required' },
        { status: 400 }
      );
    }

    if (!imgKey || typeof imgKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid img_key is required' },
        { status: 400 }
      );
    }

    // Process and save both original and WebP versions
    await processAndSaveImage(imageBase64, imgKey);

    return NextResponse.json({
      success: true,
      message: `Image saved successfully for ${imgKey}`,
    });
  } catch (error: any) {
    console.error('Image save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save image' },
      { status: 500 }
    );
  }
}

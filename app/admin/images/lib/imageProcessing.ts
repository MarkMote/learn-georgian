// app/admin/images/lib/imageProcessing.ts

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Saves the original high-res PNG image to /originals directory
 */
export async function saveOriginalImage(
  base64Data: string,
  imgKey: string
): Promise<void> {
  const buffer = Buffer.from(base64Data, 'base64');
  const originalsDir = path.join(process.cwd(), 'originals');
  const filePath = path.join(originalsDir, `${imgKey}.png`);

  // Ensure originals directory exists
  await fs.mkdir(originalsDir, { recursive: true });

  // Save original PNG
  await fs.writeFile(filePath, buffer);
}

/**
 * Converts and compresses image to WebP format for production use
 * Resizes to 450x450 and targets ~50KB file size
 */
export async function convertToWebP(
  base64Data: string,
  imgKey: string
): Promise<void> {
  const buffer = Buffer.from(base64Data, 'base64');
  const publicDir = path.join(process.cwd(), 'public', 'img');
  const filePath = path.join(publicDir, `${imgKey}.webp`);

  // Ensure public/img directory exists
  await fs.mkdir(publicDir, { recursive: true });

  // Convert to WebP with compression
  await sharp(buffer)
    .resize(450, 450, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .webp({ quality: 80 })
    .toFile(filePath);
}

/**
 * Full pipeline: saves original and creates WebP version
 */
export async function processAndSaveImage(
  base64Data: string,
  imgKey: string
): Promise<void> {
  await Promise.all([
    saveOriginalImage(base64Data, imgKey),
    convertToWebP(base64Data, imgKey)
  ]);
}

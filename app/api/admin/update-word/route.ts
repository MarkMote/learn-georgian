// app/api/admin/update-word/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { imgKey, updates } = await request.json();

    if (!imgKey || typeof imgKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid imgKey is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Valid updates object is required' },
        { status: 400 }
      );
    }

    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'public', 'words.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');

    // Parse CSV with proper quoting support
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
    });

    // Check for critical parse errors (ignore field mismatch warnings if data is present)
    const criticalErrors = parseResult.errors.filter(
      (error) => error.type !== 'FieldMismatch'
    );

    if (criticalErrors.length > 0) {
      console.error('[Update Word] Critical CSV parse errors:', criticalErrors);
      return NextResponse.json(
        { error: 'Failed to parse CSV file' },
        { status: 500 }
      );
    }

    // Log field mismatch warnings but continue
    const fieldMismatchWarnings = parseResult.errors.filter(
      (error) => error.type === 'FieldMismatch'
    );
    if (fieldMismatchWarnings.length > 0) {
      console.warn('[Update Word] Field mismatch warnings:', fieldMismatchWarnings);
    }

    // Update all rows with matching img_key
    let updatedCount = 0;
    const updatedData = parseResult.data.map((row: any) => {
      if (row.img_key === imgKey) {
        updatedCount++;
        return {
          ...row,
          EnglishWord: updates.EnglishWord ?? row.EnglishWord,
          GeorgianWord: updates.GeorgianWord ?? row.GeorgianWord,
          ExampleEnglish1: updates.ExampleEnglish1 ?? row.ExampleEnglish1,
          ExampleGeorgian1: updates.ExampleGeorgian1 ?? row.ExampleGeorgian1,
        };
      }
      return row;
    });

    if (updatedCount === 0) {
      return NextResponse.json(
        { error: `No rows found with img_key: ${imgKey}` },
        { status: 404 }
      );
    }

    // Convert back to CSV with proper quoting
    const csv = Papa.unparse(updatedData, {
      header: true,
      quotes: false, // Only quote fields that need it (containing commas, quotes, newlines)
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
    });

    // Write back to file
    await fs.writeFile(csvPath, csv, 'utf-8');

    console.log(`[Update Word] Updated ${updatedCount} rows with img_key: ${imgKey}`);

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error: any) {
    console.error('[Update Word] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update word' },
      { status: 500 }
    );
  }
}

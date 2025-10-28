// app/api/tip-suggestions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { wordKey, tip } = await request.json();

    if (!wordKey || typeof wordKey !== 'string') {
      return NextResponse.json(
        { error: 'Word key is required and must be a string' },
        { status: 400 }
      );
    }

    if (!tip || typeof tip !== 'string') {
      return NextResponse.json(
        { error: 'Tip is required and must be a string' },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1Xf-oPppBkZbCN0dFQfkCEVFSNeFKSJTEgeWKQHkv4bc';

    const timestamp = new Date().toISOString();
    const values = [
      [timestamp, wordKey, tip]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'TipSuggestions!A:C',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting tip suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to submit tip suggestion' },
      { status: 500 }
    );
  }
}

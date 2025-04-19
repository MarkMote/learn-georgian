import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the structure matching the frontend's PhraseData type
// It's good practice to define it here too, or share it from a common types file.
type PhraseData = {
  key: string; // Using Georgian phrase as key
  EnglishPhrase: string;
  GeorgianPhrase: string;
  ExampleGeorgian: string;
  ExampleEnglish: string;
};

// Define the expected structure of the environment variables
interface GoogleEnvVars {
    clientEmail: string;
    privateKey: string;
    sheetId: string;
}

/**
 * Fetches environment variables required for Google Sheets API access.
 * Throws an error if any required variable is missing.
 */
function getGoogleEnvVars(): GoogleEnvVars {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail) {
        throw new Error("Missing GOOGLE_CLIENT_EMAIL environment variable.");
    }
    if (!privateKeyRaw) {
        throw new Error("Missing GOOGLE_PRIVATE_KEY environment variable.");
    }
    if (!sheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID environment variable.");
    }

    // Format the private key correctly (replace literal \n with actual newlines)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    return { clientEmail, privateKey, sheetId };
}

export async function GET(request: NextRequest) {
    console.log("API route /api/phrases called"); // Log entry

    try {
        const { clientEmail, privateKey, sheetId } = getGoogleEnvVars();

        // --- Authentication ---
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Read-only scope
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // --- Fetch Data ---
        // Assuming your data is in 'Sheet1' and columns are A:English, B:Georgian, C:ExampleGeorgian, D:ExampleEnglish
        // Adjust 'Sheet1!A2:D' if your sheet name or columns are different.
        // A2:D means start from cell A2 and fetch all rows in columns A, B, C, D.
        const range = 'Sheet1!A2:D';
        console.log(`Fetching data from sheet ID: ${sheetId}, range: ${range}`); // Log fetch details

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: range,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.log("No data found in the specified range."); // Log empty data
            return NextResponse.json({ phrases: [] }); // Return empty array if no data
        }

        // --- Process Data ---
        const phrases: PhraseData[] = rows
            .map((row) => {
                // Ensure row has enough columns, providing defaults if not
                const englishPhrase = row[0]?.trim() || "";
                const georgianPhrase = row[1]?.trim() || "";
                const exampleGeorgian = row[2]?.trim() || "";
                const exampleEnglish = row[3]?.trim() || "";

                // Use Georgian phrase as the key, skip if it's empty
                if (!georgianPhrase) {
                    return null; // Skip rows without a Georgian phrase (key)
                }

                return {
                    key: georgianPhrase,
                    EnglishPhrase: englishPhrase,
                    GeorgianPhrase: georgianPhrase,
                    ExampleGeorgian: exampleGeorgian,
                    ExampleEnglish: exampleEnglish,
                };
            })
            .filter((phrase): phrase is PhraseData => phrase !== null); // Filter out null entries and assert type

        console.log(`Successfully fetched and processed ${phrases.length} phrases.`); // Log success
        return NextResponse.json({ phrases }); // Return the processed data under a 'phrases' key

    } catch (error: unknown) {
        console.error("Error fetching phrases from Google Sheets:", error); // Log the error

        // Provide a more informative error response
        let errorMessage = "Failed to fetch phrases from Google Sheets.";
        let errorDetails = "An internal server error occurred.";

        if (error instanceof Error) {
            errorMessage = error.message; // Use the specific error message if available
            // Optionally include stack trace in logs but not in response
            console.error("Stack Trace:", error.stack);
             // Check for specific Google API errors (example)
            if ('response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response) {
                 const googleError = error.response.data as any;
                 if (googleError?.error?.message) {
                     errorDetails = googleError.error.message;
                 }
            } else if (error.message.includes("Missing")) {
                // Specific handling for missing env vars
                errorDetails = "Server configuration error: Missing required environment variable.";
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: errorDetails
            },
            { status: 500 }
        );
    }
} 
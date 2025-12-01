// app/morphology/deck/utils/dataProcessing.ts

import Papa from 'papaparse';
import { MorphologyData } from '../types';

export function parseCSV(csvText: string): MorphologyData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim() || undefined,
  });

  return result.data.map((row: any, index: number) => ({
    markerType: row["Marker Type"] || "",
    marker: row["Marker"] || "",
    meaning: row["Meaning"] || "",
    example1: row["Example 1"] || "",
    example2: row["Example 2"] || "",
    key: `morphology_${index}`, // unique key based on index
  }));
}

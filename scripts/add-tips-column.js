// scripts/add-tips-column.js
// Script to add the tips column to words.csv

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.join(__dirname, '..', 'public', 'words.csv');

console.log('Reading words.csv...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

console.log('Parsing CSV...');
const parseResult = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
});

if (parseResult.errors.length > 0) {
  console.error('Parse errors:', parseResult.errors);
}

console.log(`Found ${parseResult.data.length} rows`);

// Add tips field to each row (empty string by default)
console.log('Adding tips column...');
const updatedData = parseResult.data.map(row => ({
  ...row,
  tips: row.tips || '', // Keep existing tips if present, otherwise empty
}));

console.log('Converting back to CSV...');
const csv = Papa.unparse(updatedData, {
  header: true,
  quotes: false,
});

console.log('Writing updated CSV...');
fs.writeFileSync(csvPath, csv, 'utf-8');

console.log('✅ Successfully added tips column to words.csv');

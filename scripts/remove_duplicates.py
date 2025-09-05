#!/usr/bin/env python3
import csv
import os

# Set the path to the public directory
public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
words_path = os.path.join(public_dir, 'words.csv')
words_new_path = os.path.join(public_dir, 'words_new.csv')

# Read words.csv
words_rows = []
with open(words_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    words_rows = list(reader)

# Read words_new.csv
words_new_rows = []
with open(words_new_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    words_new_rows = list(reader)

# Convert words.csv rows (excluding header) to set of tuples for comparison
words_set = set(tuple(row) for row in words_rows[1:])

# Keep header and non-duplicate rows from words_new.csv
filtered_rows = [words_new_rows[0]]  # Keep header
for row in words_new_rows[1:]:
    if tuple(row) not in words_set:
        filtered_rows.append(row)

# Write filtered data back to words_new.csv
with open(words_new_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(filtered_rows)

print(f"Original words_new.csv had {len(words_new_rows)} rows")
print(f"Filtered words_new.csv has {len(filtered_rows)} rows")
print(f"Removed {len(words_new_rows) - len(filtered_rows)} duplicate rows")
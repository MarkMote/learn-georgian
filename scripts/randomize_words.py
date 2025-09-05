#!/usr/bin/env python3
import csv
import os
import random

# Set the path to the public directory
public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
words_new_path = os.path.join(public_dir, 'words_new.csv')

# Read words_new.csv
with open(words_new_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

# Keep header and first 100 rows as-is
header = rows[0]
first_100 = rows[1:101]  # Rows 1-100 (excluding header)
remaining = rows[101:]   # Rows after line 100

# Randomize the remaining rows
random.shuffle(remaining)

# Combine all rows
final_rows = [header] + first_100 + remaining

# Write back to words_new.csv
with open(words_new_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(final_rows)

print(f"Total rows: {len(rows)}")
print(f"Header: 1 row")
print(f"First 100 rows kept in order: {len(first_100)} rows")
print(f"Randomized rows: {len(remaining)} rows")
print("Successfully randomized rows after line 100 in words_new.csv")
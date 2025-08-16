import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'lessons.db');

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS lesson_cache (
        word TEXT PRIMARY KEY,
        lesson TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }
  return db;
}

export function getCachedLesson(word: string): string | null {
  try {
    const database = getDb();
    const normalizedWord = word.toLowerCase().trim();
    
    const stmt = database.prepare('SELECT lesson FROM lesson_cache WHERE word = ?');
    const result = stmt.get(normalizedWord) as { lesson: string } | undefined;
    
    return result?.lesson || null;
  } catch (error) {
    console.error('Error getting cached lesson:', error);
    return null;
  }
}

export function cacheLesson(word: string, lesson: string) {
  try {
    const database = getDb();
    const normalizedWord = word.toLowerCase().trim();
    
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO lesson_cache (word, lesson, created_at) 
      VALUES (?, ?, ?)
    `);
    
    stmt.run(normalizedWord, lesson, Date.now());
  } catch (error) {
    console.error('Error caching lesson:', error);
  }
}

// Optional: Get cache stats for monitoring
export function getCacheStats() {
  try {
    const database = getDb();
    const countStmt = database.prepare('SELECT COUNT(*) as count FROM lesson_cache');
    const sizeStmt = database.prepare('SELECT SUM(LENGTH(lesson)) as total_size FROM lesson_cache');
    
    const count = (countStmt.get() as { count: number }).count;
    const totalSize = (sizeStmt.get() as { total_size: number }).total_size;
    
    return { count, totalSizeBytes: totalSize };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, totalSizeBytes: 0 };
  }
}
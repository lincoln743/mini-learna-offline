import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mini_learna.db');

export function resetDatabase() {
  db.execSync(`DROP TABLE IF EXISTS lesson_progress;`);
  db.execSync(`DROP TABLE IF EXISTS app_state;`);
  db.execSync(`DROP TABLE IF EXISTS review_mistakes;`);
  db.execSync(`DROP TABLE IF EXISTS ai_lessons;`);
}

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      unlocked INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS ai_lessons (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS review_mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_text TEXT NOT NULL,
      corrected_text TEXT NOT NULL,
      explanation TEXT,
      example_text TEXT,
      error_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db.getFirstSync(`SELECT COUNT(*) as total FROM lesson_progress`);

  if (!count || Number(count.total) === 0) {
    const seed = [
      ['1', 0, 0, 1],
      ['2', 0, 0, 1],
      ['3', 0, 0, 1],
      ['4', 0, 0, 1],
      ['5', 0, 0, 1],
      ['6', 0, 0, 1],
    ];

    for (const [lessonId, progress, completed, unlocked] of seed) {
      db.runSync(
        `INSERT OR REPLACE INTO lesson_progress (lesson_id, progress, completed, unlocked) VALUES (?, ?, ?, ?)`,
        lessonId,
        progress,
        completed,
        unlocked
      );
    }

    db.runSync(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      'lastLessonId',
      '1'
    );
  } else {
    try {
      db.execSync(`ALTER TABLE lesson_progress ADD COLUMN unlocked INTEGER NOT NULL DEFAULT 1;`);
    } catch (e) {}
  }
}

//////////////////////////
// AI LESSONS
//////////////////////////

export function saveAiLesson(lesson) {
  initDatabase();

  const id = String(lesson?.id || `ai-${Date.now()}`);
  const safeLesson = {
    ...lesson,
    id,
    source: 'ai',
  };

  db.runSync(
    `INSERT OR REPLACE INTO ai_lessons (id, data, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    id,
    JSON.stringify(safeLesson)
  );

  const existingProgress = db.getFirstSync(
    `SELECT lesson_id FROM lesson_progress WHERE lesson_id = ?`,
    id
  );

  if (!existingProgress) {
    db.runSync(
      `INSERT OR REPLACE INTO lesson_progress (lesson_id, progress, completed, unlocked) VALUES (?, ?, ?, ?)`,
      id,
      0,
      0,
      1
    );
  }

  return id;
}

export function getAiLessons() {
  initDatabase();

  const rows = db.getAllSync(
    `SELECT data FROM ai_lessons ORDER BY created_at DESC`
  );

  return rows
    .map((row) => {
      try {
        return JSON.parse(row.data);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function clearAiLessons() {
  initDatabase();

  const rows = db.getAllSync(`SELECT id FROM ai_lessons`);

  for (const row of rows) {
    db.runSync(`DELETE FROM lesson_progress WHERE lesson_id = ?`, row.id);
  }

  db.runSync(`DELETE FROM ai_lessons`);
}

//////////////////////////
// PROGRESS
//////////////////////////

export function getAllLessonProgress() {
  initDatabase();

  const rows = db.getAllSync(
    `SELECT lesson_id, progress, completed, unlocked FROM lesson_progress`
  );

  const map = {};

  for (const row of rows) {
    map[row.lesson_id] = {
      progress: Number(row.progress) || 0,
      completed: Number(row.completed) === 1,
      unlocked: Number(row.unlocked) === 1,
    };
  }

  return map;
}

export function getLessonProgress(lessonId) {
  initDatabase();

  const row = db.getFirstSync(
    `SELECT lesson_id, progress, completed, unlocked FROM lesson_progress WHERE lesson_id = ?`,
    String(lessonId)
  );

  if (!row) {
    return { progress: 0, completed: false, unlocked: true };
  }

  return {
    progress: Number(row.progress) || 0,
    completed: Number(row.completed) === 1,
    unlocked: Number(row.unlocked) === 1,
  };
}

export function saveLessonProgress(lessonId, progress) {
  initDatabase();

  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const completed = safeProgress >= 100 ? 1 : 0;

  db.runSync(
    `
      INSERT INTO lesson_progress (lesson_id, progress, completed, unlocked, updated_at)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET
        progress = excluded.progress,
        completed = excluded.completed,
        unlocked = 1,
        updated_at = CURRENT_TIMESTAMP
    `,
    String(lessonId),
    safeProgress,
    completed
  );

  db.runSync(
    `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
    'lastLessonId',
    String(lessonId)
  );
}

export function getLastLessonId() {
  initDatabase();

  const row = db.getFirstSync(
    `SELECT value FROM app_state WHERE key = ?`,
    'lastLessonId'
  );

  return row?.value ?? null;
}

//////////////////////////
// REVIEW MISTAKES
//////////////////////////

export function saveReviewMistake({
  originalText,
  correctedText,
  explanation,
  exampleText,
  errorType,
}) {
  initDatabase();

  db.runSync(
    `
      INSERT INTO review_mistakes
      (original_text, corrected_text, explanation, example_text, error_type)
      VALUES (?, ?, ?, ?, ?)
    `,
    String(originalText || ''),
    String(correctedText || ''),
    String(explanation || ''),
    String(exampleText || ''),
    String(errorType || 'Geral')
  );
}

export function getReviewMistakes() {
  initDatabase();

  return db.getAllSync(`
    SELECT id, original_text, corrected_text, explanation, example_text, error_type, created_at
    FROM review_mistakes
    ORDER BY id DESC
  `);
}

export function clearReviewMistakes() {
  initDatabase();
  db.runSync(`DELETE FROM review_mistakes`);
}

//////////////////////////
// STATS
//////////////////////////

export function getStats() {
  initDatabase();

  const completedRow = db.getFirstSync(
    `SELECT COUNT(*) as total FROM lesson_progress WHERE completed = 1`
  );

  const minutesRow = db.getFirstSync(
    `SELECT COALESCE(SUM(progress), 0) as total FROM lesson_progress`
  );

  const mistakesRow = db.getFirstSync(
    `SELECT COUNT(*) as total FROM review_mistakes`
  );

  return {
    completedLessons: Number(completedRow?.total) || 0,
    studiedMinutes: Math.round((Number(minutesRow?.total) || 0) / 10),
    reviewedMistakes: Number(mistakesRow?.total) || 0,
    streakDays: 1,
  };
}

export default db;

// 🔥 DELETE SINGLE AI LESSON
export function deleteAiLesson(lessonId) {
  initDatabase();

  if (!lessonId) return;

  // remove progresso
  db.runSync(
    `DELETE FROM lesson_progress WHERE lesson_id = ?`,
    String(lessonId)
  );

  // remove lição
  db.runSync(
    `DELETE FROM ai_lessons WHERE id = ?`,
    String(lessonId)
  );
}

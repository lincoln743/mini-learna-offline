import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mini_learna.db');

export function resetDatabase() {
  db.execSync(`DROP TABLE IF EXISTS lesson_progress;`);
  db.execSync(`DROP TABLE IF EXISTS app_state;`);
  db.execSync(`DROP TABLE IF EXISTS review_mistakes;`);
}

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      unlocked INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

  if (!count || count.total === 0) {
    const seed = [
      ['1', 0, 0, 1],
      ['2', 0, 0, 0],
      ['3', 0, 0, 0],
      ['4', 0, 0, 0],
      ['5', 0, 0, 0],
      ['6', 0, 0, 0]
    ];

    for (const [lessonId, progress, completed, unlocked] of seed) {
      db.runSync(
        `INSERT OR REPLACE INTO lesson_progress (lesson_id, progress, completed, unlocked) VALUES (?, ?, ?, ?)`,
        lessonId, progress, completed, unlocked
      );
    }

    db.runSync(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      'lastLessonId', '1'
    );
  } else {
    try {
      db.execSync(`ALTER TABLE lesson_progress ADD COLUMN unlocked INTEGER NOT NULL DEFAULT 0;`);
    } catch (e) {}
  }
}

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
    lessonId
  );

  if (!row) {
    return { progress: 0, completed: false, unlocked: false };
  }

  return {
    progress: Number(row.progress) || 0,
    completed: Number(row.completed) === 1,
    unlocked: Number(row.unlocked) === 1,
  };
}

function unlockNextLesson(currentLessonId) {
  const nextLessonId = String(Number(currentLessonId) + 1);
  const exists = db.getFirstSync(
    `SELECT lesson_id FROM lesson_progress WHERE lesson_id = ?`,
    nextLessonId
  );

  if (exists) {
    db.runSync(
      `UPDATE lesson_progress SET unlocked = 1 WHERE lesson_id = ?`,
      nextLessonId
    );
  }
}

export function saveLessonProgress(lessonId, progress) {
  initDatabase();

  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const completed = safeProgress >= 100 ? 1 : 0;

  const current = db.getFirstSync(
    `SELECT unlocked FROM lesson_progress WHERE lesson_id = ?`,
    String(lessonId)
  );

  const unlocked = current ? Number(current.unlocked) : 1;

  db.runSync(
    `
      INSERT INTO lesson_progress (lesson_id, progress, completed, unlocked, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET
        progress = excluded.progress,
        completed = excluded.completed,
        unlocked = COALESCE(lesson_progress.unlocked, excluded.unlocked),
        updated_at = CURRENT_TIMESTAMP
    `,
    String(lessonId), safeProgress, completed, unlocked || 1
  );

  db.runSync(
    `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
    'lastLessonId', String(lessonId)
  );

  if (completed === 1) {
    unlockNextLesson(String(lessonId));
  }
}

export function getLastLessonId() {
  initDatabase();
  const row = db.getFirstSync(
    `SELECT value FROM app_state WHERE key = ?`,
    'lastLessonId'
  );

  return row?.value ?? null;
}

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

import lessons from '../data/lessons.json';
import { getAiReply } from './aiService';
import { saveAiLesson, getAiLessons } from '../db/database';

const LEVEL_MAP = {
  'Básico': 'basic',
  'Intermediário': 'intermediate',
  'Avançado': 'advanced'
};

function extractJsonBlock(text) {
  const raw = String(text || '').trim();

  if (!raw) return null;

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    const candidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

function humanizeTheme(theme) {
  return String(theme || 'Conversation').trim();
}

function buildDeterministicLesson({ level, theme }) {
  const safeTheme = humanizeTheme(theme);

  return {
    id: `ai-${Date.now()}`,
    title: safeTheme,
    titlePt: `Lição sobre ${safeTheme}`,
    description: `Pratique inglês sobre ${safeTheme}.`,
    level,
    category: safeTheme,
    duration: '5 min',
    steps: [
      {
        type: 'multiple_choice',
        question: `Choose the best sentence about ${safeTheme}.`,
        options: [
          `I can talk about ${safeTheme}.`,
          `I talking about ${safeTheme}.`,
          `Me talk about ${safeTheme}.`
        ],
        correctIndex: 0
      },
      {
        type: 'speak',
        prompt: `Say one simple sentence about ${safeTheme}.`
      }
    ]
  };
}

function normalizeAiLesson(parsed, level, theme) {
  const safeTheme = humanizeTheme(theme);

  return {
    id: `ai-${Date.now()}`,
    title: String(parsed?.title || safeTheme).trim(),
    titlePt: String(parsed?.titlePt || `Lição sobre ${safeTheme}`).trim(),
    description: String(
      parsed?.description || `Pratique inglês sobre ${safeTheme}.`
    ).trim(),
    level,
    category: safeTheme,
    duration: '5 min',
    steps: Array.isArray(parsed?.steps) && parsed.steps.length >= 2
      ? parsed.steps.slice(0, 2)
      : buildDeterministicLesson({ level, theme: safeTheme }).steps
  };
}

export function getAllLessons() {
  const staticLessons = lessons.map((l) => ({
    ...l,
    level: LEVEL_MAP[l.level] || 'basic',
    source: 'static'
  }));

  const aiLessons = getAiLessons().map((l) => ({
    ...l,
    source: 'ai'
  }));

  return [...aiLessons, ...staticLessons];
}

export async function generateLesson({ level = 'basic', theme = 'daily conversation' }) {
  const safeTheme = humanizeTheme(theme);

  try {
    const prompt = `
Create a very short English lesson for a Brazilian learner.

Return ONLY valid JSON:
{
  "title":"...",
  "titlePt":"...",
  "description":"...",
  "steps":[
    {
      "type":"multiple_choice",
      "question":"...",
      "options":["...","...","..."],
      "correctIndex":0
    },
    {
      "type":"speak",
      "prompt":"..."
    }
  ]
}

Rules:
- Level: ${level}
- Theme: ${safeTheme}
- Keep description under 8 words
- Keep all text short
- Exactly 2 steps
- No markdown
- No explanation outside JSON
`;

    const ai = await getAiReply(prompt);
    const parsed = extractJsonBlock(ai.reply);

    if (!parsed) {
      const fallback = buildDeterministicLesson({ level, theme: safeTheme });
      saveAiLesson(fallback);
      return fallback;
    }

    const lesson = normalizeAiLesson(parsed, level, safeTheme);
    saveAiLesson(lesson);
    return lesson;
  } catch (error) {
    console.log('[LESSON AI FALLBACK]', error);

    const fallback = buildDeterministicLesson({ level, theme: safeTheme });
    saveAiLesson(fallback);
    return fallback;
  }
}

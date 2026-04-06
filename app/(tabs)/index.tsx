import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '../../src/styles/theme';
import { useProgressData } from '../../src/hooks/useProgressData';
import { getAllLessons } from '../../src/services/lessonService';
import db from '../../src/db/database';
import { useCallback, useState } from 'react';

const PLACEMENT_QUESTIONS = [
  {
    id: 'q1',
    question: 'How do you introduce yourself in English?',
    options: [
      { label: 'My name is Lincoln.', score: 1 },
      { label: 'Me Lincoln.', score: 0 },
      { label: 'I am called Lincoln and currently work with sales strategy.', score: 2 },
    ],
  },
  {
    id: 'q2',
    question: 'Choose the best sentence:',
    options: [
      { label: 'She go to work every day.', score: 0 },
      { label: 'She goes to work every day.', score: 1 },
      { label: 'She has been going to work every day without missing a shift.', score: 2 },
    ],
  },
  {
    id: 'q3',
    question: 'At a restaurant, what would you say?',
    options: [
      { label: 'I want water.', score: 0 },
      { label: 'Could I have some water, please?', score: 1 },
      { label: 'Would you mind bringing me some sparkling water, please?', score: 2 },
    ],
  },
  {
    id: 'q4',
    question: 'Choose the best professional answer:',
    options: [
      { label: 'I work with people.', score: 0 },
      { label: 'I work in sales and support customers.', score: 1 },
      { label: 'I lead commercial strategy and customer engagement across multiple markets.', score: 2 },
    ],
  },
  {
    id: 'q5',
    question: 'Which sentence sounds more natural in conversation?',
    options: [
      { label: 'Yesterday I go to the store.', score: 0 },
      { label: 'Yesterday I went to the store.', score: 1 },
      { label: 'Yesterday I went to the store because I needed a few things for dinner.', score: 2 },
    ],
  },
];

function normalizeLevel(value) {
  const text = String(value || '').toLowerCase();

  if (text.includes('advanced') || text.includes('avanç')) return 'advanced';
  if (text.includes('intermediate') || text.includes('intermedi')) return 'intermediate';
  return 'basic';
}

function getLevelFromScore(score) {
  if (score >= 8) return 'advanced';
  if (score >= 4) return 'intermediate';
  return 'basic';
}

function getLevelReason(level) {
  if (level === 'advanced') {
    return 'Você já demonstra vocabulário e estruturas mais naturais.';
  }

  if (level === 'intermediate') {
    return 'Você já tem boa base e pode evoluir com prática guiada.';
  }

  return 'O ideal é começar com fundamentos e conversas simples.';
}

export default function HomeScreen() {
  const { progressMap, lastLessonId } = useProgressData();

  const [userLevel, setUserLevel] = useState(null);
  const [userLevelReason, setUserLevelReason] = useState('');
  const [isPlacementStarted, setIsPlacementStarted] = useState(false);
  const [placementStep, setPlacementStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lessons, setLessons] = useState([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setLessons(getAllLessons());

        const levelRow = db.getFirstSync(
          `SELECT value FROM app_state WHERE key = ?`,
          'userLevel'
        );

        const reasonRow = db.getFirstSync(
          `SELECT value FROM app_state WHERE key = ?`,
          'userLevelReason'
        );

        if (levelRow?.value) {
          setUserLevel(normalizeLevel(levelRow.value));
        } else {
          setUserLevel(null);
        }

        if (reasonRow?.value) {
          setUserLevelReason(String(reasonRow.value));
        } else {
          setUserLevelReason('');
        }
      } catch (error) {
        console.log('[HOME] refresh error =', error);
      }
    }, [])
  );

  const lastLesson = lessons.find((l) => l.id === lastLessonId);
  const percent = progressMap[lastLessonId]?.progress || 0;

  const currentQuestion = PLACEMENT_QUESTIONS[placementStep];
  const levelLabel = {
    basic: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  }[userLevel];

  const startPlacementTest = () => {
    setAnswers({});
    setPlacementStep(0);
    setIsPlacementStarted(true);
  };

  const handleAnswer = (score) => {
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: score,
    };

    setAnswers(nextAnswers);

    const isLastQuestion = placementStep === PLACEMENT_QUESTIONS.length - 1;

    if (!isLastQuestion) {
      setPlacementStep((prev) => prev + 1);
      return;
    }

    const totalScore = Object.values(nextAnswers).reduce((sum, value) => sum + Number(value || 0), 0);
    const detectedLevel = getLevelFromScore(totalScore);
    const detectedReason = getLevelReason(detectedLevel);

    setUserLevel(detectedLevel);
    setUserLevelReason(detectedReason);
    setIsPlacementStarted(false);

    db.runSync(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      'userLevel',
      detectedLevel
    );

    db.runSync(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      'userLevelReason',
      detectedReason
    );
  };

  const resetPlacement = () => {
    setUserLevel(null);
    setUserLevelReason('');
    setAnswers({});
    setPlacementStep(0);
    setIsPlacementStarted(false);

    db.runSync(`DELETE FROM app_state WHERE key = ?`, 'userLevel');
    db.runSync(`DELETE FROM app_state WHERE key = ?`, 'userLevelReason');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appTitle}>Mini Learna</Text>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Aprenda com conversa</Text>
        <Text style={styles.heroSubtitle}>
          IA + prática real + evolução contínua
        </Text>
      </View>

      <TouchableOpacity
        style={styles.mainActionCard}
        onPress={() => router.push('/tutor')}
      >
        <Text style={styles.mainActionTitle}>Conversar com IA</Text>
        <Text style={styles.mainActionText}>
          Treine inglês falando de forma natural
        </Text>
      </TouchableOpacity>

      {!userLevel && !isPlacementStarted && (
        <TouchableOpacity
          style={styles.levelCard}
          onPress={startPlacementTest}
        >
          <Text style={styles.levelTitle}>Descobrir meu nível</Text>
          <Text style={styles.levelText}>
            Faça 5 perguntas rápidas e receba uma trilha sugerida
          </Text>
        </TouchableOpacity>
      )}

      {isPlacementStarted && currentQuestion && (
        <View style={styles.testCard}>
          <Text style={styles.testStep}>
            Pergunta {placementStep + 1} de {PLACEMENT_QUESTIONS.length}
          </Text>

          <Text style={styles.testQuestion}>{currentQuestion.question}</Text>

          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={`${currentQuestion.id}-${index}`}
              style={styles.optionButton}
              onPress={() => handleAnswer(option.score)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {userLevel && (
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>Seu nível: {levelLabel}</Text>
          <Text style={styles.recommendText}>{userLevelReason}</Text>

          <TouchableOpacity
            style={styles.smallAction}
            onPress={() => router.push('/lessons')}
          >
            <Text style={styles.smallActionText}>
              Ver trilha recomendada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionSecondary}
            onPress={resetPlacement}
          >
            <Text style={styles.smallActionSecondaryText}>
              Refazer teste
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {lastLesson && (
        <TouchableOpacity
          style={styles.lessonCard}
          onPress={() => router.push(`/lesson/${lastLesson.id}`)}
        >
          <Text style={styles.lessonLabel}>Última lição aberta</Text>
          <Text style={styles.lessonTitle}>{lastLesson.titlePt}</Text>
          <Text style={styles.lessonSub}>{lastLesson.title}</Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
          </View>

          <Text style={styles.progressText}>{percent}% concluído</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/lessons')}
      >
        <Text style={styles.secondaryButtonText}>Explorar lições</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },

  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  hero: {
    marginVertical: 16,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },

  heroSubtitle: {
    color: colors.textSoft,
  },

  mainActionCard: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },

  mainActionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  mainActionText: {
    color: '#e0f2fe',
  },

  levelCard: {
    backgroundColor: '#111827',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },

  levelTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },

  levelText: {
    color: '#9ca3af',
  },

  testCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  testStep: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 8,
  },

  testQuestion: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 14,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  optionText: {
    color: colors.text,
    fontWeight: '600',
  },

  recommendCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  recommendTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },

  recommendText: {
    color: colors.textSoft,
    marginBottom: 12,
  },

  smallAction: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  smallActionText: {
    color: '#fff',
    fontWeight: '800',
  },

  smallActionSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  smallActionSecondaryText: {
    color: colors.text,
    fontWeight: '700',
  },

  lessonCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  lessonLabel: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },

  lessonTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  lessonSub: {
    color: colors.textSoft,
    marginBottom: 12,
  },

  progressBarBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: 10,
    backgroundColor: colors.primary,
  },

  progressText: {
    marginTop: 6,
    color: colors.textSoft,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
});

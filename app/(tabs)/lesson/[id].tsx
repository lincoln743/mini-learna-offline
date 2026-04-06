import { useEffect, useMemo, useState } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import lessons from '../../../src/data/lessons.json';
import lessonContent from '../../../src/data/lessonContent.json';
import { colors } from '../../../src/styles/theme';
import { useProgressData } from '../../../src/hooks/useProgressData';
import { getAllLessons } from '../../../src/services/lessonService';

const STEP_PROGRESS = [20, 40, 65, 85, 100];
const STEP_TITLES = ['Objetivo', 'Vocabulário', 'Exemplos', 'Exercício', 'Conclusão'];

const THEME_TRANSLATIONS = {
  'menstruação': 'Menstruation',
  'história da guitarra': 'History of the Guitar',
  'entrevista': 'Job Interview',
  'viagem': 'Travel',
  'restaurante': 'Restaurant',
  'trabalho': 'Work',
  'compras': 'Shopping',
  'apresentação pessoal': 'Self Introduction',
  'hotel': 'Hotel',
  'aeroporto': 'Airport',
  'telefone': 'Phone Call',
  'reunião': 'Meeting',
  'médico': 'Doctor Visit',
  'mercado': 'Supermarket',
};

function getStepFromProgress(progress) {
  if (progress >= 100) return 4;
  if (progress >= 85) return 3;
  if (progress >= 65) return 2;
  if (progress >= 40) return 1;
  if (progress >= 20) return 0;
  return 0;
}

function translateTheme(theme) {
  const raw = String(theme || '').trim();
  const key = raw.toLowerCase();
  return THEME_TRANSLATIONS[key] || raw;
}

function looksPortuguese(text) {
  const value = String(text || '').toLowerCase();
  if (!value) return false;

  const markers = [
    ' lição ',
    ' sobre ',
    ' prática ',
    ' pratique ',
    ' escolha ',
    ' frase ',
    ' resposta ',
    ' correta ',
    ' inglês ',
    ' instrumento ',
    ' história ',
    ' guitarra ',
    ' menstruação ',
    ' reunião ',
    ' médico ',
    ' mercado ',
    ' viagem ',
    ' trabalho ',
    ' compras ',
    ' apresentação ',
    ' você ',
    ' qual ',
    ' aqui estão ',
    ' descubra ',
    ' aprenda ',
    ' os ',
    ' as ',
    ' um ',
    ' uma ',
    ' de ',
    ' para ',
  ];

  return markers.some((marker) => value.includes(marker.trim()) || value.includes(marker));
}

function sanitizeLesson(lesson) {
  if (!lesson) return lesson;

  const categoryPt = String(lesson.category || 'Conversation').trim();
  const categoryEn = translateTheme(categoryPt);

  const safeTitle = looksPortuguese(lesson.title)
    ? categoryEn
    : String(lesson.title || categoryEn).trim();

  const safeTitlePt = String(
    lesson.titlePt || `Lição sobre ${categoryPt}`
  ).trim();

  const safeDescription = looksPortuguese(lesson.description)
    ? `Practice English about ${categoryEn}.`
    : String(lesson.description || `Practice English about ${categoryEn}.`).trim();

  const safeSteps = Array.isArray(lesson.steps)
    ? lesson.steps.map((step) => {
        if (step.type === 'multiple_choice') {
          return {
            ...step,
            question: looksPortuguese(step.question)
              ? `Choose the best sentence about ${categoryEn}.`
              : String(step.question || `Choose the best sentence about ${categoryEn}.`).trim(),
            options: Array.isArray(step.options) && step.options.length > 0
              ? step.options.map((option, index) => {
                  if (!looksPortuguese(option)) return String(option).trim();

                  if (index === 0) return `I can talk about ${categoryEn}.`;
                  if (index === 1) return `I talking about ${categoryEn}.`;
                  return `Me talk about ${categoryEn}.`;
                })
              : [
                  `I can talk about ${categoryEn}.`,
                  `I talking about ${categoryEn}.`,
                  `Me talk about ${categoryEn}.`,
                ],
            correctIndex:
              typeof step.correctIndex === 'number' ? step.correctIndex : 0,
          };
        }

        if (step.type === 'speak') {
          return {
            ...step,
            prompt: looksPortuguese(step.prompt)
              ? `Say one simple sentence about ${categoryEn}.`
              : String(step.prompt || `Say one simple sentence about ${categoryEn}.`).trim(),
          };
        }

        return step;
      })
    : [];

  return {
    ...lesson,
    title: safeTitle,
    titlePt: safeTitlePt,
    description: safeDescription,
    category: categoryPt,
    steps: safeSteps,
  };
}

function normalizeGeneratedContent(lesson) {
  if (!lesson || !Array.isArray(lesson.steps)) return null;

  const multipleChoiceStep = lesson.steps.find((step) => step.type === 'multiple_choice');
  const speakStep = lesson.steps.find((step) => step.type === 'speak');
  const categoryEn = translateTheme(lesson.category || lesson.title || 'Conversation');

  return {
    goal:
      looksPortuguese(lesson.description)
        ? `Practice English about ${categoryEn}.`
        : lesson.description || 'Practice this lesson step by step and focus on speaking naturally.',
    vocabulary: [
      {
        en: lesson.title || categoryEn,
        pt: lesson.titlePt || 'Conversa',
      },
      {
        en: categoryEn,
        pt: lesson.category || 'Tema',
      },
    ],
    examples: [
      speakStep?.prompt || `Let's practice ${lesson.title || categoryEn}.`,
      `Topic: ${categoryEn}`,
    ],
    exercise: multipleChoiceStep
      ? {
          question: multipleChoiceStep.question || `Choose the best sentence about ${categoryEn}.`,
          options: multipleChoiceStep.options || [],
          answer:
            typeof multipleChoiceStep.correctIndex === 'number'
              ? multipleChoiceStep.options?.[multipleChoiceStep.correctIndex] || ''
              : '',
        }
      : {
          question: `Choose the best sentence about ${categoryEn}.`,
          options: [
            `I can talk about ${categoryEn}.`,
            `I talking about ${categoryEn}.`,
            `Me talk about ${categoryEn}.`,
          ],
          answer: `I can talk about ${categoryEn}.`,
        },
    finalTip:
      speakStep?.prompt ||
      `Say one simple sentence about ${categoryEn}.`,
  };
}

export default function LessonDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { progressMap, updateLessonProgress } = useProgressData();

  const lesson = useMemo(() => {
    const allLessons = getAllLessons();
    const found =
      allLessons.find((item) => item.id === String(id)) ||
      lessons.find((item) => item.id === String(id));

    return sanitizeLesson(found);
  }, [id]);

  const content = useMemo(() => {
    const staticContent = lessonContent[String(id)];
    if (staticContent) return staticContent;
    return normalizeGeneratedContent(lesson);
  }, [id, lesson]);

  const lessonState = progressMap[String(id)] || {};
  const currentSavedProgress = lessonState.progress || 0;

  const [stepIndex, setStepIndex] = useState(getStepFromProgress(currentSavedProgress));
  const [selectedOption, setSelectedOption] = useState(null);
  const [exerciseChecked, setExerciseChecked] = useState(false);

  useEffect(() => {
    setStepIndex(getStepFromProgress(currentSavedProgress));
  }, [currentSavedProgress]);

  useEffect(() => {
    if (!id) return;
    updateLessonProgress(String(id), currentSavedProgress || 0);
  }, [id]);

  if (!lesson || !content) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Lição não encontrada.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = STEP_PROGRESS[stepIndex] || 0;
  const stepTitle = STEP_TITLES[stepIndex];
  const isExerciseStep = stepIndex === 3;
  const isCorrectAnswer = selectedOption === content.exercise.answer;
  const canAdvanceFromExercise = !isExerciseStep || exerciseChecked;

  const stepStatuses = STEP_TITLES.map((_, index) => {
    if (index < stepIndex) return 'done';
    if (index === stepIndex) return 'current';
    return 'todo';
  });

  const goNext = () => {
    if (!canAdvanceFromExercise) return;
    const nextStep = Math.min(stepIndex + 1, 4);
    setStepIndex(nextStep);
    updateLessonProgress(String(id), STEP_PROGRESS[nextStep]);
  };

  const goPrevious = () => {
    const prevStep = Math.max(stepIndex - 1, 0);
    setStepIndex(prevStep);
    updateLessonProgress(String(id), STEP_PROGRESS[prevStep]);
  };

  const handleCheckExercise = () => {
    if (!selectedOption) return;
    setExerciseChecked(true);
    updateLessonProgress(String(id), 85);
  };

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Objetivo da lição</Text>
          <Text style={styles.text}>{content.goal}</Text>
        </View>
      );
    }

    if (stepIndex === 1) {
      return (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vocabulário</Text>
          {content.vocabulary.map((item, index) => (
            <View key={index} style={styles.vocabRow}>
              <Text style={styles.vocabEn}>{item.en}</Text>
              <Text style={styles.vocabPt}>{item.pt}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (stepIndex === 2) {
      return (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Frases exemplo</Text>
          {content.examples.map((item, index) => (
            <View key={index} style={styles.exampleBox}>
              <Text style={styles.exampleText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (stepIndex === 3) {
      return (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mini exercício</Text>
          <Text style={styles.textQuestion}>{content.exercise.question}</Text>

          {content.exercise.options.map((option, index) => {
            const active = selectedOption === option;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, active && styles.optionButtonActive]}
                onPress={() => {
                  setSelectedOption(option);
                  setExerciseChecked(false);
                }}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckExercise}>
            <Text style={styles.secondaryButtonText}>Verificar resposta</Text>
          </TouchableOpacity>

          {exerciseChecked && (
            <View style={styles.feedbackBox}>
              <Text
                style={[
                  styles.feedbackText,
                  isCorrectAnswer ? styles.correctText : styles.wrongText,
                ]}
              >
                {isCorrectAnswer
                  ? 'Resposta correta.'
                  : `Resposta correta: ${content.exercise.answer}`}
              </Text>
            </View>
          )}

          {!exerciseChecked && (
            <Text style={styles.exerciseHint}>
              Responda o exercício para liberar a próxima etapa.
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conclusão</Text>
        <Text style={styles.text}>{content.finalTip}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{lesson.level}</Text>
      </View>

      <Text style={styles.title}>{lesson.titlePt}</Text>
      <Text style={styles.subtitle}>{lesson.title}</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Etapa atual</Text>
        <Text style={styles.progressStep}>{stepTitle}</Text>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressText}>{progress}% concluído</Text>

        <View style={styles.stepRow}>
          {STEP_TITLES.map((title, index) => {
            const status = stepStatuses[index];
            return (
              <View key={title} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    status === 'done' && styles.stepCircleDone,
                    status === 'current' && styles.stepCircleCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      status === 'done' && styles.stepCircleTextDone,
                      status === 'current' && styles.stepCircleTextCurrent,
                    ]}
                  >
                    {status === 'done' ? '✓' : index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    status === 'current' && styles.stepLabelCurrent,
                  ]}
                >
                  {title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {renderStepContent()}

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={[styles.navButtonOutline, stepIndex === 0 && styles.disabledButton]}
          onPress={goPrevious}
          disabled={stepIndex === 0}
        >
          <Text style={styles.navButtonOutlineText}>Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            (!canAdvanceFromExercise || stepIndex === 4) && styles.disabledButton,
          ]}
          onPress={goNext}
          disabled={!canAdvanceFromExercise || stepIndex === 4}
        >
          <Text style={styles.navButtonText}>
            {stepIndex === 4 ? 'Concluída' : 'Próxima etapa'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFound: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontWeight: '700',
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '700',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSoft,
    marginTop: 4,
    marginBottom: 18,
  },

  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  progressLabel: {
    color: colors.textSoft,
    fontWeight: '700',
  },
  progressStep: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    marginBottom: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  progressText: {
    marginTop: 8,
    color: colors.textSoft,
    fontWeight: '700',
  },

  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 6,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  stepCircleText: {
    color: colors.textSoft,
    fontWeight: '800',
    fontSize: 12,
  },
  stepCircleTextDone: {
    color: '#fff',
  },
  stepCircleTextCurrent: {
    color: colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.textSoft,
  },
  stepLabelCurrent: {
    color: colors.text,
    fontWeight: '700',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  text: {
    color: colors.textSoft,
    lineHeight: 22,
  },

  vocabRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vocabEn: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  vocabPt: {
    color: colors.textSoft,
    marginTop: 2,
  },

  exampleBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  exampleText: {
    color: colors.text,
    lineHeight: 22,
  },

  textQuestion: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    color: colors.text,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.primary,
  },

  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '800',
  },

  feedbackBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackText: {
    fontWeight: '800',
  },
  correctText: {
    color: colors.success,
  },
  wrongText: {
    color: colors.danger,
  },
  exerciseHint: {
    marginTop: 12,
    color: colors.warning,
    fontWeight: '700',
  },

  navigationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  navButtonOutline: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  navButtonOutlineText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

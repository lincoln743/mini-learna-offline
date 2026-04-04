import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import lessons from '../../src/data/lessons.json';
import { colors } from '../../src/styles/theme';
import { useProgressData } from '../../src/hooks/useProgressData';

export default function HomeScreen() {
  const { progressMap, lastLessonId } = useProgressData();

  const lastLesson = lessons.find((l) => l.id === lastLessonId);
  const percent = progressMap[lastLessonId]?.progress || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appTitle}>Mini Learna</Text>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Aprenda com conversa</Text>
        <Text style={styles.heroSubtitle}>
          Pratique inglês em conversas livres e lições interativas com IA.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.mainActionCard}
        onPress={() => router.push('/tutor')}
      >
        <Text style={styles.mainActionLabel}>Conversa Livre</Text>
        <Text style={styles.mainActionTitle}>Falar com a IA</Text>
        <Text style={styles.mainActionText}>
          Abra uma conversa em inglês, receba resposta em texto e continue praticando.
        </Text>
      </TouchableOpacity>

      {lastLesson && (
        <TouchableOpacity
          style={styles.lessonCard}
          onPress={() => router.push(`/lesson/${lastLesson.id}`)}
        >
          <Text style={styles.lessonLabel}>Continue sua lição</Text>
          <Text style={styles.lessonTitle}>{lastLesson.titlePt}</Text>
          <Text style={styles.lessonSub}>{lastLesson.title}</Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
          </View>

          <Text style={styles.progressText}>{percent}% concluído</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/lessons')}>
        <Text style={styles.secondaryButtonText}>Ver lições</Text>
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
    marginBottom: 12,
    color: colors.text
  },

  hero: {
    marginBottom: 20
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text
  },

  heroSubtitle: {
    color: colors.textSoft,
    marginTop: 4,
    lineHeight: 22,
  },

  mainActionCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  mainActionLabel: {
    color: '#dbeafe',
    fontWeight: '700',
    marginBottom: 4,
  },

  mainActionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  mainActionText: {
    color: '#eff6ff',
    lineHeight: 22,
  },

  lessonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },

  lessonLabel: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },

  lessonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text
  },

  lessonSub: {
    color: colors.textSoft,
    marginBottom: 12
  },

  progressBarBg: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden'
  },

  progressBarFill: {
    height: 12,
    backgroundColor: colors.primary
  },

  progressText: {
    marginTop: 8,
    fontWeight: '700',
    color: colors.textSoft
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center'
  },

  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700'
  }
});

import { Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import lessons from '../../src/data/lessons.json';
import { colors } from '../../src/styles/theme';
import { useProgressData } from '../../src/hooks/useProgressData';

export default function LessonsScreen() {
  const { progressMap } = useProgressData();

  const categories = useMemo(() => {
    return ['Todas', ...new Set(lessons.map((item) => item.category))];
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredLessons = useMemo(() => {
    if (selectedCategory === 'Todas') return lessons;
    return lessons.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lições</Text>
      <Text style={styles.subtitle}>
        Escolha uma lição curta e pratique inglês offline no seu ritmo.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredLessons.map((lesson) => {
        const lessonState = progressMap[lesson.id] || {};
        const percent = lessonState.progress || 0;
        const completed = !!lessonState.completed;
        const unlocked = lessonState.unlocked ?? (lesson.id === '1');

        return (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.card, !unlocked && styles.cardLocked]}
            onPress={() => unlocked && router.push(`/lesson/${lesson.id}`)}
            activeOpacity={unlocked ? 0.7 : 1}
          >
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>{lesson.titlePt}</Text>
              <Text style={styles.statusIcon}>
                {completed ? '✓' : unlocked ? '•' : '🔒'}
              </Text>
            </View>

            <Text style={styles.cardSubtitle}>{lesson.title}</Text>
            <Text style={styles.cardDescription}>{lesson.description}</Text>
            <Text style={styles.meta}>
              {lesson.category} • {lesson.duration} • {lesson.level}
            </Text>

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.progressText}>{percent}%</Text>
            </View>

            {!unlocked && (
              <Text style={styles.lockText}>Conclua a lição anterior para desbloquear.</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 18 },

  filterRow: { paddingBottom: 14, gap: 8 },
  filterChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: { color: colors.text, fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },

  card: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, padding: 16, marginBottom: 12
  },
  cardLocked: {
    opacity: 0.65
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 8 },
  statusIcon: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardSubtitle: { fontSize: 14, color: colors.textSoft, marginTop: 2, marginBottom: 8 },
  cardDescription: { color: colors.textSoft, lineHeight: 20, marginBottom: 8 },
  meta: { color: colors.primary, fontWeight: '700', marginBottom: 10 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  progressText: {
    width: 40,
    textAlign: 'right',
    color: colors.textSoft,
    fontWeight: '700',
  },
  lockText: {
    marginTop: 10,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
});

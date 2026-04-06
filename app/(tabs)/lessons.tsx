import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

import { colors } from '../../src/styles/theme';
import { useProgressData } from '../../src/hooks/useProgressData';
import { generateLesson, getAllLessons } from '../../src/services/lessonService';
import { deleteAiLesson } from '../../src/db/database';

const LEVEL_LABELS = ['Todos', 'Básico', 'Intermediário', 'Avançado'];

const QUICK_THEMES = [
  'Entrevista','Viagem','Restaurante','Trabalho','Compras',
  'Apresentação pessoal','Hotel','Aeroporto','Telefone','Reunião','Médico','Mercado',
];

function normalizeLevel(level) {
  const v = String(level || '').toLowerCase();
  if (v.includes('intermediate')) return 'Intermediário';
  if (v.includes('advanced')) return 'Avançado';
  return 'Básico';
}

export default function LessonsScreen() {
  const { progressMap } = useProgressData();

  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedTheme, setSelectedTheme] = useState('Entrevista');
  const [customTheme, setCustomTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const allLessons = useMemo(() => {
    return getAllLessons().map((l) => ({
      ...l,
      level: normalizeLevel(l.level),
      isAi: l.source === 'ai',
    }));
  }, [refreshKey]);

  const filteredLessons = useMemo(() => {
    if (selectedLevel === 'Todos') return allLessons;
    return allLessons.filter((l) => l.level === selectedLevel);
  }, [selectedLevel, allLessons]);

  const themeSuggestions = useMemo(() => {
    const q = customTheme.trim().toLowerCase();
    if (!q) return [];
    return QUICK_THEMES.filter((t) => t.toLowerCase().includes(q)).slice(0, 6);
  }, [customTheme]);

  const finalTheme = customTheme.trim() || selectedTheme;

  const handleGenerateLesson = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const levelMap = {
        Todos: 'basic',
        Básico: 'basic',
        Intermediário: 'intermediate',
        Avançado: 'advanced',
      };

      const newLesson = await generateLesson({
        level: levelMap[selectedLevel] || 'basic',
        theme: finalTheme,
      });

      setRefreshKey((prev) => prev + 1);
      setCustomTheme('');

      if (newLesson?.id) {
        setTimeout(() => {
          router.push(`/lesson/${newLesson.id}`);
        }, 100);
      }

    } catch (e) {
      console.log('[LESSONS ERROR]', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (lessonId) => {
    deleteAiLesson(lessonId);
    setRefreshKey((prev) => prev + 1);
  };

  const renderRightActions = (lesson) => {
    if (!lesson.isAi) return null;

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(lesson.id)}
      >
        <Text style={styles.deleteText}>Excluir</Text>
      </TouchableOpacity>
    );
  };

  const handleOpenLesson = (lesson) => {
    router.push(`/lesson/${lesson.id}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lições</Text>
      <Text style={styles.subtitle}>
        Gere lições com IA e pratique conversação real.
      </Text>

      {/* filtros nível */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {LEVEL_LABELS.map((level) => {
          const active = selectedLevel === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* temas */}
      <Text style={styles.sectionLabel}>Temas rápidos</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {QUICK_THEMES.map((theme) => {
          const active = selectedTheme === theme && !customTheme.trim();
          return (
            <TouchableOpacity
              key={theme}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                setSelectedTheme(theme);
                setCustomTheme('');
              }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {theme}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* input */}
      <Text style={styles.sectionLabel}>Ou digite seu tema</Text>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Ex: entrevista, viagem..."
          placeholderTextColor="#94a3b8"
          value={customTheme}
          onChangeText={setCustomTheme}
        />
      </View>

      {/* sugestões */}
      {themeSuggestions.length > 0 && (
        <View style={styles.suggestionWrap}>
          {themeSuggestions.map((theme) => (
            <TouchableOpacity
              key={theme}
              style={styles.suggestionChip}
              onPress={() => {
                setCustomTheme(theme);
                setSelectedTheme(theme);
              }}
            >
              <Text style={styles.suggestionChipText}>{theme}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* gerar */}
      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={handleGenerateLesson}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>
            Gerar lição: {finalTheme}
          </Text>
        )}
      </TouchableOpacity>

      {/* lista */}
      {filteredLessons.map((lesson) => {
        const state = progressMap[lesson.id] || {};
        const percent = state.progress || 0;
        const completed = !!state.completed;

        return (
          <Swipeable
            key={lesson.id}
            renderRightActions={() => renderRightActions(lesson)}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenLesson(lesson)}
            >
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{lesson.titlePt}</Text>
                <Text style={styles.statusIcon}>
                  {lesson.isAi ? 'AI' : completed ? '✓' : '•'}
                </Text>
              </View>

              <Text style={styles.cardSubtitle}>{lesson.title}</Text>
              <Text style={styles.cardDescription}>{lesson.description}</Text>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
            </TouchableOpacity>
          </Swipeable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },

  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textSoft, marginBottom: 16 },

  sectionLabel: { marginTop: 10, fontWeight: '800', color: colors.text },

  filterRow: { gap: 8, paddingBottom: 10 },

  filterChip: {
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
  },

  filterChipText: { fontWeight: '700', color: colors.text },
  filterChipTextActive: { color: '#fff' },

  inputCard: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },

  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  suggestionChip: {
    backgroundColor: colors.primarySoft,
    padding: 8,
    borderRadius: 999,
  },

  suggestionChipText: {
    color: colors.primary,
    fontWeight: '700',
  },

  generateButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#fff', fontWeight: '800' },

  card: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitle: { fontWeight: '800', color: colors.text },
  statusIcon: { fontWeight: '800', color: colors.primary },

  cardSubtitle: { color: colors.textSoft },
  cardDescription: { marginVertical: 6 },

  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 999,
  },

  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
  },

  deleteButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 12,
    marginTop: 10,
  },

  deleteText: {
    color: '#fff',
    fontWeight: '800',
  },
});

import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  resetDatabase,
  initDatabase,
  getAllLessonProgress,
  getLastLessonId,
  getStats,
  saveLessonProgress,
  getLessonProgress,
} from '../db/database';

export function useProgressData() {
  const [progressMap, setProgressMap] = useState({});
  const [lastLessonId, setLastLessonId] = useState(null);
  const [stats, setStats] = useState({
    completedLessons: 0,
    studiedMinutes: 0,
    reviewedMistakes: 0,
    streakDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    initDatabase();
    setProgressMap(getAllLessonProgress());
    setLastLessonId(getLastLessonId());
    setStats(getStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const updateLessonProgress = useCallback((lessonId, progress) => {
    saveLessonProgress(String(lessonId), progress);
    refresh();
  }, [refresh]);

  const readLessonProgress = useCallback((lessonId) => {
    return getLessonProgress(String(lessonId));
  }, []);

  const resetAllProgress = useCallback(() => {
    resetDatabase();
    refresh();
  }, [refresh]);

  return {
    loading,
    progressMap,
    lastLessonId,
    stats,
    refresh,
    updateLessonProgress,
    readLessonProgress,
    resetAllProgress,
  };
}

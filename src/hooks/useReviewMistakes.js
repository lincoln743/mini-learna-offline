import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  initDatabase,
  saveReviewMistake,
  getReviewMistakes,
  clearReviewMistakes,
} from '../db/database';

export function useReviewMistakes() {
  const [mistakes, setMistakes] = useState([]);

  const refresh = useCallback(() => {
    initDatabase();
    const rows = getReviewMistakes();
    setMistakes(rows);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addMistake = useCallback((payload) => {
    saveReviewMistake(payload);
    refresh();
  }, [refresh]);

  const clearAllMistakes = useCallback(() => {
    clearReviewMistakes();
    refresh();
  }, [refresh]);

  return {
    mistakes,
    refresh,
    addMistake,
    clearAllMistakes,
  };
}

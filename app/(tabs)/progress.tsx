import { Alert, Text, StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { colors } from '../../src/styles/theme';
import { useProgressData } from '../../src/hooks/useProgressData';

export default function ProgressScreen() {
  const { stats, resetAllProgress } = useProgressData();

  const isDev = __DEV__;

  const handleReset = () => {
    Alert.alert(
      'Reiniciar progresso',
      'Deseja reiniciar todo o progresso do app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => resetAllProgress(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progresso</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.value}>{stats.completedLessons}</Text>
          <Text style={styles.label}>Lições concluídas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>{stats.studiedMinutes}</Text>
          <Text style={styles.label}>Minutos estudados</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>{stats.reviewedMistakes}</Text>
          <Text style={styles.label}>Erros revisados</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>{stats.streakDays}</Text>
          <Text style={styles.label}>Dias seguidos</Text>
        </View>
      </View>

      {isDev && (
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset (DEV)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12
  },

  value: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  label: { color: colors.textSoft },

  resetButton: {
    marginTop: 10,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },

  resetButtonText: {
    color: '#fff',
    fontWeight: '800'
  }
});

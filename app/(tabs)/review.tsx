import { Alert, Text, StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { colors } from '../../src/styles/theme';
import { useReviewMistakes } from '../../src/hooks/useReviewMistakes';

export default function ReviewScreen() {
  const { mistakes, clearAllMistakes } = useReviewMistakes();

  const handleClear = () => {
    Alert.alert(
      'Limpar revisão',
      'Deseja apagar todos os erros salvos para revisão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => clearAllMistakes(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Revisão</Text>
      <Text style={styles.subtitle}>
        Aqui aparecem os erros reais salvos pelo Tutor.
      </Text>

      <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
        <Text style={styles.clearButtonText}>Limpar revisão</Text>
      </TouchableOpacity>

      {mistakes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhum erro salvo ainda</Text>
          <Text style={styles.emptyText}>
            Vá até o Tutor e teste frases com erro para popular esta tela.
          </Text>
        </View>
      ) : (
        mistakes.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.type}>{item.error_type || 'Geral'}</Text>

            <Text style={styles.label}>Original</Text>
            <Text style={styles.original}>{item.original_text}</Text>

            <Text style={styles.label}>Correção</Text>
            <Text style={styles.corrected}>{item.corrected_text}</Text>

            <Text style={styles.label}>Explicação</Text>
            <Text style={styles.text}>{item.explanation}</Text>

            <Text style={styles.label}>Exemplo</Text>
            <Text style={styles.text}>{item.example_text}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 18 },

  clearButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButtonText: {
    color: colors.text,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textSoft,
    lineHeight: 22,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12
  },
  type: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    marginBottom: 12
  },
  label: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  original: {
    color: colors.danger,
  },
  corrected: {
    color: colors.success,
    fontWeight: '700',
  },
  text: {
    color: colors.textSoft,
    lineHeight: 22,
  },
});

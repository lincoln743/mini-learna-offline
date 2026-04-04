import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/styles/theme';
import { getAiReply } from '../../src/services/aiService';
import { speakTutorText, stopTutorSpeech } from '../../src/services/ttsService';
import {
  canStartRecording,
  startRecording,
  stopRecording,
  finishProcessing,
  startSpeaking,
  stopSpeaking,
  resetVoiceState,
} from '../../src/services/voiceController';
import { useVoiceInput } from '../../src/hooks/useVoiceInput';
import { useReviewMistakes } from '../../src/hooks/useReviewMistakes';

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TutorScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const isHandlingRef = useRef(false);
  const { addMistake } = useReviewMistakes();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: makeId(),
      role: 'assistant',
      text: 'Hello! I am your English tutor. Start by introducing yourself.',
      correction: '',
      suggestion: '',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    resetVoiceState();
    return () => {
      resetVoiceState();
    };
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = async (rawText?: string) => {
    const trimmed = String(rawText ?? input).trim();
    if (!trimmed) return;
    if (isHandlingRef.current) return;

    isHandlingRef.current = true;

    try {
      Keyboard.dismiss();
      await stopTutorSpeech();

      const userMessage = {
        id: makeId(),
        role: 'user',
        text: trimmed,
      };

      let result;

      try {
        result = await getAiReply(trimmed);
      } catch (error) {
        console.log('[TUTOR] AI ERROR =', error);
        result = {
          reply: "Sorry, I couldn't respond.",
          correction: '',
          suggestion: '',
        };
      }

      const assistantMessage = {
        id: makeId(),
        role: 'assistant',
        text: result.reply,
        correction: result.correction,
        suggestion: result.suggestion,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput('');

      requestAnimationFrame(() => {
        scrollToBottom();
      });

      if (result.correction) {
        addMistake({
          originalText: trimmed,
          correctedText: result.correction,
          explanation:
            result.suggestion || 'Correction suggested during free conversation.',
          exampleText: result.reply,
          errorType: 'Conversa livre',
        });
      }

      finishProcessing();
      startSpeaking();

      await speakTutorText(result.reply, {
        onDone: () => {
          stopSpeaking();
        },
        onStopped: () => {
          stopSpeaking();
        },
        onError: () => {
          stopSpeaking();
        },
      });
    } finally {
      finishProcessing();
      isHandlingRef.current = false;
    }
  };

  const { isRecording, isTranscribing, toggleRecording } = useVoiceInput({
    onTranscript: async (text) => {
      await handleSend(text);
    },
  });

  const handleMicPress = async () => {
    if (isRecording) {
      stopRecording();
      await toggleRecording();
      return;
    }

    if (!canStartRecording()) return;

    await stopTutorSpeech();
    stopSpeaking();
    startRecording();
    await toggleRecording();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Conversa Livre</Text>
          <Text style={styles.subtitle}>
            Escreva ou fale em inglês. A resposta da IA aparece primeiro em texto.
          </Text>

          {isRecording && (
            <Text style={styles.voiceStatus}>🎤 Ouvindo...</Text>
          )}

          {isTranscribing && (
            <Text style={styles.voiceStatus}>⏳ Transcrevendo...</Text>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageRole,
                  message.role === 'user' ? styles.userRole : styles.assistantRole,
                ]}
              >
                {message.role === 'user' ? 'Você' : 'IA'}
              </Text>

              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {message.text}
              </Text>

              {message.role === 'assistant' && !!message.correction && (
                <View style={styles.metaBox}>
                  <Text style={styles.metaTitle}>Correção sugerida</Text>
                  <Text style={styles.metaText}>{message.correction}</Text>
                </View>
              )}

              {message.role === 'assistant' && !!message.suggestion && (
                <View style={styles.metaBox}>
                  <Text style={styles.metaTitle}>Dica</Text>
                  <Text style={styles.metaText}>{message.suggestion}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputShell}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={handleMicPress}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={22}
              color={isRecording ? '#fff' : colors.primary}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type in English..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="default"
          />

          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!canSend}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  subtitle: {
    color: colors.textSoft,
    lineHeight: 22,
  },

  voiceStatus: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSoft,
  },

  chatArea: {
    flex: 1,
    marginTop: 4,
  },

  chatContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  messageBubble: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    maxWidth: '92%',
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },

  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  messageRole: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },

  userRole: {
    color: '#dbeafe',
  },

  assistantRole: {
    color: colors.primary,
  },

  messageText: {
    lineHeight: 22,
    fontSize: 15,
  },

  userText: {
    color: '#fff',
  },

  assistantText: {
    color: colors.text,
  },

  metaBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
  },

  metaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },

  metaText: {
    color: colors.textSoft,
    lineHeight: 20,
  },

  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 10,
  },

  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  micButtonActive: {
    backgroundColor: colors.primary,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    color: colors.text,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },
});

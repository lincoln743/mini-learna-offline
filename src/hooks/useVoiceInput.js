import { useCallback, useRef, useState } from 'react';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { transcribeAudioAsync } from '../services/sttService';

export function useVoiceInput({ onTranscript }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const startedAtRef = useRef(0);
  const isBusyRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const resetAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (error) {
      console.log('[VOICE] resetAudioMode error =', error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isBusyRef.current || isRecording || isTranscribing) return;

    isBusyRef.current = true;

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Permissão do microfone negada.');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      startedAtRef.current = Date.now();
      setIsRecording(true);

      console.log('[VOICE] gravação iniciada');
    } catch (error) {
      console.log('[VOICE] startRecording error =', error);
      await resetAudioMode();
      throw error;
    } finally {
      isBusyRef.current = false;
    }
  }, [isRecording, isTranscribing, recorder, resetAudioMode]);

  const stopRecording = useCallback(async () => {
    if (isBusyRef.current || !isRecording) return null;

    isBusyRef.current = true;
    setIsRecording(false);

    try {
      await recorder.stop();

      const elapsedMs = Date.now() - startedAtRef.current;
      const audioUri = recorder.uri;

      console.log('[VOICE] gravação finalizada, ms =', elapsedMs);
      console.log('[VOICE] gravação finalizada, uri =', audioUri);

      await resetAudioMode();

      if (elapsedMs < 700) {
        console.log('[VOICE] gravação descartada: muito curta');
        return null;
      }

      if (!audioUri) {
        console.log('[VOICE] gravação descartada: sem uri');
        return null;
      }

      setIsTranscribing(true);

      const transcript = await transcribeAudioAsync(audioUri);
      console.log('[VOICE] transcript =', transcript);

      if (onTranscript && transcript && String(transcript).trim()) {
        await onTranscript(transcript);
      }

      return transcript;
    } catch (error) {
      console.log('[VOICE] stopRecording error =', error);
      return null;
    } finally {
      setIsTranscribing(false);
      await resetAudioMode();
      isBusyRef.current = false;
    }
  }, [isRecording, onTranscript, recorder, resetAudioMode]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      return await stopRecording();
    }

    return await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    toggleRecording,
  };
}

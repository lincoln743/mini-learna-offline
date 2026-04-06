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
  const isTranscribingRef = useRef(false);

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
    if (isBusyRef.current || isRecording || isTranscribingRef.current) {
      console.log('[VOICE] start blocked');
      return;
    }

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
    } finally {
      isBusyRef.current = false;
    }
  }, [isRecording, recorder, resetAudioMode]);

  const stopRecording = useCallback(async () => {
    if (isBusyRef.current || !isRecording) {
      console.log('[VOICE] stop blocked');
      return null;
    }

    isBusyRef.current = true;
    setIsRecording(false);

    try {
      await recorder.stop();

      const elapsedMs = Date.now() - startedAtRef.current;
      const audioUri = recorder.uri;

      console.log('[VOICE] gravação finalizada, ms =', elapsedMs);

      await resetAudioMode();

      if (elapsedMs < 800) {
        console.log('[VOICE] ignorado: áudio muito curto');
        return null;
      }

      if (!audioUri) {
        console.log('[VOICE] ignorado: sem uri');
        return null;
      }

      if (isTranscribingRef.current) {
        console.log('[VOICE] já transcrevendo, ignorando');
        return null;
      }

      isTranscribingRef.current = true;
      setIsTranscribing(true);

      const transcript = await transcribeAudioAsync(audioUri);

      console.log('[VOICE] transcript =', transcript);

      if (onTranscript && transcript && transcript.trim()) {
        await onTranscript(transcript);
      }

      return transcript;
    } catch (error) {
      console.log('[VOICE] stopRecording error =', error);
      return null;
    } finally {
      isTranscribingRef.current = false;
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

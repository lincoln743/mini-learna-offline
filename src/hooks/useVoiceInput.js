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

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const startRecording = useCallback(async () => {
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
    console.log('[VOICE] gravação iniciada');
    setIsRecording(true);
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return null;

    setIsRecording(false);

    try {
      await recorder.stop();

      const elapsedMs = Date.now() - startedAtRef.current;
      const audioUri = recorder.uri;

      console.log('[VOICE] gravação finalizada, ms =', elapsedMs);
      console.log('[VOICE] gravação finalizada, uri =', audioUri);

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (elapsedMs < 1200) {
        throw new Error('Gravação muito curta. Fale por mais tempo.');
      }

      if (!audioUri) {
        throw new Error('Não foi possível obter o arquivo gravado.');
      }

      setIsTranscribing(true);

      const transcript = await transcribeAudioAsync(audioUri);
      console.log('[VOICE] transcript =', transcript);

      if (onTranscript) {
        await onTranscript(transcript);
      }

      return transcript;
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, onTranscript, recorder]);

  const toggleRecording = useCallback(async () => {
    return isRecording ? stopRecording() : startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    toggleRecording,
  };
}

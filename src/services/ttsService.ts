import * as Speech from 'expo-speech';

let selectedVoice: string | null = null;
let voiceLoaded = false;

type SpeakCallbacks = {
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error?: unknown) => void;
};

async function ensureBestVoice() {
  if (voiceLoaded) return;
  voiceLoaded = true;

  try {
    const voices = await Speech.getAvailableVoicesAsync();

    const englishVoices = voices.filter(
      (voice) =>
        voice.language?.toLowerCase().startsWith('en-us') ||
        voice.language?.toLowerCase().startsWith('en')
    );

    const enhancedVoice =
      englishVoices.find((voice) => voice.quality === 'Enhanced') ||
      englishVoices[0];

    selectedVoice = enhancedVoice?.identifier ?? null;

    console.log(
      'TTS selected voice:',
      enhancedVoice?.name,
      enhancedVoice?.language,
      enhancedVoice?.quality
    );
  } catch (error) {
    console.log('TTS VOICE LOAD ERROR:', error);
  }
}

export async function speakTutorText(text: string, callbacks: SpeakCallbacks = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    callbacks.onStopped?.();
    return;
  }

  try {
    await ensureBestVoice();
    await Speech.stop();

    Speech.speak(cleanText, {
      language: 'en-US',
      voice: selectedVoice || undefined,
      rate: 0.88,
      pitch: 1.0,
      volume: 1.0,
      onStart: () => {
        console.log('TTS START');
        callbacks.onStart?.();
      },
      onDone: () => {
        console.log('TTS DONE');
        callbacks.onDone?.();
      },
      onStopped: () => {
        console.log('TTS STOPPED');
        callbacks.onStopped?.();
      },
      onError: (error) => {
        console.log('TTS ERROR:', error);
        callbacks.onError?.(error);
        callbacks.onStopped?.();
      },
    });
  } catch (error) {
    console.log('TTS ERROR:', error);
    callbacks.onError?.(error);
    callbacks.onStopped?.();
  }
}

export async function stopTutorSpeech() {
  try {
    await Speech.stop();
  } catch (error) {
    console.log('TTS STOP ERROR:', error);
  }
}

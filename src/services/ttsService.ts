import * as Speech from 'expo-speech';

export function speakTutorText(text: string) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  try {
    Speech.stop();
    Speech.speak(cleanText, {
      language: 'en-US',
      rate: 0.95,
      pitch: 1.0,
    });
  } catch (error) {
    console.log('TTS ERROR:', error);
  }
}

export function stopTutorSpeech() {
  try {
    Speech.stop();
  } catch (error) {
    console.log('TTS STOP ERROR:', error);
  }
}

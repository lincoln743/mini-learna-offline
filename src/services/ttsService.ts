import * as Speech from 'expo-speech';

let selectedVoice: string | null = null;
let voiceLoaded = false;

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

    console.log('TTS selected voice:', enhancedVoice?.name, enhancedVoice?.language, enhancedVoice?.quality);
  } catch (error) {
    console.log('TTS VOICE LOAD ERROR:', error);
  }
}

export async function speakTutorText(text: string) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  try {
    await ensureBestVoice();
    await Speech.stop();

    Speech.speak(cleanText, {
      language: 'en-US',
      voice: selectedVoice || undefined,
      rate: 0.88,
      pitch: 1.0,
      volume: 1.0,
    });
  } catch (error) {
    console.log('TTS ERROR:', error);
  }
}

export async function stopTutorSpeech() {
  try {
    await Speech.stop();
  } catch (error) {
    console.log('TTS STOP ERROR:', error);
  }
}

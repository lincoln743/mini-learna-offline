let isRecording = false;
let isProcessing = false;
let isSpeaking = false;

export function canStartRecording() {
  return !isRecording && !isProcessing && !isSpeaking;
}

export function startRecording() {
  isRecording = true;
  isProcessing = false;
  isSpeaking = false;
  console.log('[VOICE CTRL] startRecording');
}

export function stopRecording() {
  isRecording = false;
  isProcessing = true;
  console.log('[VOICE CTRL] stopRecording -> processing');
}

export function finishProcessing() {
  isProcessing = false;
  console.log('[VOICE CTRL] finishProcessing');
}

export function startSpeaking() {
  isSpeaking = true;
  isProcessing = false;
  console.log('[VOICE CTRL] startSpeaking');
}

export function stopSpeaking() {
  isSpeaking = false;
  console.log('[VOICE CTRL] stopSpeaking');
}

export function resetVoiceState() {
  isRecording = false;
  isProcessing = false;
  isSpeaking = false;
  console.log('[VOICE CTRL] resetVoiceState');
}

export function getVoiceState() {
  return {
    isRecording,
    isProcessing,
    isSpeaking,
  };
}

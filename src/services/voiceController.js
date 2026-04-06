let state = 'idle'; 
// idle | recording | processing | speaking

export function canStartRecording() {
  return state === 'idle';
}

export function startRecording() {
  if (state !== 'idle') {
    console.log('[VOICE CTRL] startRecording BLOCKED:', state);
    return false;
  }

  state = 'recording';
  console.log('[VOICE CTRL] state = recording');
  return true;
}

export function stopRecording() {
  if (state !== 'recording') {
    console.log('[VOICE CTRL] stopRecording BLOCKED:', state);
    return false;
  }

  state = 'processing';
  console.log('[VOICE CTRL] state = processing');
  return true;
}

export function finishProcessing() {
  if (state !== 'processing') return;

  state = 'idle';
  console.log('[VOICE CTRL] state = idle (after processing)');
}

export function startSpeaking() {
  if (state !== 'idle') {
    console.log('[VOICE CTRL] startSpeaking BLOCKED:', state);
    return false;
  }

  state = 'speaking';
  console.log('[VOICE CTRL] state = speaking');
  return true;
}

export function stopSpeaking() {
  if (state !== 'speaking') return;

  state = 'idle';
  console.log('[VOICE CTRL] state = idle (after speaking)');
}

export function resetVoiceState() {
  state = 'idle';
  console.log('[VOICE CTRL] RESET -> idle');
}

export function getVoiceState() {
  return {
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    isSpeaking: state === 'speaking',
    state,
  };
}

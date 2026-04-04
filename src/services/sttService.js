const STT_URL =
  process.env.EXPO_PUBLIC_STT_URL || 'http://192.168.0.200:8000/stt';

export async function transcribeAudioAsync(audioUri) {
  if (!audioUri) {
    throw new Error('Áudio não encontrado.');
  }

  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: `recording-${Date.now()}.m4a`,
    type: 'audio/m4a',
  });

  const response = await fetch(STT_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'Falha ao transcrever áudio.');
  }

  const text = String(data.text || '').trim();

  if (!text) {
    throw new Error('Nenhum texto retornado pelo STT.');
  }

  return text;
}

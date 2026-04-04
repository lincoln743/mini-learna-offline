const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL || 'http://192.168.0.200:8000/chat';

export async function getAiReply(userText) {
  const text = String(userText || '').trim();

  if (!text) {
    return {
      reply: 'Hello! Tell me something about your day.',
      correction: '',
      suggestion: '',
    };
  }

  const response = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'Falha ao obter resposta da IA.');
  }

  return {
    reply: String(data.reply || '').trim(),
    correction: String(data.correction || '').trim(),
    suggestion: String(data.suggestion || '').trim(),
  };
}

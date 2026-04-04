const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL || 'http://192.168.0.200:8000/chat';

export async function getAiReply(userText) {
  const text = String(userText || '').trim();

  console.log('[AI] URL =', AI_URL);
  console.log('[AI] INPUT =', text);

  if (!text) {
    return {
      reply: 'Hello! Tell me something about your day.',
      correction: '',
      suggestion: '',
    };
  }

  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json().catch(() => ({}));

    console.log('[AI] STATUS =', response.status);
    console.log('[AI] DATA =', JSON.stringify(data));

    if (!response.ok || data.ok === false) {
      throw new Error(
        typeof data.error === 'string'
          ? data.error
          : JSON.stringify(data.error || 'Falha ao obter resposta da IA.')
      );
    }

    return {
      reply: String(data.reply || '').trim(),
      correction: String(data.correction || '').trim(),
      suggestion: String(data.suggestion || '').trim(),
    };
  } catch (error) {
    console.log('[AI] ERROR =', error);

    return {
      reply: "Sorry, I couldn't respond.",
      correction: '',
      suggestion: '',
    };
  }
}

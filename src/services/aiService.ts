export async function getAiReply(userText: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an English tutor. Always respond in simple English. Keep answers short and conversational.',
          },
          {
            role: 'user',
            content: userText,
          },
        ],
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      'Sorry, I could not respond.';

    return {
      reply,
      correction: '',
      suggestion: '',
    };
  } catch (error) {
    console.log('AI ERROR:', error);
    return {
      reply: 'Error connecting to AI.',
      correction: '',
      suggestion: '',
    };
  }
}

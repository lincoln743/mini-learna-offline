export function getCorrection(text) {
  const input = String(text || '').trim();
  if (!input) return null;

  const lower = input.toLowerCase();

  if (lower === 'she go to work every day' || lower === 'she go to work every day.') {
    return {
      corrected: 'She goes to work every day.',
      explanation: 'Com she/he/it no presente simples, o verbo normalmente recebe "s".',
      example: 'He works at the hospital every day.',
      errorType: 'Presente simples',
      shouldSave: true,
    };
  }

  if (lower === 'i go to work yesterday' || lower === 'i go to work yesterday.') {
    return {
      corrected: 'I went to work yesterday.',
      explanation: 'Quando usamos "yesterday", o verbo deve ficar no passado.',
      example: 'I went to school yesterday.',
      errorType: 'Passado',
      shouldSave: true,
    };
  }

  return {
    corrected: input,
    explanation: 'Boa frase. Em breve vamos adicionar correções mais avançadas.',
    example: 'Try another sentence to practice more.',
    errorType: 'Geral',
    shouldSave: false,
  };
}

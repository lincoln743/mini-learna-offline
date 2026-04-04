export function buildAiReply(userText) {
  const input = String(userText || '').trim();

  if (!input) {
    return {
      reply: "Hello! Tell me something about your day.",
      correction: "",
      suggestion: ""
    };
  }

  const lower = input.toLowerCase();

  if (lower.includes('my name is')) {
    return {
      reply: "Nice to meet you. Where are you from?",
      correction: "",
      suggestion: "You can also say: I am from Brazil."
    };
  }

  if (lower.includes('i am from') || lower.includes("i'm from")) {
    return {
      reply: "Very good. What do you do for work?",
      correction: "",
      suggestion: "You can also say: I work as a technician."
    };
  }

  if (lower === 'she go to work every day' || lower === 'she go to work every day.') {
    return {
      reply: "Good try. The correct form is: She goes to work every day. Can you make another sentence with 'she'?",
      correction: "She goes to work every day.",
      suggestion: "Use 'goes' with she/he/it."
    };
  }

  if (lower === 'i go to work yesterday' || lower === 'i go to work yesterday.') {
    return {
      reply: "Almost correct. The better sentence is: I went to work yesterday. Now tell me what you did this morning.",
      correction: "I went to work yesterday.",
      suggestion: "Use the past form 'went' with yesterday."
    };
  }

  return {
    reply: "Good. Tell me more about that in English.",
    correction: "",
    suggestion: "Try using a longer sentence."
  };
}

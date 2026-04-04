import { getAiReply } from './src/services/aiService.js';

(async () => {
  const res = await getAiReply('Hello, my name is Lincoln');
  console.log(res);
})();

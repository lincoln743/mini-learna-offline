# Mini Learna Offline

## Overview
Mini Learna Offline is a mobile app built with React Native (Expo) that enables real-time English conversation practice using:

- 🎤 Speech-to-Text (Whisper local)
- 🤖 Local AI (Ollama)
- 🔊 Text-to-Speech (Expo Speech)

The app works with a local backend for privacy and low latency.

---

## Features

- Voice conversation with AI
- Real-time transcription (STT)
- AI tutor responses
- Audio playback (TTS)
- Short-term conversation memory
- Offline-first architecture

---

## Tech Stack

### Frontend
- React Native (Expo SDK 54)
- Expo Router

### Backend
- FastAPI (Python)
- faster-whisper (STT)
- Ollama (LLM)

---

## Project Structure

```
mini-learna-offline/
├── app/(tabs)/tutor.tsx
├── src/services/
│   ├── aiService.js
│   ├── sttService.js
│   └── ttsService.ts
├── src/hooks/useVoiceInput.js
├── stt-local/server.py
```

---

## Setup

### 1. Clone repo
```bash
git clone https://github.com/lincoln743/mini-learna-offline
cd mini-learna-offline
```

### 2. Backend
```bash
cd stt-local
python3 -m venv .venv
source .venv/bin/activate
pip install requests
pip install -r requirements.txt
```

### 3. Run backend
```bash
OLLAMA_MODEL=qwen2.5:0.5b python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

### 4. Frontend
```bash
cd ..
npx expo start
```

---

## Notes

- Make sure Ollama is running locally
- Ensure phone and backend are on same network
- Update API URL if needed in services

---

## Status

- Voice flow working (STT → AI → TTS)
- Conversation memory active
- Performance optimized (~5–8s response)

---

## Roadmap

- Continuous conversation mode
- Better AI models
- APK build
- UI refinements

---

## Author

Lincoln Pereira

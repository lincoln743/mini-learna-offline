# 📱 Mini Learna Offline

Aplicativo mobile para aprendizado de inglês com interação por chat e voz, desenvolvido com React Native (Expo) e STT local usando Whisper.

---

## 🚀 Visão Geral

O **Mini Learna** é um app estilo tutor de inglês com foco em:

- Conversação livre com IA
- Correção automática de frases
- Revisão de erros
- Lições com progresso local
- Entrada por voz com transcrição (Speech-to-Text)

---

## 🧠 Funcionalidades

### 💬 Conversa Livre
- Chat com IA (conversationEngine)
- Correção de frases em inglês
- Sugestões de melhoria

### 🎤 Voz (STT)
- Gravação direto no app
- Transcrição com Whisper local (Python)
- Integração automática com o chat

### 📊 Revisão de Erros
- Histórico de correções
- Aprendizado baseado em erros do usuário

### 📚 Lições
- Progresso salvo localmente (SQLite)
- Estrutura modular para expansão

---

## 🏗️ Arquitetura

mini-learna-offline/
├── app/ (Expo)
├── src/
├── stt-local/
└── README.md

---

## ⚙️ Tecnologias

Frontend:
- React Native
- Expo SDK 54
- SQLite

Backend:
- Python
- FastAPI
- Faster-Whisper
- FFmpeg

---

## ▶️ Como rodar

```bash
git clone https://github.com/lincoln743/mini-learna-offline.git
cd mini-learna-offline
npm install
npx expo start
```

STT:

```bash
cd stt-local
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
WHISPER_MODEL=small python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## 🧪 Status

✔ Funcional  
🚧 Em evolução (TTS, performance)

---

## 👨‍💻 Autor

Lincoln Pereira

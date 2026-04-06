import json
import os
import shutil
import subprocess
import tempfile
import threading
import time

import requests
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

from services.conversation_memory import memory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
CPU_THREADS = int(os.getenv("WHISPER_CPU_THREADS", "4"))

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")

print(f"[STT] carregando modelo whisper: {MODEL_SIZE} ({COMPUTE_TYPE})")
model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type=COMPUTE_TYPE,
    cpu_threads=CPU_THREADS,
)


def convert_audio_for_whisper(input_path: str) -> str:
    fd, output_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "pcm_s16le",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"Falha no ffmpeg: {result.stderr}")

    return output_path


def extract_json_block(text: str):
    text = (text or "").strip()
    if not text:
        return None

    cleaned = text
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    if cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            return None

    return None


def build_tutor_messages(user_text: str, session_id: str):
    history = memory.get_messages(session_id)[-4:]

    return [
        {
            "role": "system",
            "content": """You are a friendly English tutor for Brazilian learners.

Return valid JSON only:
{"reply":"...","correction":"...","suggestion":"..."}

Rules:
- Answer only from the user's last message
- Keep the same topic
- Keep reply short and natural
- Ask at most one short follow-up question
- Do not repeat the user's sentence
- correction only if really needed
- suggestion very short or empty
- never write anything outside JSON"""
        },
        *history,
        {
            "role": "user",
            "content": user_text,
        }
    ]


def build_lesson_messages(user_text: str):
    return [
        {
            "role": "system",
            "content": """You create very short English lessons for Brazilian learners.

Return ONLY one valid JSON object:
{
  "title":"...",
  "titlePt":"...",
  "description":"...",
  "steps":[
    {
      "type":"multiple_choice",
      "question":"...",
      "options":["...","...","..."],
      "correctIndex":0
    },
    {
      "type":"speak",
      "prompt":"..."
    }
  ]
}

Rules:
- Output JSON only
- No markdown
- No extra explanation
- Keep description very short
- Exactly 2 steps"""
        },
        {
            "role": "user",
            "content": user_text,
        }
    ]


def warmup_ollama():
    try:
        body = {
            "model": OLLAMA_MODEL,
            "stream": False,
            "keep_alive": -1,
            "options": {
                "num_predict": 12,
                "temperature": 0.2,
                "top_p": 0.9,
                "num_ctx": 512,
            },
            "messages": [
                {
                    "role": "system",
                    "content": 'Return valid JSON only: {"reply":"Hello! What do you like to do in your free time?","correction":"","suggestion":""}'
                },
                {
                    "role": "user",
                    "content": "Start a conversation with me"
                },
            ],
        }
        requests.post(OLLAMA_URL, json=body, timeout=45)
        print(f"[AI] warmup ok: {OLLAMA_MODEL}")
    except Exception as e:
        print(f"[AI] warmup falhou: {e}")


@app.on_event("startup")
def startup_event():
    threading.Thread(target=warmup_ollama, daemon=True).start()


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_SIZE,
        "compute_type": COMPUTE_TYPE,
        "ollama_model": OLLAMA_MODEL,
    }


@app.post("/chat")
async def chat(payload: dict):
    started_at = time.time()

    user_text = str(payload.get("text") or "").strip()
    session_id = str(payload.get("session_id") or "default").strip() or "default"

    if not user_text:
        return {"ok": False, "error": "Texto vazio."}

    try:
        is_lesson_request = (
            "Create a very short English lesson" in user_text
            or "Create a short English lesson" in user_text
        )

        if is_lesson_request:
            body = {
                "model": OLLAMA_MODEL,
                "stream": False,
                "keep_alive": -1,
                "options": {
                    "num_predict": 220,
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "num_ctx": 1024,
                    "repeat_penalty": 1.1,
                },
                "messages": build_lesson_messages(user_text),
            }
        else:
            body = {
                "model": OLLAMA_MODEL,
                "stream": False,
                "keep_alive": -1,
                "options": {
                    "num_predict": 48,
                    "temperature": 0.25,
                    "top_p": 0.9,
                    "num_ctx": 768,
                    "repeat_penalty": 1.12,
                },
                "messages": build_tutor_messages(user_text, session_id),
            }

        response = requests.post(OLLAMA_URL, json=body, timeout=90)

        try:
            data = response.json()
        except Exception:
            data = {"error": response.text}

        if not response.ok:
            return {"ok": False, "error": data}

        raw_reply = (
            data.get("message", {}).get("content", "").strip()
            if isinstance(data, dict)
            else ""
        )

        if is_lesson_request:
            parsed_lesson = extract_json_block(raw_reply)
            if not parsed_lesson:
                return {"ok": False, "error": "Ollama não retornou lição válida."}

            elapsed = round(time.time() - started_at, 2)
            print(f"[CHAT] lesson ok in {elapsed}s")

            return {
                "ok": True,
                "reply": json.dumps(parsed_lesson, ensure_ascii=False),
                "correction": "",
                "suggestion": "",
            }

        parsed = extract_json_block(raw_reply)

        if parsed:
            reply = str(parsed.get("reply") or "").strip()
            correction = str(parsed.get("correction") or "").strip()
            suggestion = str(parsed.get("suggestion") or "").strip()
        else:
            reply = raw_reply.strip()
            correction = ""
            suggestion = ""

        if not reply:
            return {"ok": False, "error": "Ollama não retornou resposta."}

        memory.add_user_message(session_id, user_text)
        memory.add_assistant_message(session_id, reply)

        elapsed = round(time.time() - started_at, 2)
        print(f"[CHAT] ok in {elapsed}s")

        return {
            "ok": True,
            "reply": reply,
            "correction": correction,
            "suggestion": suggestion,
        }

    except Exception as e:
        elapsed = round(time.time() - started_at, 2)
        print(f"[CHAT] erro after {elapsed}s: {e}")
        return {"ok": False, "error": str(e)}


@app.post("/chat/clear")
async def clear_chat(payload: dict = None):
    payload = payload or {}
    session_id = str(payload.get("session_id") or "default").strip() or "default"
    memory.clear(session_id)
    return {"ok": True, "session_id": session_id}


@app.post("/stt")
async def stt(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        raw_path = temp_file.name
        shutil.copyfileobj(audio.file, temp_file)

    wav_path = None

    try:
        raw_size = os.path.getsize(raw_path)

        print("\n[STT] ===============================")
        print(f"[STT] filename: {audio.filename}")
        print(f"[STT] content_type: {audio.content_type}")
        print(f"[STT] raw_path: {raw_path}")
        print(f"[STT] raw_size: {raw_size} bytes")

        wav_path = convert_audio_for_whisper(raw_path)
        wav_size = os.path.getsize(wav_path)

        print(f"[STT] wav_path: {wav_path}")
        print(f"[STT] wav_size: {wav_size} bytes")

        segments, info = model.transcribe(
            wav_path,
            task="transcribe",
            language="en",
            beam_size=1,
            best_of=1,
            temperature=0.0,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        texts = []
        for segment in segments:
            t = segment.text.strip()
            if t:
                texts.append(t)
                print(f"[STT] segmento: {t}")

        final_text = " ".join(texts).strip()

        print(f"[STT] detected_language: {getattr(info, 'language', None)}")
        print(f"[STT] final_text: {final_text!r}")

        if not final_text:
            return {
                "ok": False,
                "error": "Nenhuma fala detectada. Fale mais perto do microfone por 4 a 6 segundos."
            }

        return {
            "ok": True,
            "text": final_text,
            "language": getattr(info, "language", None)
        }

    except Exception as e:
        print(f"[STT] erro: {e}")
        return {"ok": False, "error": str(e)}

    finally:
        for path in [raw_path, wav_path]:
            if path and os.path.exists(path):
                os.remove(path)

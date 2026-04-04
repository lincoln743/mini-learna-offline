import os
import shutil
import subprocess
import tempfile

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

print(f"[STT] carregando modelo whisper: {MODEL_SIZE} ({COMPUTE_TYPE})")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type=COMPUTE_TYPE)

def convert_audio_for_whisper(input_path: str) -> str:
    fd, output_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        "-af", "volume=3.0",
        "-c:a", "pcm_s16le",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"Falha no ffmpeg: {result.stderr}")

    return output_path

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_SIZE}

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
            beam_size=5,
            best_of=5,
            temperature=0.0,
            vad_filter=False,
            condition_on_previous_text=False,
            language="en"
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

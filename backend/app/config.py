import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT.parent / ".env")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma4:e2b")
MODEL_TIMEOUT = float(os.getenv("MODEL_TIMEOUT", "180"))
# Vercel functions can only write to /tmp (ephemeral, per instance).
DB_PATH = Path(os.getenv("DB_PATH") or ("/tmp/vivabridge.db" if os.getenv("VERCEL") else ROOT / "vivabridge.db"))
PROMPTS_DIR = ROOT / "app" / "prompts"
QUESTION_BANK_DIR = ROOT / "data" / "question_bank"

"""Phase-1 check: does the model return valid structured JSON, and how fast?"""
import json, os, sys, time
import httpx

URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = sys.argv[1] if len(sys.argv) > 1 else os.getenv("MODEL_NAME", "gemma4:e4b")

schema = {
    "type": "object",
    "properties": {
        "simple": {"type": "string"},
        "analogy": {"type": "string"},
        "technical_definition": {"type": "string"},
        "check_question": {"type": "string"},
    },
    "required": ["simple", "analogy", "technical_definition", "check_question"],
}

t = time.time()
r = httpx.post(f"{URL}/api/chat", timeout=300, json={
    "model": MODEL, "stream": False, "format": schema, "think": False,
    "options": {"temperature": 0.2},
    "messages": [{"role": "user", "content": "Explain 'nonce in computer security' to a university student. Return JSON."}],
})
r.raise_for_status()
content = r.json()["message"]["content"]
data = json.loads(content)
print(json.dumps(data, indent=2))
print(f"\nOK {MODEL} in {time.time() - t:.1f}s")

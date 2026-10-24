"""Voice interview: Vapi handles speech; Gemma (through Ollama) is the examiner's brain."""
import json
import time
from collections.abc import AsyncIterator

import httpx

from . import viva_service
from .config import MODEL_NAME, MODEL_TIMEOUT, OLLAMA_URL
from .model_client import render
from .question_bank import concept_meaning, get_question, get_subject
from .schemas import VivaStartRequest


def start(subject: str) -> dict:
    session = viva_service.start(VivaStartRequest(subject=subject))
    seed = get_question(session.question_id)
    system_prompt = render("interviewer", {
        "subject": get_subject(subject)["title"],
        "seed_question": seed.text,
        "concepts": "\n".join(f"- {cid}: {concept_meaning(cid)}" for cid in seed.concept_ids),
        "rubric_notes": seed.rubric_notes,
    })
    first_message = f"Hello, welcome to your viva. Let's begin. {seed.text}"
    return {
        "session_id": session.session_id,
        "question": seed.text,
        "system_prompt": system_prompt,
        "first_message": first_message,
    }


def _text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(p.get("text", "") for p in content if isinstance(p, dict))
    return ""


def _chunk(cid: str, delta: dict, finish: str | None = None) -> str:
    payload = {
        "id": cid,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": MODEL_NAME,
        "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
    }
    return f"data: {json.dumps(payload)}\n\n"


async def stream_completion(body: dict) -> AsyncIterator[str]:
    """Translate an OpenAI-style streaming request (from Vapi) into an Ollama /api/chat stream."""
    messages = [
        {"role": m["role"], "content": _text(m.get("content"))}
        for m in body.get("messages", [])
        if m.get("role") in ("system", "user", "assistant") and _text(m.get("content"))
    ]
    cid = f"chatcmpl-{int(time.time() * 1000)}"
    yield _chunk(cid, {"role": "assistant", "content": ""})
    async with httpx.AsyncClient(timeout=MODEL_TIMEOUT) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json={
            "model": MODEL_NAME,
            "stream": True,
            "think": False,
            "keep_alive": "30m",
            "messages": messages,
            "options": {"temperature": 0.4, "num_predict": 120},
        }) as r:
            async for line in r.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                piece = data.get("message", {}).get("content", "")
                if piece:
                    yield _chunk(cid, {"content": piece})
                if data.get("done"):
                    break
    yield _chunk(cid, {}, "stop")
    yield "data: [DONE]\n\n"

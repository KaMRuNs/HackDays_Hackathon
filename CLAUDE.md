# CLAUDE.md — VivaBridge

VivaBridge is an AI study coach for lab vivas: Learn → Prove → Diagnose → Repair → Verify. It was built solo for the IIUC Hackathon (ML Bangladesh / MLH). Full design: [ARCHITECTURE.md](ARCHITECTURE.md).

## Hard rules (hackathon, any violation can disqualify the project)
- **Open-source models only**, through Ollama. Never add OpenAI, Gemini API, Claude API or any other closed model API to app code.
- **No hardcoded AI output.** Never fake model responses, scores or feedback, even as a fallback. On failure, show an error.
- **No real student data.** The question bank and examples are made-up sample data.
- **Never commit** `.env` files, secrets or model weights. Link to models instead.
- Keep the code small and explainable. The author must be able to explain every line to the judges.
- Commit every 30–45 min with descriptive messages.

## Run
```bash
# model (verify the exact tag first: ollama list / ollama.com/library)
ollama pull gemma4:e2b        # default (e4b is ~115 s/call on CPU, too slow)
python backend/scripts/smoke_model.py

# backend
cd backend && pip install -e . && uvicorn app.main:app --reload --port 8000

# frontend
cd frontend && npm install && npm run dev   # http://localhost:5173, proxies /api -> :8000
```
Env vars (see `.env.example`): `OLLAMA_URL`, `MODEL_NAME`, `MODEL_TIMEOUT`.

## Conventions
- **Every model call goes through `backend/app/model_client.py`** (`chat_json`). Never call Ollama directly from anywhere else.
- Prompts live in `backend/app/prompts/*.md`, never inline strings.
- Every LLM output has a Pydantic schema in `schemas.py`, enforced with Ollama structured output.
- **Python owns the numbers and the state.** It clamps rubric scores, computes totals and updates gap status. The model never sums scores or decides that a gap is resolved.
- Grading calls always include the stored seed question, its concept IDs, the rubric notes, the answer and the previous turn.
- A gap moves `open → practiced` only on a correct Learn check, and to `resolved` only when demonstrated on an **unseen** viva question.
- Plain `sqlite3`, no ORM. Plain `fetch` in `frontend/src/api/client.ts`, no state library.
- UI and model output are in English only. Tailwind theme tokens: `primary`, `accent`, `lavender`, `ink`. Font: Poppins.
- Build the end-to-end path first and polish after. If time runs short, cut the Gaps page before cutting the loop.

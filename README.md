# VivaBridge

**Understand it. Explain it. Defend it.** An AI study coach that helps university students prepare for lab vivas by turning their mistakes into targeted practice.

## The problem
Before a lab viva, students in courses like Computer Networks memorize answers from seniors' notes or PDFs. In the viva, one follow-up question ("*why* is the final ACK needed?") exposes that they memorized instead of understanding. Today they practise with friends, if they can find one, and nobody tells them *which* concept they are actually missing.

## The solution
VivaBridge runs a closed learning loop:
1. **Learn**: get a concept explained simply, with an analogy, a technical definition and a quick check question.
2. **Prove**: answer a mock viva question in your own words and face follow-up questions.
3. **Diagnose**: get a rubric-based score (core concepts, correctness, reasoning, clarity), with evidence quoted from your answer and a list of missing concepts.
4. **Repair**: click a missing concept to have it re-explained using a different teaching strategy.
5. **Verify**: retry with a *new* question that covers the same concept. A gap is resolved only when you demonstrate it again.

## How it works
- **Model:** [Gemma 4 E2B](https://ollama.com/library/gemma4) (`gemma4:e2b`, open-weight) via [Ollama](https://ollama.com), with structured JSON output. On a CPU laptop, `gemma4:e4b` took about 115 s per call versus about 30–60 s for E2B, so E2B is the default. Set `MODEL_NAME` to switch.
- **Backend:** Python, FastAPI, Pydantic, SQLite
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, lucide-react
- **Dataset:** a hand-written sample Computer Networks question bank with concept IDs and rubric notes (`backend/data/question_bank/`). It contains no real student data.
- **Trust design:** the model returns per-criterion scores and evidence as validated JSON. Python clamps the scores, computes the total and tracks gap status. See [ARCHITECTURE.md](ARCHITECTURE.md).

## How to run it
1. Clone the repo
   ```bash
   git clone <repo-url> && cd AI_Hackathon_New
   ```
2. Install [Ollama](https://ollama.com) and pull the model
   ```bash
   ollama pull gemma4:e2b
   python backend/scripts/smoke_model.py   # checks JSON output + speed
   ```
3. Start the backend
   ```bash
   cd backend
   pip install -e .
   uvicorn app.main:app --reload --port 8000
   ```
4. Start the frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open http://localhost:5173

Optional: copy `.env.example` to `.env` to change `MODEL_NAME` or `OLLAMA_URL`.

## Screenshots / demo
_Coming soon: Home, Learn, Viva score card and My Gaps screenshots._

## What's not done yet
- Only two subjects (Computer Networks, Software Engineering) with small sample question banks.
- Examiner voice uses the browser's built-in speech synthesis (Web Speech API, no API key or external model). Spoken answers (Whisper) are not done yet.
- No user accounts. Progress is stored in a single local database.
- AI scores are estimates to guide practice, not official marks. The small model is sometimes harsher than a human examiner (for example, it scores technical correctness low on short answers).
- Each model call takes about 30–60 s on a CPU-only laptop. A GPU or a hosted Ollama server would make it feel instant.

## Credits
- [Ollama](https://ollama.com), [Gemma](https://ai.google.dev/gemma) by Google
- [FastAPI](https://fastapi.tiangolo.com), [Pydantic](https://docs.pydantic.dev), [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), [lucide](https://lucide.dev)
- UI visual direction inspired by Bangladeshi edtech platforms such as Shikho (no assets copied)
- AI coding assistant (Claude Code) used to help write code, as the rules allow

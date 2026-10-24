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
- **Model:** Gemma 4 via [Ollama](https://ollama.com/library) (open-weight). *(Final tag confirmed during the build. If a fallback such as [Qwen 2.5](https://ollama.com/library/qwen2.5) is used, it is stated here.)*
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
   ollama pull gemma4
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
- Only one subject (Computer Networks) in the sample question bank.
- No voice input yet (Whisper is planned).
- No user accounts. Progress is stored in a single local database.
- AI scores are estimates to guide practice, not official marks.

## Credits
- [Ollama](https://ollama.com), [Gemma](https://ai.google.dev/gemma) by Google
- [FastAPI](https://fastapi.tiangolo.com), [Pydantic](https://docs.pydantic.dev), [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), [lucide](https://lucide.dev)
- UI visual direction inspired by Bangladeshi edtech platforms such as Shikho (no assets copied)
- AI coding assistant (Claude Code) used to help write code, as the rules allow

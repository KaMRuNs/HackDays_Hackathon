# VivaBridge

**Understand it. Explain it. Defend it.** An AI study coach that helps university students prepare for lab vivas, in text or in a live spoken viva, by turning their mistakes into targeted practice.

## The problem
Before a lab viva, students in courses like Computer Networks memorize answers from seniors' notes or PDFs. In the viva, one follow-up question ("*why* is the final ACK needed?") exposes that they memorized instead of understanding. Today they practise with friends, if they can find one, and nobody tells them *which* concept they are actually missing. Many have also never practised *speaking* an answer under pressure.

## The solution
VivaBridge runs a closed learning loop:
1. **Learn**: get a concept explained simply, with an analogy, a technical definition and a quick check question.
2. **Prove**: answer a mock viva question in writing (**Viva**), or talk to a live AI examiner (**Voice Viva**) who asks out loud, listens and probes your weak spots.
3. **Diagnose**: get a rubric-based score (core concepts, correctness, reasoning, clarity), with evidence quoted from your answer and a list of missing concepts.
4. **Repair**: click a missing concept to have it re-explained using a different teaching strategy.
5. **Verify**: retry with a *new* question that covers the same concept. A gap is resolved only when you demonstrate it again.

## How it works
- **AI model (the brain):** [Gemma 4 E2B](https://ollama.com/library/gemma4) (`gemma4:e2b`, open-weight) via [Ollama](https://ollama.com). Gemma does **all** of the intelligence: explanations, understanding checks, viva questions, spoken follow-ups and rubric grading. It uses structured JSON output validated by Pydantic. On a CPU laptop `gemma4:e4b` took about 115 s per call versus about 30–60 s for E2B, so E2B is the default (set `MODEL_NAME` to switch).
- **Voice agent (Vapi, used only for voice):** in the Voice Viva, [Vapi](https://vapi.ai) is used **only as the voice layer**. It runs the call, turns the student's speech into text and speaks the examiner's replies. Vapi does **not** decide what the examiner says and does **not** grade anything: its `custom-llm` setting sends every turn to our own endpoint (`/api/vapi/chat/completions`), which streams the reply from Gemma 4. After the call, the transcript is graded by the same Gemma rubric grader as the text viva. Note that Vapi's speech services (speech-to-text and voice) are hosted, closed services. Everything else runs on open models, and the text Viva works fully without Vapi.
- **Read-aloud:** the text Viva can also read questions aloud with the browser's built-in speech synthesis (no API key).
- **Backend:** Python, FastAPI, Pydantic, SQLite
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, lucide-react, `@vapi-ai/web`
- **Dataset:** hand-written sample question banks for Computer Networks and Software Engineering, with concept IDs and rubric notes (`backend/data/question_bank/`). They contain no real student data.
- **Trust design:** the model returns per-criterion scores and evidence as validated JSON. Python clamps the scores, computes the total and tracks gap status. See [ARCHITECTURE.md](ARCHITECTURE.md) and [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

```
Student voice ─▶ Vapi (speech-to-text) ─▶ /api/vapi/chat/completions ─▶ Gemma 4 (Ollama)
                                                                          │ reply
Student ears  ◀─ Vapi (text-to-speech) ◀──────────────────────────────────┘
After the call: transcript ─▶ Gemma rubric grader ─▶ score, evidence, gaps
```

## How to run it
1. Clone the repo
   ```bash
   git clone https://github.com/KaMRuNs/HackDays_Hackathon.git && cd HackDays_Hackathon
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
   python -m uvicorn app.main:app --port 8000
   ```
4. Start the frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open http://localhost:5173

Optional: copy `.env.example` to `.env` to change `MODEL_NAME` or `OLLAMA_URL`.

### Voice Viva setup (optional)
1. Expose the backend publicly so Vapi's servers can reach the Gemma endpoint:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
2. Copy `frontend/.env.example` to `frontend/.env` and set:
   - `VITE_VAPI_PUBLIC_KEY`: your Vapi **public** key (never the private key)
   - `VITE_PUBLIC_API_URL`: the tunnel URL, without a trailing slash
3. Restart `npm run dev`, open **Voice Viva** and allow microphone access.
4. Tip: do one Learn explanation first so Gemma is loaded and the first spoken reply is fast.

## Screenshots / demo
_Coming soon: Home, Learn, Viva score card, Voice Viva and My Gaps screenshots._

## What's not done yet
- Only two subjects (Computer Networks, Software Engineering) with small sample question banks.
- Voice Viva relies on Vapi's hosted speech services and needs internet plus a public tunnel. An offline open-source voice path (Whisper + Piper/Kokoro) is planned.
- No user accounts. Progress is stored in a single local database.
- AI scores are estimates to guide practice, not official marks. The small model is sometimes harsher than a human examiner.
- Text features take about 30–60 s per model call on a CPU-only laptop. Spoken replies stream in about 1–2 s once the model is warm.
- The Vercel config (`vercel.json`) is untested and needs a publicly hosted Ollama server.

## Credits
- [Ollama](https://ollama.com), [Gemma](https://ai.google.dev/gemma) by Google
- [Vapi](https://vapi.ai): voice agent layer only (speech in/out)
- [FastAPI](https://fastapi.tiangolo.com), [Pydantic](https://docs.pydantic.dev), [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), [lucide](https://lucide.dev)
- UI visual direction inspired by Bangladeshi edtech platforms such as Shikho (no assets copied)
- AI coding assistant (Claude Code) used to help write code, as the rules allow

# VivaBridge — Project Overview

> **Understand it. Explain it. Defend it.**
> An AI study coach that helps university students prepare for lab vivas, in text or in a **live spoken viva**, by turning their mistakes into targeted practice. All AI reasoning and grading runs on the open-weight **Gemma 4** model via Ollama. **Vapi is used only as the voice agent** (speech in and out) for the Voice Viva.

Built solo for the **IIUC Hackathon (ML Bangladesh × MLH, Hacktoberfest Hack Day Chittagong)**.
Prize tracks: **Best Use of Gemma 4** and **Best Open-Source AI Project**.

---

## 1. The problem

Before a lab viva (Computer Networks, Software Engineering, …), most students memorize answers from seniors' notes or PDFs. In the viva, a single follow-up such as *"why is the final ACK needed?"* exposes that they memorized instead of understanding.

How students deal with it today:
- They re-read notes and hope the same questions come up.
- They practise with friends, if a friend is free and knows the topic.
- Nobody tells them **which specific concept** they are missing.

**Who has this problem:** every student who sits lab vivas, especially those for whom English is a second language and who understand a term without grasping the idea behind it.

## 2. The solution: one closed learning loop

VivaBridge merges two ideas:
- **ConceptBridge**: explain a concept simply, with an analogy, then check understanding.
- **VivaMirror**: a strict but helpful AI examiner that grades explanations and asks follow-ups.

Together they form a loop:

```
 Learn ──▶ Prove ──▶ Diagnose ──▶ Repair ──▶ Verify
   ▲                                          │
   └──────────── next gap / next topic ◀──────┘
```

| Step | What the student sees |
|---|---|
| **Learn** | A simple explanation, an analogy (or worked example / steps), a viva-ready definition and a quick check question |
| **Prove** | A mock viva question, answered in writing (**Viva**) or out loud to a live AI examiner who asks follow-ups (**Voice Viva**) |
| **Diagnose** | A score out of 10 on a fixed rubric, evidence quoted from their own answer, and each concept marked demonstrated / partial / missing |
| **Repair** | A "Learn: final ack" button that re-explains only that concept using a *different* teaching strategy |
| **Verify** | A retry with a **new, unseen question** on the same concept. The gap closes only if they demonstrate it there |

**Key differentiator:** traceable learning progress. A student cannot "pass" by repeating the AI's answer to the same question.

## 3. What makes it trustworthy

| Design choice | Why it matters |
|---|---|
| **Question bank + rubric are the source of truth** | Grading is anchored to fixed concepts, not to whatever the model invents |
| **Structured JSON output, validated by Pydantic** | The UI renders cards, never fragile free text. Invalid output is retried once, then shown as an honest error |
| **Python computes the totals** | The model scores each criterion; Python clamps every score to the rubric maximum and adds them up. The model never does the arithmetic |
| **Evidence quotes** | Every score shows the words from the student's answer that justify it |
| **Deterministic gap state** | Gap status is changed only by backend rules, never by the model |
| **Follow-ups are graded against the original question** | The stored seed question and its concepts are sent with every grading call, so a follow-up is never graded against the wrong question |
| **No hardcoded AI output** | All feedback is live model output. The home-page mockup is labelled as an illustration |

### Rubric (10 points per answer)

| Criterion | Max | Measures |
|---|---|---|
| Core concepts | 4 | Are the required concepts explained? |
| Technical correctness | 3 | Are the claims accurate? |
| Reasoning | 2 | Do they explain why/how, not just what? |
| Clarity | 1 | Is it understandable? |

### Gap lifecycle

```
missing/partial in a viva ──▶ OPEN ──(correct Learn check)──▶ PRACTICED
                                │                                  │
                                └──(demonstrated on an UNSEEN question)──▶ RESOLVED
```

Re-answering the question where the gap appeared never resolves it.

## 4. Tech stack

| Layer | Technology |
|---|---|
| Model (the brain) | **Gemma 4 E2B** (`gemma4:e2b`, open-weight), run locally with **Ollama**. It does every explanation, check, question, spoken follow-up and grade |
| Voice agent | **Vapi**, used **only for voice**: call handling, speech-to-text and text-to-speech. It forwards every turn to our Gemma endpoint through its `custom-llm` option |
| Read-aloud | Browser Web Speech API (`speechSynthesis`) on the text Viva page |
| Backend | Python 3.11, FastAPI, Pydantic v2, httpx, plain `sqlite3` |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router, lucide-react, `@vapi-ai/web` 2.7.1 |
| Data | A hand-written sample question bank (JSON). No real student data |

**Model choice:** measured on a CPU-only laptop, `gemma4:e4b` took about 115 s per call versus about 30–60 s for `gemma4:e2b`, so E2B is the default. Change it with the `MODEL_NAME` env var.

## 5. Architecture

```
┌──────────────────────────────┐   /api (Vite proxy)  ┌───────────────────────────────┐
│ React + Vite + Tailwind      │ ───────────────────▶ │ FastAPI                       │
│ Home · Learn · Viva · Gaps   │                      │ routers → services            │
└──────────────────────────────┘                      │ learning · viva · gap         │
                                                      │ model_client (schema+retry)   │
                                                      └──────┬─────────────────┬──────┘
                                                             │                 │
                                                  Ollama /api/chat       SQLite + JSON
                                                  gemma4:e2b             question bank
```

### Voice Viva flow (Vapi = voice only, Gemma = brain)

```
Browser (@vapi-ai/web, public key)
   │ 1. POST /api/interview/start → viva session + examiner system prompt (built from the question bank)
   │ 2. vapi.start({ model: { provider: "custom-llm", url: <tunnel>/api/vapi }, voice, transcriber })
   ▼
Vapi cloud ── student speech → text ──▶ POST <tunnel>/api/vapi/chat/completions
                                          │  FastAPI streams the reply (OpenAI SSE format)
                                          ▼  from Gemma 4 via Ollama /api/chat
Vapi cloud ◀── examiner reply text ───────┘ → speaks it to the student
   │
   ▼ on call end
Browser → POST /api/viva/{id}/answer {text: spoken answers, final: true} → Gemma rubric grader → score + gaps
```

- The examiner's behaviour is set by `prompts/interviewer.md`: short spoken replies, one question at a time, probing follow-ups, no answer giveaways, and the call ends after about 4 answers.
- Gemma's first token arrives in about 1–2 s once the model is warm, which is fast enough for conversation. Replies are capped at 120 tokens.
- Only the Vapi **public** key is used, in the browser. The private key is not needed and is never stored.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

## 6. Repository structure

```
.
├── README.md               Judge-facing summary + how to run
├── ARCHITECTURE.md         Detailed system design
├── CLAUDE.md               Contributor / AI-assistant rules
├── PROJECT_OVERVIEW.md     This file
├── .env.example            OLLAMA_URL, MODEL_NAME, MODEL_TIMEOUT, DB_PATH
├── vercel.json             Vercel multi-service config (untested)
├── backend/
│   ├── pyproject.toml
│   ├── scripts/smoke_model.py        Checks model JSON output + speed
│   ├── data/question_bank/
│   │   ├── computer_networks.json    8 questions, 8 concepts
│   │   └── software_engineering.json 4 questions, 4 concepts
│   └── app/
│       ├── main.py                   App, CORS, error handlers (502/504)
│       ├── config.py                 Env settings
│       ├── schemas.py                API + LLM contracts, rubric maxima
│       ├── db.py                     SQLite tables
│       ├── model_client.py           The ONLY place that calls the model
│       ├── question_bank.py          Loads subjects, questions, concepts
│       ├── learning_service.py       explain(), check()
│       ├── viva_service.py           start(), answer(), report(), normalize()
│       ├── gap_service.py            Gap lifecycle rules
│       ├── interview_service.py      Voice Viva: examiner prompt + Gemma streaming for Vapi
│       ├── prompts/                  explain.md, check.md, viva_grade.md, interviewer.md
│       └── routers/                  learn.py, viva.py, gaps.py, interview.py
└── frontend/
    ├── vite.config.ts                Proxies /api → :8000
    ├── .env.example                  VITE_VAPI_PUBLIC_KEY, VITE_PUBLIC_API_URL, VITE_VAPI_VOICE
    ├── tailwind.config.js            primary / accent / lavender / ink tokens
    └── src/
        ├── api/                      client.ts, types.ts
        ├── components/               NavBar, LoopSteps, SubjectTile, ExplanationCard,
        │                             RubricScoreCard, GapChip, Loader, ErrorBanner, SpeakButton
        └── pages/                    HomePage, LearnPage, VivaPage, InterviewPage, GapsPage
```

## 7. API reference

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | — | Status + model name |
| GET | `/api/subjects` | — | Subjects, question counts, concepts |
| POST | `/api/learn/explain` | `{concept, strategy?}` | `{simple, analogy, technical_definition, check_question}` |
| POST | `/api/learn/check` | `{concept, question, answer, concept_id?}` | `{correct, feedback, misconception, next_strategy}` (marks the gap practiced if correct) |
| POST | `/api/viva/start` | `{subject, concept_ids?}` | `{session_id, question, question_id}` (retry mode picks an unseen question) |
| POST | `/api/viva/{id}/answer` | `{text, final?}` | `{eval, total, max_total, done, next_question}` (`final: true` grades once and ends the session, used for Voice Viva) |
| POST | `/api/interview/start` | `{subject}` | `{session_id, question, system_prompt, first_message}` |
| POST | `/api/vapi/chat/completions` | OpenAI-style chat request (from Vapi) | Streamed Gemma reply (SSE `chat.completion.chunk`) |
| GET | `/api/viva/{id}/report` | — | Full session report |
| GET | `/api/gaps` | — | All gaps with status and attempts |

Errors: `502` = invalid model output after a retry, `504` = model timeout, `404` = unknown session or subject, `409` = viva already finished.

A viva runs for at most **3 turns** (the seed question plus up to 2 follow-ups).

## 8. Data model (SQLite: `backend/vivabridge.db`, git-ignored)

```
viva_session(id, subject, question_id, status, created_at, final_score)
turn(id, session_id, question_id, question_text, answer_text, rubric_result_json, total, created_at)
gap(id, concept_id UNIQUE, session_id, status, attempt_count, last_evidence, seen_question_ids, updated_at)
```

## 9. UI and design

Inspired by Bangladeshi edtech platforms (Shikho-style), with **no copied assets or branding**:
- Deep purple `#5B2C91` primary, warm coral `#FF6B4A` accent, lavender `#F3EEFB` surfaces
- The Poppins font, bold headings, rounded-2xl cards, pill buttons, soft shadows
- Colourful subject tiles, rubric progress bars, status badges
- A mobile-first, responsive layout, all in English
- A loader with an elapsed-seconds timer, since local inference takes time

| Page | Purpose |
|---|---|
| **Home** | Hero, CTAs, the 5-step loop |
| **Learn** | Concept input, suggestion chips, 3 explanation cards, quick check, re-explain, verify button |
| **Viva** | Subject tiles, examiner chat, read-aloud and "examiner voice" toggle, rubric score card per answer, final gap chips |
| **Voice Viva** | Live spoken call with examiner "Dr. Nadia": animated avatar that reacts to volume, speaking/listening status, mute/end, live transcript, then rubric score and gap chips |
| **My Gaps** | Progress bar and Open / Practiced / Resolved columns with actions |

## 10. How to run

```bash
# 1. Model
ollama pull gemma4:e2b
python backend/scripts/smoke_model.py

# 2. Backend  (terminal 1)
cd backend
pip install -e .
python -m uvicorn app.main:app --port 8000

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

**Voice Viva (optional):**
```bash
# 4. Public tunnel so Vapi can reach the Gemma endpoint (terminal 3)
cloudflared tunnel --url http://localhost:8000
# 5. frontend/.env
VITE_VAPI_PUBLIC_KEY=<vapi public key>
VITE_PUBLIC_API_URL=https://<your-tunnel>.trycloudflare.com
# 6. restart npm run dev → open "Voice Viva", allow the microphone
```

## 11. Demo script (about 2 minutes)

1. **Problem (30 s):** "Students memorize viva answers, and one follow-up breaks them."
2. **Learn:** *"What is a nonce in computer security?"* → simple explanation, analogy, definition, check question.
3. **Prove:** Computer Networks viva → *"Explain the TCP three-way handshake"* → answer incompletely (SYN, SYN-ACK, no final ACK).
4. **Diagnose:** a low score with quoted evidence; `final_ack` flagged **missing**; the examiner asks a follow-up.
5. **Repair:** click **Learn: final ack** → a new explanation strategy → pass the check → the gap becomes **practiced**.
6. **Verify:** **Verify in a new viva question** → an unseen question on the same concept → a strong answer → the gap is **resolved** on My Gaps.
7. **Voice Viva (wow moment):** open **Voice Viva** → Dr. Nadia asks the question out loud → answer by speaking → she probes the gap → end the call → rubric score and gaps from the spoken answers.
8. **What's next (15 s):** offline open-source voice (Whisper + Piper), more subjects, GPU hosting.

Warm Gemma up first with one Learn explanation, so the first spoken reply is quick.

Keep a screen recording as a backup in case the Wi-Fi or laptop is slow.

## 12. Verified so far

Tested end to end against the live `gemma4:e2b` model:
- An incomplete handshake answer → 2/10, with `final_ack` missing and three gaps opened
- A correct Learn check on `final_ack` → the gap moved to **practiced**
- A retry viva automatically chose the unseen question `cn_tcp_4` → 10/10 → `final_ack` and `syn_ack` **resolved**
- The frontend type-checks and builds cleanly
- The Vapi endpoint streams valid OpenAI-format chunks from Gemma, with the first token in about 1–2 s once warm
- **Not yet tested:** a real end-to-end Vapi call, which needs the public tunnel running

## 13. Known limitations / not done yet

- Only two subjects, with small sample question banks
- The small model can grade more harshly than a human examiner. Scores are labelled as estimates
- 30–60 s per model call on a CPU-only laptop
- Voice Viva needs internet, a public tunnel and Vapi's hosted (closed) speech-to-text and voice. The text Viva is the offline fallback
- No user accounts (one local database)
- Screenshots are not yet added to the README

## 14. Roadmap

- A fully open-source voice path (Whisper for speech-to-text, Piper or Kokoro for the voice) to replace Vapi's hosted speech services and work offline
- More subjects (DBMS, OS, Data Structures), plus a teacher tool for adding questions
- Per-student accounts and weekly progress
- Hosting on a GPU server (e.g. DigitalOcean) for near-instant responses

## 15. Hackathon compliance checklist

- [x] Campus/study problem with a clear user
- [x] All AI reasoning and grading on an open-source model (Gemma 4 via Ollama). No closed LLM API
- [ ] **Confirm with organizers:** Vapi is used only as the voice agent, and its speech-to-text and voice are hosted services. The text Viva is the fallback if this isn't allowed
- [x] A real web interface, usable without touching code
- [x] Public GitHub repo with incremental commits
- [x] No secrets, `.env` files, databases or model weights committed (the Vapi public key stays in a git-ignored `frontend/.env`)
- [x] Sample data only, with no real student information
- [x] No hardcoded or faked AI responses
- [ ] Screenshots / demo GIF in the README
- [ ] Submitted on the MLH event page before the deadline

## 16. Credits

Ollama · Gemma (Google) · Vapi (voice agent only) · FastAPI · Pydantic · React · Vite · Tailwind CSS · lucide. UI direction inspired by Bangladeshi edtech platforms. Claude Code was used as a coding assistant, as the rules allow.

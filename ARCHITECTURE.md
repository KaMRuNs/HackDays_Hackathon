# VivaBridge — Architecture

> Understand it. Explain it. Defend it.

VivaBridge is an AI study coach for university lab vivas. A student learns a concept, defends it in a mock viva, sees exactly which concepts are missing, studies only those, and proves improvement on a **new** question.

## 1. The learning loop

```
 Learn ──▶ Prove ──▶ Diagnose ──▶ Repair ──▶ Verify
   ▲                                          │
   └──────────── next gap / next topic ◀──────┘
```

| Step | What happens | Owner |
|---|---|---|
| Learn | Simple explanation, analogy, technical definition, check question | Model |
| Prove | Student answers a viva question in their own words | Student |
| Diagnose | Rubric-based grading with evidence, concept statuses | Model scores → **Python validates and sums** |
| Repair | "Learn this gap" re-explains with a different strategy | Model |
| Verify | Retry viva with an **unseen** question that covers the same concept | Python picks the question, the model grades it |

## 2. System overview

```
┌──────────────────────────────┐      HTTP/JSON      ┌──────────────────────────────┐
│ React + Vite + TS + Tailwind │ ──────────────────▶ │ FastAPI                      │
│ Home · Learn · Viva · Gaps   │                     │ routers → services           │
└──────────────────────────────┘                     │  learning / viva / gap       │
                                                     │ model_client (validate+retry)│
                                                     └───────┬───────────────┬──────┘
                                                             │               │
                                               Ollama /api/chat         SQLite + JSON
                                               (open-weight model)      question bank
```

**Source of truth:** the question bank and rubric. The model *interprets* answers and *writes* feedback. Python *validates*, *computes totals* and *owns gap state*.

## 3. Model

- Runtime: [Ollama](https://ollama.com), locally on `http://localhost:11434`.
- Preferred model: **Gemma 4** (exact tag verified in Phase 1 with `backend/scripts/smoke_model.py`).
- Fallback: **Qwen 2.5** (3B/7B instruct) if Gemma 4 is too slow or incompatible.
- The README names only the model actually used.
- All calls use Ollama structured output (`format` = JSON schema built from the Pydantic model), with a low temperature (0.2) for grading.
- No closed model APIs anywhere in the app.

## 4. Backend layout

```
backend/
  pyproject.toml
  app/
    main.py              FastAPI app, CORS, router registration, DB init on startup
    config.py            OLLAMA_URL, MODEL_NAME, MODEL_TIMEOUT (from env)
    schemas.py           API + LLM contracts (Pydantic)
    db.py                sqlite3 connection + table creation
    model_client.py      chat_json(prompt_name, variables, schema) -> validated object
    learning_service.py  explain(), check()
    viva_service.py      start(), answer(), report()
    gap_service.py       record(), mark_practiced(), list_gaps()
    routers/learn.py  routers/viva.py  routers/gaps.py
    prompts/explain.md  prompts/check.md  prompts/viva_grade.md
  data/question_bank/computer_networks.json
  scripts/smoke_model.py
```

### model_client.py
1. Load the prompt template from `prompts/` and fill in the variables.
2. POST to Ollama `/api/chat` with `format=<schema.model_json_schema()>` and `stream=false`.
3. Parse and validate with Pydantic. On failure, retry **once** with the validation error appended.
4. If it still fails, raise `ModelError` and the router returns HTTP 502 with a friendly message.
5. On timeout, return HTTP 504.

## 5. Contracts (`schemas.py`)

```python
class Question(BaseModel):          # from the question bank
    id: str; subject: str; text: str
    concept_ids: list[str]; rubric_notes: str

class Explanation(BaseModel):       # LLM
    simple: str; analogy: str; technical_definition: str; check_question: str

class CheckResult(BaseModel):       # LLM
    correct: bool; feedback: str; misconception: str | None
    next_strategy: Literal["analogy", "example", "step_by_step"]

class CriterionScore(BaseModel):    # LLM
    name: Literal["core_concepts", "technical_correctness", "reasoning", "clarity"]
    score: int; max_score: int; evidence: list[str]

class ConceptStatus(BaseModel):     # LLM
    concept_id: str; status: Literal["demonstrated", "partial", "missing"]

class VivaEval(BaseModel):          # LLM
    criteria: list[CriterionScore]          # exactly 4
    concept_statuses: list[ConceptStatus]   # one per question concept_id
    feedback: str; follow_up_question: str | None

class VivaTurnResult(BaseModel):    # API (Python adds total + done)
    eval: VivaEval; total: int; done: bool; next_question: str | None

class VivaReport(BaseModel):
    session_id: int; final_score: float; turns: list[dict]; gaps: list[dict]
```

### Rubric (10 points per answer)

| Criterion | Max |
|---|---|
| core_concepts | 4 |
| technical_correctness | 3 |
| reasoning | 2 |
| clarity | 1 |

Python post-processing: force `max_score` to the rubric value, clamp `score` into `[0, max]`, drop unknown concept IDs, add any missing concept IDs as `missing`, then compute `total = sum(scores)`. The model never does the arithmetic.

## 6. API

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/learn/explain` | `{concept, strategy?}` | `Explanation` |
| POST | `/api/learn/check` | `{concept, concept_id?, question, answer}` | `CheckResult` (marks gap `practiced` if correct) |
| POST | `/api/viva/start` | `{subject, concept_ids?}` | `{session_id, question}` |
| POST | `/api/viva/{id}/answer` | `{text}` | `VivaTurnResult` |
| GET | `/api/viva/{id}/report` | — | `VivaReport` |
| GET | `/api/gaps` | — | gaps grouped by status |
| GET | `/api/subjects` | — | subjects + concept list |

Viva sessions run for at most **3 turns**: the seed question plus up to 2 follow-ups. A follow-up is graded against the **stored seed question's** concept IDs and rubric, plus the previous turn as context.

## 7. Data (SQLite, `backend/vivabridge.db`)

```
viva_session(id, subject, status, created_at, final_score)
turn(id, session_id, question_id, question_text, answer_text, rubric_result_json, total, created_at)
gap(id, concept_id UNIQUE, session_id, status, attempt_count, last_evidence, updated_at)
```

### Gap lifecycle
```
missing/partial in viva ─▶ open ─▶ (learn check correct) ─▶ practiced
                                                              │
       demonstrated on a question NOT previously seen  ◀──────┘ ─▶ resolved
```
A gap is never resolved by a Learn check alone, and never by re-answering the same question. An `open` gap that is demonstrated on an unseen question also resolves, since that is the proof that matters.

### Question bank
`data/question_bank/computer_networks.json` holds **sample** questions written for this project: at least 6 questions, with at least 2 per concept so retries can use an unseen question. Example concept IDs: `tcp_handshake`, `syn_flag`, `syn_ack`, `final_ack`, `nonce`, `subnet_mask`.

## 8. Frontend

```
frontend/src/
  api/client.ts  api/types.ts
  pages/HomePage.tsx  LearnPage.tsx  VivaPage.tsx  GapsPage.tsx
  components/NavBar Hero LoopSteps SubjectTile ExplanationCard
             RubricScoreCard GapChip Loader ErrorBanner
```

**Visual direction:** a friendly, bright edtech look, inspired by shikho.com but not copied.
- Tokens: `primary #5B2C91` (deep purple), `accent #FF6B4A` (warm coral), `lavender #F3EEFB`, `ink #1F1535`.
- Font: Poppins (Google Fonts), with bold, large headings.
- Rounded-2xl cards, soft shadows, pill buttons, colourful subject tiles (lucide-react icons), progress bars and status badges.
- Home: a hero with "Understand it. Explain it. Defend it.", two CTAs and a 5-step loop strip.
- Mobile-first. All UI and model output is in English.

## 9. Error handling
- 502 when the model returns invalid output after a retry, and 504 on timeout. The UI shows an ErrorBanner with a retry button.
- Loading states on every model call, since local models can take a few seconds.
- No hardcoded fallback answers. Errors are shown honestly.

## 10. Out of scope (MVP)
Voice/Whisper, auth, multiple subjects beyond CN, analytics charts, fine-tuning, agent frameworks.

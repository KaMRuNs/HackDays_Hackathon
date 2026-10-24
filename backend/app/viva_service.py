import json
import random

from . import gap_service
from .db import connect
from .model_client import chat_json
from .question_bank import concept_meaning, get_question, get_subject
from .schemas import (
    RUBRIC_MAX,
    ConceptStatus,
    CriterionScore,
    VivaAnswerRequest,
    VivaEval,
    VivaStartRequest,
    VivaStartResponse,
    VivaTurnResult,
)

MAX_TURNS = 3


class VivaNotFound(Exception):
    pass


def start(req: VivaStartRequest) -> VivaStartResponse:
    questions = get_subject(req.subject)["questions"]
    if req.concept_ids:
        # Retry mode: prefer a question covering the gap that the student has not seen yet.
        seen = gap_service.seen_question_ids(req.concept_ids)
        covering = [q for q in questions if set(q.concept_ids) & set(req.concept_ids)]
        pool = [q for q in covering if q.id not in seen] or covering or questions
    else:
        pool = questions
    question = random.choice(pool)

    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO viva_session (subject, question_id) VALUES (?, ?)", (req.subject, question.id)
        )
        session_id = cur.lastrowid
        conn.execute(
            "INSERT INTO turn (session_id, question_id, question_text) VALUES (?, ?, ?)",
            (session_id, question.id, question.text),
        )
    return VivaStartResponse(session_id=session_id, question=question.text, question_id=question.id)


def normalize(ev: VivaEval, concept_ids: list[str]) -> tuple[VivaEval, int]:
    """Make the model's grading trustworthy: fixed rubric maxima, clamped scores, exact concept list, Python total."""
    by_name = {c.name: c for c in ev.criteria}
    criteria = []
    for name, max_score in RUBRIC_MAX.items():
        c = by_name.get(name) or CriterionScore(name=name, score=0, max_score=max_score, evidence=[])
        criteria.append(CriterionScore(
            name=name, score=max(0, min(c.score, max_score)), max_score=max_score, evidence=c.evidence[:2]
        ))
    by_concept = {s.concept_id: s for s in ev.concept_statuses}
    statuses = [by_concept.get(cid) or ConceptStatus(concept_id=cid, status="missing") for cid in concept_ids]
    fixed = VivaEval(
        criteria=criteria, concept_statuses=statuses, feedback=ev.feedback, follow_up_question=ev.follow_up_question
    )
    return fixed, sum(c.score for c in criteria)


async def answer(session_id: int, req: VivaAnswerRequest) -> VivaTurnResult:
    with connect() as conn:
        session = conn.execute("SELECT * FROM viva_session WHERE id = ?", (session_id,)).fetchone()
        if session is None:
            raise VivaNotFound(session_id)
        turns = conn.execute("SELECT * FROM turn WHERE session_id = ? ORDER BY id", (session_id,)).fetchall()
    current = turns[-1]
    if session["status"] != "active" or current["answer_text"] is not None:
        raise ValueError("This viva is already finished.")

    # Grade against the stored seed question, never against a follow-up's own wording.
    seed = get_question(session["question_id"])
    subject = get_subject(session["subject"])
    previous = ""
    if len(turns) > 1:
        lines = [f'Q: "{t["question_text"]}"\nA: """{t["answer_text"]}"""' for t in turns[:-1]]
        previous = "Earlier in this viva:\n" + "\n".join(lines)

    raw = await chat_json(
        "viva_grade",
        {
            "subject": subject["title"],
            "seed_question": seed.text,
            "concepts": "\n".join(f"- {cid}: {concept_meaning(cid)}" for cid in seed.concept_ids),
            "rubric_notes": seed.rubric_notes,
            "previous": previous,
            "current_question": current["question_text"],
            "answer": req.text,
        },
        VivaEval,
        temperature=0.1,
    )
    ev, total = normalize(raw, seed.concept_ids)

    done = req.final or len(turns) >= MAX_TURNS or not ev.follow_up_question
    with connect() as conn:
        conn.execute(
            "UPDATE turn SET answer_text = ?, rubric_result_json = ?, total = ? WHERE id = ?",
            (req.text, ev.model_dump_json(), total, current["id"]),
        )
        if done:
            avg = conn.execute("SELECT AVG(total) FROM turn WHERE session_id = ?", (session_id,)).fetchone()[0]
            conn.execute(
                "UPDATE viva_session SET status = 'done', final_score = ? WHERE id = ?", (round(avg, 1), session_id)
            )
        else:
            conn.execute(
                "INSERT INTO turn (session_id, question_id, question_text) VALUES (?, ?, ?)",
                (session_id, seed.id, ev.follow_up_question),
            )

    evidence = " | ".join(q for c in ev.criteria for q in c.evidence)[:500]
    gap_service.record(session_id, seed.id, ev.concept_statuses, evidence)

    return VivaTurnResult(eval=ev, total=total, done=done, next_question=None if done else ev.follow_up_question)


def report(session_id: int) -> dict:
    with connect() as conn:
        session = conn.execute("SELECT * FROM viva_session WHERE id = ?", (session_id,)).fetchone()
        if session is None:
            raise VivaNotFound(session_id)
        turns = conn.execute(
            "SELECT * FROM turn WHERE session_id = ? AND answer_text IS NOT NULL ORDER BY id", (session_id,)
        ).fetchall()
    seed = get_question(session["question_id"])
    gaps = [g for g in gap_service.list_gaps() if g["concept_id"] in seed.concept_ids]
    return {
        "session_id": session_id,
        "subject": session["subject"],
        "status": session["status"],
        "final_score": session["final_score"],
        "seed_question": seed.text,
        "turns": [
            {
                "question": t["question_text"],
                "answer": t["answer_text"],
                "total": t["total"],
                "eval": json.loads(t["rubric_result_json"]),
            }
            for t in turns
        ],
        "gaps": gaps,
    }

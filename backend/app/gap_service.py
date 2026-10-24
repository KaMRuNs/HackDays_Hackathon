"""Gap state is owned here, never by the model.

missing/partial -> open -> (correct Learn check) -> practiced -> (demonstrated on an unseen question) -> resolved
"""
import json

from .db import connect
from .question_bank import concept_meaning
from .schemas import ConceptStatus


def record(session_id: int, question_id: str, statuses: list[ConceptStatus], evidence: str) -> None:
    with connect() as conn:
        for s in statuses:
            row = conn.execute("SELECT * FROM gap WHERE concept_id = ?", (s.concept_id,)).fetchone()
            if s.status in ("missing", "partial"):
                if row is None:
                    conn.execute(
                        "INSERT INTO gap (concept_id, session_id, status, attempt_count, last_evidence, seen_question_ids)"
                        " VALUES (?, ?, 'open', 1, ?, ?)",
                        (s.concept_id, session_id, evidence, json.dumps([question_id])),
                    )
                else:
                    seen = set(json.loads(row["seen_question_ids"])) | {question_id}
                    conn.execute(
                        "UPDATE gap SET status = 'open', session_id = ?, attempt_count = attempt_count + 1,"
                        " last_evidence = ?, seen_question_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (session_id, evidence, json.dumps(sorted(seen)), row["id"]),
                    )
            elif row is not None and row["status"] != "resolved":
                seen = set(json.loads(row["seen_question_ids"]))
                # Re-answering the question where the gap appeared does not count as proof.
                new_status = "resolved" if question_id not in seen else row["status"]
                conn.execute(
                    "UPDATE gap SET status = ?, attempt_count = attempt_count + 1, last_evidence = ?,"
                    " seen_question_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (new_status, evidence, json.dumps(sorted(seen | {question_id})), row["id"]),
                )


def mark_practiced(concept_id: str) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE gap SET status = 'practiced', updated_at = CURRENT_TIMESTAMP"
            " WHERE concept_id = ? AND status = 'open'",
            (concept_id,),
        )


def seen_question_ids(concept_ids: list[str]) -> set[str]:
    with connect() as conn:
        marks = ",".join("?" * len(concept_ids))
        rows = conn.execute(f"SELECT seen_question_ids FROM gap WHERE concept_id IN ({marks})", concept_ids).fetchall()
    return {qid for r in rows for qid in json.loads(r["seen_question_ids"])}


def list_gaps() -> list[dict]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM gap ORDER BY updated_at DESC").fetchall()
    return [
        {
            "concept_id": r["concept_id"],
            "meaning": concept_meaning(r["concept_id"]),
            "status": r["status"],
            "attempt_count": r["attempt_count"],
            "last_evidence": r["last_evidence"],
            "session_id": r["session_id"],
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]

import json
from functools import lru_cache

from .config import QUESTION_BANK_DIR
from .schemas import Question


@lru_cache
def load_subjects() -> dict[str, dict]:
    subjects = {}
    for path in sorted(QUESTION_BANK_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        data["questions"] = [Question(subject=data["subject"], **q) for q in data["questions"]]
        subjects[data["subject"]] = data
    return subjects


def get_subject(subject: str) -> dict:
    subjects = load_subjects()
    if subject not in subjects:
        raise KeyError(f"Unknown subject: {subject}")
    return subjects[subject]


def get_question(question_id: str) -> Question:
    for data in load_subjects().values():
        for q in data["questions"]:
            if q.id == question_id:
                return q
    raise KeyError(f"Unknown question: {question_id}")


def concept_meaning(concept_id: str) -> str:
    for data in load_subjects().values():
        if concept_id in data["concepts"]:
            return data["concepts"][concept_id]
    return concept_id.replace("_", " ")

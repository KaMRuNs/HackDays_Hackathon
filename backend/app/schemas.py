from typing import Literal

from pydantic import BaseModel, Field

Strategy = Literal["analogy", "example", "step_by_step"]
CriterionName = Literal["core_concepts", "technical_correctness", "reasoning", "clarity"]
RUBRIC_MAX: dict[str, int] = {"core_concepts": 4, "technical_correctness": 3, "reasoning": 2, "clarity": 1}


# --- question bank ---
class Question(BaseModel):
    id: str
    subject: str
    text: str
    concept_ids: list[str]
    rubric_notes: str


# --- LLM contracts ---
class Explanation(BaseModel):
    simple: str
    analogy: str
    technical_definition: str
    check_question: str


class CheckResult(BaseModel):
    correct: bool
    feedback: str
    misconception: str | None = None
    next_strategy: Strategy


class CriterionScore(BaseModel):
    name: CriterionName
    score: int
    max_score: int
    evidence: list[str]


class ConceptStatus(BaseModel):
    concept_id: str
    status: Literal["demonstrated", "partial", "missing"]


class VivaEval(BaseModel):
    criteria: list[CriterionScore]
    concept_statuses: list[ConceptStatus]
    feedback: str
    follow_up_question: str | None = None


# --- API requests ---
class ExplainRequest(BaseModel):
    concept: str = Field(min_length=2, max_length=200)
    strategy: Strategy | None = None


class CheckRequest(BaseModel):
    concept: str = Field(min_length=2, max_length=200)
    concept_id: str | None = None
    question: str = Field(min_length=2, max_length=1000)
    answer: str = Field(min_length=1, max_length=3000)


class VivaStartRequest(BaseModel):
    subject: str
    concept_ids: list[str] | None = None


class VivaAnswerRequest(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    final: bool = False  # voice interview: grade the whole transcript once and finish


# --- API responses ---
class VivaStartResponse(BaseModel):
    session_id: int
    question: str
    question_id: str


class VivaTurnResult(BaseModel):
    eval: VivaEval
    total: int
    max_total: int = 10
    done: bool
    next_question: str | None = None

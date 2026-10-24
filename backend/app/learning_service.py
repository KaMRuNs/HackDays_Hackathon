from . import gap_service
from .model_client import chat_json
from .schemas import CheckRequest, CheckResult, ExplainRequest, Explanation


async def explain(req: ExplainRequest) -> Explanation:
    strategy = req.strategy or "analogy"
    avoid = ""
    if req.strategy:
        # A re-explanation: tell the model to try a genuinely different angle.
        avoid = "The student did not understand a previous explanation. Use a DIFFERENT angle and a NEW analogy or example."
    return await chat_json("explain", {"concept": req.concept, "strategy": strategy, "avoid": avoid}, Explanation)


async def check(req: CheckRequest) -> CheckResult:
    result = await chat_json(
        "check",
        {"concept": req.concept, "question": req.question, "answer": req.answer},
        CheckResult,
        temperature=0.1,
    )
    if req.concept_id and result.correct:
        gap_service.mark_practiced(req.concept_id)
    return result

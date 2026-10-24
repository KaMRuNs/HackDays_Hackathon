from fastapi import APIRouter, HTTPException

from .. import viva_service
from ..question_bank import load_subjects
from ..schemas import VivaAnswerRequest, VivaStartRequest, VivaStartResponse, VivaTurnResult

router = APIRouter(prefix="/api", tags=["viva"])


@router.get("/subjects")
def subjects():
    return [
        {"id": s["subject"], "title": s["title"], "question_count": len(s["questions"]), "concepts": s["concepts"]}
        for s in load_subjects().values()
    ]


@router.post("/viva/start", response_model=VivaStartResponse)
def start(req: VivaStartRequest):
    try:
        return viva_service.start(req)
    except KeyError as e:
        raise HTTPException(404, str(e))


@router.post("/viva/{session_id}/answer", response_model=VivaTurnResult)
async def answer(session_id: int, req: VivaAnswerRequest):
    try:
        return await viva_service.answer(session_id, req)
    except viva_service.VivaNotFound:
        raise HTTPException(404, "Viva session not found.")
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.get("/viva/{session_id}/report")
def report(session_id: int):
    try:
        return viva_service.report(session_id)
    except viva_service.VivaNotFound:
        raise HTTPException(404, "Viva session not found.")

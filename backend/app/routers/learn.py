from fastapi import APIRouter

from .. import learning_service
from ..schemas import CheckRequest, CheckResult, ExplainRequest, Explanation

router = APIRouter(prefix="/api/learn", tags=["learn"])


@router.post("/explain", response_model=Explanation)
async def explain(req: ExplainRequest):
    return await learning_service.explain(req)


@router.post("/check", response_model=CheckResult)
async def check(req: CheckRequest):
    return await learning_service.check(req)

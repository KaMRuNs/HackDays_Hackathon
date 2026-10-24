from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .. import interview_service

router = APIRouter(prefix="/api", tags=["interview"])


class InterviewStartRequest(BaseModel):
    subject: str


@router.post("/interview/start")
def start(req: InterviewStartRequest):
    try:
        return interview_service.start(req.subject)
    except KeyError as e:
        raise HTTPException(404, str(e))


# Vapi "custom-llm" provider calls {url}/chat/completions with an OpenAI-style streaming request.
@router.post("/vapi/chat/completions")
async def vapi_chat(request: Request):
    body = await request.json()
    return StreamingResponse(interview_service.stream_completion(body), media_type="text/event-stream")

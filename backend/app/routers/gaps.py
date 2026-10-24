from fastapi import APIRouter

from .. import gap_service

router = APIRouter(prefix="/api", tags=["gaps"])


@router.get("/gaps")
def gaps():
    return gap_service.list_gaps()

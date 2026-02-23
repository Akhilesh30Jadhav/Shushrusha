"""Scenarios endpoint."""

from fastapi import APIRouter
from ..schemas import ScenariosResponse, ScenarioMeta
from ..scenario_loader import get_scenarios_for_language

router = APIRouter(tags=["Scenarios"])


@router.get("/scenarios", response_model=ScenariosResponse)
async def list_scenarios(lang: str = "en"):
    scenarios = get_scenarios_for_language(lang)
    return ScenariosResponse(
        scenarios=[ScenarioMeta(**s) for s in scenarios]
    )

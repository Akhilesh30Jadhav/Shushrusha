"""Pydantic request / response schemas for the API."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


# ── Languages ──────────────────────────────────────────
class Language(BaseModel):
    code: str
    name: str
    native_name: str


class LanguagesResponse(BaseModel):
    languages: list[Language]


# ── Scenarios ──────────────────────────────────────────
class ScenarioMeta(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str = "beginner"
    estimated_minutes: int = 10
    description: str = ""


class ScenariosResponse(BaseModel):
    scenarios: list[ScenarioMeta]


# ── Session Start ──────────────────────────────────────
class SessionStartRequest(BaseModel):
    device_id: Optional[str] = None
    lang: str
    scenario_id: str


class NodeContent(BaseModel):
    node_key: str
    patient_text: str
    patient_audio_url: Optional[str] = None
    patient_media_url: Optional[str] = None


class SessionStartResponse(BaseModel):
    session_id: str
    node: NodeContent
    scenario: ScenarioMeta


# ── Turn ───────────────────────────────────────────────
class TurnRequest(BaseModel):
    node_key: str
    user_text: str
    user_audio_url: Optional[str] = None


class TurnEvaluation(BaseModel):
    matched_items: list[str] = []
    missed_items: list[str] = []
    critical_missed: list[str] = []
    notes: str = ""


class Progress(BaseModel):
    turn_index: int
    total_turns_estimate: int


class TurnResponse(BaseModel):
    next_node: Optional[NodeContent] = None
    evaluation: TurnEvaluation
    progress: Progress
    is_complete: bool = False


# ── Report / Complete ──────────────────────────────────
class ChecklistResult(BaseModel):
    item: str
    status: str  # "done" | "missed"
    is_critical: bool = False


class Report(BaseModel):
    score: float
    checklist_results: list[ChecklistResult]
    critical_misses: list[str]
    suggestions: list[str]
    transcript: list[dict] = []


class CompleteResponse(BaseModel):
    report: Report


# ── History ────────────────────────────────────────────
class SessionSummary(BaseModel):
    session_id: str
    scenario_id: str
    scenario_title: str = ""
    language: str
    started_at: str
    completed_at: Optional[str] = None
    score: Optional[float] = None


class HistoryResponse(BaseModel):
    sessions: list[SessionSummary]


class SessionReportResponse(BaseModel):
    session_id: str
    scenario_id: str
    scenario_title: str = ""
    language: str
    started_at: str
    completed_at: Optional[str] = None
    score: Optional[float] = None
    report: Optional[Report] = None

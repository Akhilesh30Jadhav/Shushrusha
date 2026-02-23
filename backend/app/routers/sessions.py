"""Session endpoints — start, turn, complete, history."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..database import get_db
from ..models import User, Session, SessionTurn
from ..schemas import (
    SessionStartRequest, SessionStartResponse,
    TurnRequest, TurnResponse, TurnEvaluation, Progress,
    CompleteResponse, Report, ChecklistResult,
    HistoryResponse, SessionSummary,
    SessionReportResponse,
    NodeContent, ScenarioMeta,
)
from ..scenario_loader import get_scenario, get_node, get_next_node_key, get_scenarios_for_language
from ..evaluation import evaluate_turn, generate_report

router = APIRouter(tags=["Sessions"])


async def _get_or_create_user(db: AsyncSession, device_id: str | None) -> User | None:
    if not device_id:
        return None
    result = await db.execute(select(User).where(User.device_id == device_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(device_id=device_id)
        db.add(user)
        await db.flush()
    return user


@router.post("/sessions/start", response_model=SessionStartResponse)
async def start_session(req: SessionStartRequest, db: AsyncSession = Depends(get_db)):
    scenario = get_scenario(req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    user = await _get_or_create_user(db, req.device_id)

    session = Session(
        user_id=user.id if user else None,
        device_id=req.device_id,
        scenario_id=req.scenario_id,
        language=req.lang,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Get start node
    node_data = get_node(req.scenario_id, "start", req.lang)
    if not node_data:
        raise HTTPException(status_code=500, detail="Scenario has no start node")

    return SessionStartResponse(
        session_id=session.id,
        node=NodeContent(
            node_key="start",
            patient_text=node_data["patient_text"],
        ),
        scenario=ScenarioMeta(
            id=scenario["id"],
            title=scenario.get("title", {}).get(req.lang, scenario.get("title", {}).get("en", "")),
            category=scenario.get("category", {}).get(req.lang, scenario.get("category", {}).get("en", "")),
            difficulty=scenario.get("difficulty", "beginner"),
            estimated_minutes=scenario.get("estimated_minutes", 10),
            description=scenario.get("description", {}).get(req.lang, scenario.get("description", {}).get("en", "")),
        ),
    )


@router.post("/sessions/{session_id}/turn", response_model=TurnResponse)
async def submit_turn(session_id: str, req: TurnRequest, db: AsyncSession = Depends(get_db)):
    # Get session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Session already completed")

    # Get current node checklist
    node_data = get_node(session.scenario_id, req.node_key, session.language)
    if not node_data:
        raise HTTPException(status_code=400, detail=f"Invalid node key: {req.node_key}")

    # Evaluate turn
    eval_result = evaluate_turn(req.user_text, node_data["expected_checklist"])

    # Count existing turns
    turn_count_result = await db.execute(
        select(SessionTurn).where(SessionTurn.session_id == session_id)
    )
    existing_turns = turn_count_result.scalars().all()
    turn_index = len(existing_turns) + 1

    # Save turn
    turn = SessionTurn(
        session_id=session_id,
        turn_index=turn_index,
        node_key=req.node_key,
        user_text=req.user_text,
        user_audio_url=req.user_audio_url,
        matched_items=eval_result["matched_items"],
        missed_items=eval_result["missed_items"],
        critical_missed=eval_result["critical_missed"],
    )
    db.add(turn)
    await db.commit()

    # Get next node
    next_node_key = get_next_node_key(session.scenario_id, req.node_key, req.user_text)
    is_complete = next_node_key == "__end__"

    scenario = get_scenario(session.scenario_id)
    total_estimate = scenario.get("total_turns_estimate", 8) if scenario else 8

    next_node = None
    if not is_complete:
        next_data = get_node(session.scenario_id, next_node_key, session.language)
        if next_data:
            next_node = NodeContent(
                node_key=next_node_key,
                patient_text=next_data["patient_text"],
            )

    return TurnResponse(
        next_node=next_node,
        evaluation=TurnEvaluation(**eval_result),
        progress=Progress(turn_index=turn_index, total_turns_estimate=total_estimate),
        is_complete=is_complete,
    )


@router.post("/sessions/{session_id}/complete", response_model=CompleteResponse)
async def complete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all turns
    turns_result = await db.execute(
        select(SessionTurn).where(SessionTurn.session_id == session_id).order_by(SessionTurn.turn_index)
    )
    turns = turns_result.scalars().all()

    # Build turn data for report generation
    turn_data = [
        {
            "node_key": t.node_key,
            "user_text": t.user_text,
            "matched_items": t.matched_items,
            "missed_items": t.missed_items,
            "critical_missed": t.critical_missed,
            "turn_index": t.turn_index,
        }
        for t in turns
    ]

    scenario = get_scenario(session.scenario_id)
    if not scenario:
        raise HTTPException(status_code=500, detail="Scenario data not found")

    report_data = generate_report(turn_data, scenario)

    # Update session
    session.completed_at = datetime.now(timezone.utc)
    session.score = report_data["score"]
    session.report_json = report_data
    await db.commit()

    return CompleteResponse(
        report=Report(
            score=report_data["score"],
            checklist_results=[ChecklistResult(**cr) for cr in report_data["checklist_results"]],
            critical_misses=report_data["critical_misses"],
            suggestions=report_data["suggestions"],
            transcript=report_data.get("transcript", []),
        )
    )


@router.get("/sessions/history", response_model=HistoryResponse)
async def get_history(device_id: str | None = None, limit: int = 10, db: AsyncSession = Depends(get_db)):
    query = select(Session).order_by(desc(Session.started_at)).limit(limit)
    if device_id:
        query = query.where(Session.device_id == device_id)

    result = await db.execute(query)
    sessions = result.scalars().all()

    summaries = []
    for s in sessions:
        scenario = get_scenario(s.scenario_id)
        title = ""
        if scenario:
            title = scenario.get("title", {}).get(s.language, scenario.get("title", {}).get("en", ""))

        summaries.append(SessionSummary(
            session_id=s.id,
            scenario_id=s.scenario_id,
            scenario_title=title,
            language=s.language,
            started_at=s.started_at.isoformat() if s.started_at else "",
            completed_at=s.completed_at.isoformat() if s.completed_at else None,
            score=s.score,
        ))

    return HistoryResponse(sessions=summaries)


@router.get("/sessions/{session_id}/report", response_model=SessionReportResponse)
async def get_session_report(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    scenario = get_scenario(session.scenario_id)
    title = ""
    if scenario:
        title = scenario.get("title", {}).get(session.language, scenario.get("title", {}).get("en", ""))

    report = None
    if session.report_json:
        rj = session.report_json
        report = Report(
            score=rj["score"],
            checklist_results=[ChecklistResult(**cr) for cr in rj["checklist_results"]],
            critical_misses=rj["critical_misses"],
            suggestions=rj["suggestions"],
            transcript=rj.get("transcript", []),
        )

    return SessionReportResponse(
        session_id=session.id,
        scenario_id=session.scenario_id,
        scenario_title=title,
        language=session.language,
        started_at=session.started_at.isoformat() if session.started_at else "",
        completed_at=session.completed_at.isoformat() if session.completed_at else None,
        score=session.score,
        report=report,
    )

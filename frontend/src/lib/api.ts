const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────
export interface Language {
  code: string;
  name: string;
  native_name: string;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  description: string;
}

export interface NodeContent {
  node_key: string;
  patient_text: string;
  patient_audio_url?: string;
  patient_media_url?: string;
}

export interface TurnEvaluation {
  matched_items: string[];
  missed_items: string[];
  critical_missed: string[];
  notes: string;
}

export interface Progress {
  turn_index: number;
  total_turns_estimate: number;
}

export interface TurnResponse {
  next_node: NodeContent | null;
  evaluation: TurnEvaluation;
  progress: Progress;
  is_complete: boolean;
}

export interface ChecklistResult {
  item: string;
  status: string;
  is_critical: boolean;
}

export interface Report {
  score: number;
  checklist_results: ChecklistResult[];
  critical_misses: string[];
  suggestions: string[];
  transcript: Array<{
    turn: number;
    patient: string;
    worker: string;
    matched: string[];
    missed: string[];
  }>;
}

export interface SessionSummary {
  session_id: string;
  scenario_id: string;
  scenario_title: string;
  language: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
}

export interface SessionReport extends SessionSummary {
  report: Report | null;
}

// ── API Functions ──────────────────────────────────

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json();
}

export async function getLanguages(): Promise<Language[]> {
  const data = await fetchJSON<{ languages: Language[] }>("/languages");
  return data.languages;
}

export async function getScenarios(lang: string): Promise<ScenarioMeta[]> {
  const data = await fetchJSON<{ scenarios: ScenarioMeta[] }>(
    `/scenarios?lang=${encodeURIComponent(lang)}`
  );
  return data.scenarios;
}

export async function startSession(
  scenarioId: string,
  lang: string,
  deviceId?: string
): Promise<{
  session_id: string;
  node: NodeContent;
  scenario: ScenarioMeta;
}> {
  return fetchJSON("/sessions/start", {
    method: "POST",
    body: JSON.stringify({
      scenario_id: scenarioId,
      lang,
      device_id: deviceId,
    }),
  });
}

export async function submitTurn(
  sessionId: string,
  nodeKey: string,
  userText: string
): Promise<TurnResponse> {
  return fetchJSON(`/sessions/${sessionId}/turn`, {
    method: "POST",
    body: JSON.stringify({
      node_key: nodeKey,
      user_text: userText,
    }),
  });
}

export async function completeSession(
  sessionId: string
): Promise<{ report: Report }> {
  return fetchJSON(`/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}

export async function getHistory(
  deviceId?: string,
  limit: number = 10
): Promise<SessionSummary[]> {
  const params = new URLSearchParams();
  if (deviceId) params.set("device_id", deviceId);
  params.set("limit", String(limit));
  const data = await fetchJSON<{ sessions: SessionSummary[] }>(
    `/sessions/history?${params.toString()}`
  );
  return data.sessions;
}

export async function getSessionReport(
  sessionId: string
): Promise<SessionReport> {
  return fetchJSON(`/sessions/${sessionId}/report`);
}

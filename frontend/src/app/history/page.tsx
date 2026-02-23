"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { getHistory, SessionSummary } from "@/lib/api";
import Link from "next/link";

export default function HistoryPage() {
    const router = useRouter();
    const { deviceId } = useAppContext();
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (deviceId) {
            getHistory(deviceId)
                .then(setSessions)
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            // Try without device ID (show all)
            getHistory()
                .then(setSessions)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [deviceId]);

    const formatDate = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {
            return iso;
        }
    };

    const scoreColor = (score: number | null) => {
        if (score === null) return "var(--text-muted)";
        if (score >= 80) return "#10b981";
        if (score >= 50) return "#f59e0b";
        return "#ef4444";
    };

    return (
        <div className="page-container">
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, padding: "8px 0", marginBottom: 16 }}>
                ← Back
            </button>

            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Session History</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
                Review your past training sessions
            </p>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading...</div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>No sessions yet</p>
                    <Link href="/language" className="btn-primary">Start Your First Training</Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {sessions.map((s) => (
                        <button
                            key={s.session_id}
                            onClick={() => s.completed_at ? router.push(`/report/${s.session_id}`) : null}
                            className="glass-card"
                            style={{
                                padding: 16,
                                width: "100%",
                                textAlign: "left",
                                cursor: s.completed_at ? "pointer" : "default",
                                background: "rgba(26,35,50,0.7)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "var(--text-primary)",
                                opacity: s.completed_at ? 1 : 0.6,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <span style={{ fontWeight: 600, fontSize: 15 }}>{s.scenario_title || s.scenario_id}</span>
                                {s.score !== null && (
                                    <span style={{ fontWeight: 700, fontSize: 18, color: scoreColor(s.score) }}>
                                        {Math.round(s.score)}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                                <span>{s.language.toUpperCase()}</span>
                                <span>{formatDate(s.started_at)}</span>
                                {!s.completed_at && <span style={{ color: "var(--accent-warning)" }}>In Progress</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

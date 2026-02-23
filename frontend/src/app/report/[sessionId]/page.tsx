"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { getSessionReport, SessionReport } from "@/lib/api";
import Link from "next/link";

function ScoreGauge({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

    return (
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
            <svg width="140" height="140" className="score-ring">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                    cx="70" cy="70" r={radius} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ fontSize: 36, fontWeight: 800, color }}>{Math.round(score)}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>out of 100</span>
            </div>
        </div>
    );
}

export default function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);
    const router = useRouter();
    const [data, setData] = useState<SessionReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSessionReport(sessionId)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sessionId]);

    if (loading) {
        return <div className="page-container" style={{ textAlign: "center", paddingTop: 100, color: "var(--text-muted)" }}>Loading report...</div>;
    }
    if (!data || !data.report) {
        return <div className="page-container" style={{ textAlign: "center", paddingTop: 100, color: "var(--text-muted)" }}>Report not found.</div>;
    }

    const { report } = data;

    return (
        <div className="page-container" style={{ paddingBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Performance Report</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>{data.scenario_title}</p>

            {/* Score */}
            <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
                <ScoreGauge score={report.score} />
                <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13 }}>
                    {report.score >= 80 ? "Excellent work! 🎉" : report.score >= 50 ? "Good effort, room for improvement." : "Keep practicing the protocol."}
                </p>
            </div>

            {/* Critical Misses */}
            {report.critical_misses.length > 0 && (
                <div className="glass-card animate-fade-in" style={{ padding: 16, marginBottom: 16, border: "1px solid rgba(239,68,68,0.3)" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-danger)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        ⚠️ Critical Misses
                    </h3>
                    {report.critical_misses.map((miss, i) => (
                        <div key={i} style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: 6, fontSize: 13, color: "var(--text-primary)" }}>
                            {miss}
                        </div>
                    ))}
                </div>
            )}

            {/* Checklist */}
            <div className="glass-card animate-fade-in-delay" style={{ padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📋 Protocol Checklist</h3>
                {report.checklist_results.map((item, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 0",
                        borderBottom: i < report.checklist_results.length - 1 ? "1px solid var(--border-color)" : "none",
                    }}>
                        <span style={{ fontSize: 16 }}>{item.status === "done" ? "✅" : "❌"}</span>
                        <span style={{ flex: 1, fontSize: 13, color: item.status === "done" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {item.item}
                        </span>
                        {item.is_critical && (
                            <span style={{ fontSize: 10, color: "var(--accent-danger)", fontWeight: 600, padding: "2px 6px", background: "rgba(239,68,68,0.1)", borderRadius: 4 }}>
                                CRITICAL
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            <div className="glass-card animate-fade-in-delay" style={{ padding: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>💡 Suggestions</h3>
                {report.suggestions.map((s, i) => (
                    <div key={i} style={{ padding: "8px 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {s}
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/scenarios" className="btn-primary" style={{ textAlign: "center" }}>
                    🔄 Try Another Scenario
                </Link>
                <Link href="/history" className="btn-secondary" style={{ textAlign: "center" }}>
                    📋 View History
                </Link>
                <Link href="/" className="btn-secondary" style={{ textAlign: "center" }}>
                    🏠 Home
                </Link>
            </div>
        </div>
    );
}

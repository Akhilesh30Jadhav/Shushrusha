"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { getScenarios, startSession, ScenarioMeta } from "@/lib/api";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const CATEGORY_ICONS: Record<string, string> = {
    "Maternal Health": "🤰",
    "Maternal & Newborn": "👶",
    "Child Health": "🧒",
    "मातृ स्वास्थ्य": "🤰",
    "मातृ एवं नवजात": "👶",
    "बाल स्वास्थ्य": "🧒",
};

export default function ScenariosPage() {
    const router = useRouter();
    const { language, deviceId } = useAppContext();
    const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState<string | null>(null);

    useEffect(() => {
        getScenarios(language)
            .then(setScenarios)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [language]);

    const handleStart = async (scenarioId: string) => {
        try {
            setStarting(scenarioId);
            const result = await startSession(scenarioId, language, deviceId);
            router.push(`/simulation/${result.session_id}?nodeKey=${result.node.node_key}&patientText=${encodeURIComponent(result.node.patient_text)}&scenarioTitle=${encodeURIComponent(result.scenario.title)}&totalTurns=${result.scenario.estimated_minutes}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start session. Make sure the backend is running.");
            setStarting(null);
        }
    };

    return (
        <div className="page-container">
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, padding: "8px 0", marginBottom: 16 }}>
                ← Back
            </button>

            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Choose a Scenario
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
                Select a training scenario to practice
            </p>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading scenarios...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {scenarios.map((s) => (
                        <div key={s.id} className="relative group min-h-[160px]">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={2}
                            />
                            <div className="relative glass-card h-full p-5 flex flex-col justify-between overflow-hidden border-[0.75px] bg-background shadow-sm">
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                    <span style={{ fontSize: 32 }}>{CATEGORY_ICONS[s.category] || "📋"}</span>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{s.title}</h3>
                                        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                                            <span className={`badge badge-${s.difficulty}`}>{s.difficulty}</span>
                                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>~{s.estimated_minutes} min</span>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>
                                    {s.description}
                                </p>
                                <button
                                    onClick={() => handleStart(s.id)}
                                    className="btn-primary"
                                    disabled={starting !== null}
                                    style={{ width: "100%", opacity: starting === s.id ? 0.7 : 1 }}
                                >
                                    {starting === s.id ? "Starting..." : "▶ Start Scenario"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

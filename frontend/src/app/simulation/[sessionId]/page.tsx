"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, use, Suspense } from "react";
import { submitTurn, completeSession, TurnEvaluation } from "@/lib/api";

interface ChatMessage {
    role: "patient" | "worker";
    text: string;
    evaluation?: TurnEvaluation;
}

function SimulationContent({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentNodeKey, setCurrentNodeKey] = useState("");
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ turn_index: 0, total_turns_estimate: 8 });
    const [scenarioTitle, setScenarioTitle] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [completing, setCompleting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const nodeKey = searchParams.get("nodeKey") || "start";
        const patientText = searchParams.get("patientText") || "";
        const title = searchParams.get("scenarioTitle") || "Scenario";
        const total = parseInt(searchParams.get("totalTurns") || "8");

        setCurrentNodeKey(nodeKey);
        setScenarioTitle(title);
        setProgress({ turn_index: 0, total_turns_estimate: total });

        if (patientText) {
            setMessages([{ role: "patient", text: patientText }]);
        }
    }, [searchParams]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const userText = inputText.trim();
        setInputText("");
        setSending(true);

        // Add worker message
        setMessages((prev) => [...prev, { role: "worker", text: userText }]);

        try {
            const result = await submitTurn(sessionId, currentNodeKey, userText);

            // Update last worker message with evaluation
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    evaluation: result.evaluation,
                };
                return updated;
            });

            setProgress(result.progress);

            if (result.is_complete) {
                setIsComplete(true);
            } else if (result.next_node) {
                setCurrentNodeKey(result.next_node.node_key);
                // Add next patient message after a delay
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        { role: "patient", text: result.next_node!.patient_text },
                    ]);
                }, 600);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit response. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeSession(sessionId);
            router.push(`/report/${sessionId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to generate report.");
            setCompleting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const progressPercent = progress.total_turns_estimate > 0
        ? Math.min((progress.turn_index / progress.total_turns_estimate) * 100, 100)
        : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{scenarioTitle}</h2>
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        Turn {progress.turn_index}/{progress.total_turns_estimate}
                    </span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* Chat area */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "worker" ? "flex-end" : "flex-start" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, paddingLeft: 4, paddingRight: 4 }}>
                            {msg.role === "patient" ? "🏥 Patient" : "👩‍⚕️ You"}
                        </div>
                        <div className={`chat-bubble ${msg.role === "patient" ? "chat-patient" : "chat-worker"}`}>
                            {msg.text}
                        </div>
                        {msg.evaluation && (
                            <div style={{ marginTop: 6, fontSize: 12, maxWidth: "85%" }} className="animate-fade-in">
                                {msg.evaluation.matched_items.length > 0 && (
                                    <div style={{ color: "var(--accent-success)", marginBottom: 2 }}>
                                        ✓ {msg.evaluation.matched_items.join(", ")}
                                    </div>
                                )}
                                {msg.evaluation.critical_missed.length > 0 && (
                                    <div style={{ color: "var(--accent-danger)" }}>
                                        ⚠ Critical missed: {msg.evaluation.critical_missed.join(", ")}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: 16, borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                {isComplete ? (
                    <button
                        onClick={handleComplete}
                        className="btn-primary"
                        disabled={completing}
                        style={{ width: "100%" }}
                    >
                        {completing ? "Generating Report..." : "📊 View Your Report"}
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your response as an ASHA worker..."
                            className="text-input"
                            style={{ flex: 1, resize: "none", minHeight: 48, maxHeight: 120 }}
                            rows={1}
                            disabled={sending}
                        />
                        <button
                            onClick={handleSend}
                            className="btn-primary"
                            disabled={!inputText.trim() || sending}
                            style={{ padding: "12px 20px", flexShrink: 0 }}
                        >
                            {sending ? "..." : "→"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SimulationPage({ params }: { params: Promise<{ sessionId: string }> }) {
    return (
        <Suspense fallback={<div className="page-container" style={{ textAlign: "center", paddingTop: 100 }}>Loading simulation...</div>}>
            <SimulationContent params={params} />
        </Suspense>
    );
}

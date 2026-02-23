"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { getLanguages, Language } from "@/lib/api";

const LANGUAGE_EMOJIS: Record<string, string> = {
    en: "🇬🇧",
    hi: "🇮🇳",
    ta: "🇮🇳",
    bn: "🇮🇳",
    te: "🇮🇳",
};

export default function LanguagePage() {
    const router = useRouter();
    const { setLanguage } = useAppContext();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLanguages()
            .then(setLanguages)
            .catch(() => {
                // Fallback if API not available
                setLanguages([
                    { code: "en", name: "English", native_name: "English" },
                    { code: "hi", name: "Hindi", native_name: "हिन्दी" },
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (code: string) => {
        setLanguage(code);
        router.push("/scenarios");
    };

    return (
        <div className="page-container">
            {/* Back */}
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, padding: "8px 0", marginBottom: 16 }}>
                ← Back
            </button>

            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Select Language
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
                Choose your preferred language for training
            </p>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className="glass-card"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                padding: "18px 20px",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(26,35,50,0.7)",
                                color: "var(--text-primary)",
                                width: "100%",
                                textAlign: "left",
                                fontSize: 16,
                            }}
                        >
                            <span style={{ fontSize: 28 }}>{LANGUAGE_EMOJIS[lang.code] || "🌐"}</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>{lang.native_name}</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>{lang.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AppState {
    language: string;
    setLanguage: (lang: string) => void;
    deviceId: string;
}

const AppContext = createContext<AppState | undefined>(undefined);

function generateDeviceId(): string {
    return "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState("en");
    const [deviceId, setDeviceId] = useState("");

    useEffect(() => {
        // Load from localStorage
        const savedLang = localStorage.getItem("sushrusha_lang");
        if (savedLang) setLanguage(savedLang);

        let savedDevice = localStorage.getItem("sushrusha_device_id");
        if (!savedDevice) {
            savedDevice = generateDeviceId();
            localStorage.setItem("sushrusha_device_id", savedDevice);
        }
        setDeviceId(savedDevice);
    }, []);

    const handleSetLanguage = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem("sushrusha_lang", lang);
    };

    return (
        <AppContext.Provider value={{ language, setLanguage: handleSetLanguage, deviceId }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
}

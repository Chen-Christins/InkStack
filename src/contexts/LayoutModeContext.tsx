import React, { createContext, useContext, useEffect, useState } from "react";

export type LayoutMode = "appShell" | "classic";

interface LayoutModeContextValue {
    mode: LayoutMode;
    setMode: (mode: LayoutMode) => void;
    toggleMode: () => void;
}

const STORAGE_KEY = "layout-mode";

const LayoutModeContext = createContext<LayoutModeContextValue | undefined>(undefined);

function getInitialMode(): LayoutMode {
    if (typeof window === "undefined") {
        return "appShell";
    }

    return window.localStorage.getItem(STORAGE_KEY) === "classic" ? "classic" : "appShell";
}

export const LayoutModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<LayoutMode>(getInitialMode);

    useEffect(() => {
        document.documentElement.setAttribute("data-layout-mode", mode);
        window.localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const toggleMode = () => {
        setMode((prev) => (prev === "appShell" ? "classic" : "appShell"));
    };

    return <LayoutModeContext.Provider value={{ mode, setMode, toggleMode }}>{children}</LayoutModeContext.Provider>;
};

export function useLayoutMode(): LayoutModeContextValue {
    const context = useContext(LayoutModeContext);
    if (!context) {
        throw new Error("useLayoutMode must be used within a LayoutModeProvider");
    }

    return context;
}

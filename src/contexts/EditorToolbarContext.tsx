import React, { createContext, useContext, useRef, useState } from "react";

export interface EditorToolbarHandlers {
    onSaveDraft: () => void;
    onPublish: () => void;
}

export interface EditorToolbarState {
    active: boolean;
    submitting: boolean;
    isEdit: boolean;
}

interface EditorToolbarContextValue {
    state: EditorToolbarState;
    handlersRef: React.MutableRefObject<EditorToolbarHandlers | null>;
    setState: React.Dispatch<React.SetStateAction<EditorToolbarState>>;
}

const INACTIVE: EditorToolbarState = { active: false, submitting: false, isEdit: false };

const EditorToolbarContext = createContext<EditorToolbarContextValue | null>(null);

export const EditorToolbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<EditorToolbarState>(INACTIVE);
    const handlersRef = useRef<EditorToolbarHandlers | null>(null);

    return <EditorToolbarContext.Provider value={{ state, handlersRef, setState }}>{children}</EditorToolbarContext.Provider>;
};

export const useEditorToolbar = (): EditorToolbarContextValue | null => useContext(EditorToolbarContext);

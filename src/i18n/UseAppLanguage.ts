/**
 * 界面语言读写 Hook：供语言切换组件使用
 */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS, type SupportedLanguage } from "./Constants";
import { normalizeLanguage, setStoredLanguage } from "./I18nUtils";
import { applyLanguage } from "./ApplyLanguage";

export interface UseAppLanguageResult {
    language: SupportedLanguage;
    options: { id: SupportedLanguage; label: string }[];
    setLanguage: (language: SupportedLanguage) => void;
}

export function useAppLanguage(): UseAppLanguageResult {
    const { i18n: instance } = useTranslation();

    const setLanguage = useCallback((language: SupportedLanguage) => {
        setStoredLanguage(language);
        void applyLanguage(language);
    }, []);

    return {
        language: normalizeLanguage(instance.language),
        options: LANGUAGE_OPTIONS,
        setLanguage,
    };
}

export default useAppLanguage;

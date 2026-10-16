/**
 * 语言同步 Hook：在后端站点语言加载后，解析并应用应使用的界面语言
 */

import { useEffect } from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { applyLanguage } from "./ApplyLanguage";
import { resolvePreferredLanguage } from "./I18nUtils";

export function useLanguageSync(): void {
    const { settings } = useSiteSettings();
    const backendLanguage = settings.language;

    useEffect(() => {
        const target = resolvePreferredLanguage(backendLanguage);
        void applyLanguage(target);
    }, [backendLanguage]);
}

export default useLanguageSync;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./Resources";
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, NAMESPACES, SUPPORTED_LANGUAGES } from "./Constants";
import { resolvePreferredLanguage } from "./I18nUtils";

i18n.use(initReactI18next).init({
    resources,
    lng: resolvePreferredLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: "common",
    ns: [...NAMESPACES],
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
});

// 保证 <html lang> 与当前语言一致
if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.language || DEFAULT_LANGUAGE;
}

export default i18n;

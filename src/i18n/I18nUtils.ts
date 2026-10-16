/**
 * i18n 纯工具函数（不依赖 i18next 实例，避免循环引用）
 */

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from "./Constants";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
    return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** 将任意语言标识（如 "en"、"zh-Hans"）归一化到受支持的语言 */
export function normalizeLanguage(raw?: string | null): SupportedLanguage {
    if (!raw) {
        return DEFAULT_LANGUAGE;
    }
    if (isSupportedLanguage(raw)) {
        return raw;
    }
    const lower = raw.toLowerCase();
    if (lower.startsWith("zh")) {
        return "zh-CN";
    }
    if (lower.startsWith("en")) {
        return "en-US";
    }
    return DEFAULT_LANGUAGE;
}

/** 读取用户显式选择并存储的语言偏好（无则返回 null） */
export function getStoredLanguage(): SupportedLanguage | null {
    try {
        const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return isSupportedLanguage(value) ? value : null;
    } catch {
        return null;
    }
}

export function setStoredLanguage(language: SupportedLanguage): void {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        // localStorage 不可用时静默降级
    }
}

export function clearStoredLanguage(): void {
    try {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
        // localStorage 不可用时静默降级
    }
}

/**
 * 解析应使用的语言，优先级：
 * 用户显式偏好 → 后端站点语言 → 浏览器语言 → 默认语言
 */
export function resolvePreferredLanguage(backendLanguage?: string | null): SupportedLanguage {
    const stored = getStoredLanguage();
    if (stored) {
        return stored;
    }
    if (backendLanguage) {
        return normalizeLanguage(backendLanguage);
    }
    if (typeof navigator !== "undefined") {
        return normalizeLanguage(navigator.language);
    }
    return DEFAULT_LANGUAGE;
}

/** 按指定语言格式化日期（替代各处硬编码的 "zh-CN"） */
export function formatDate(value: Date | number | string, language: string, options?: Intl.DateTimeFormatOptions): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return date.toLocaleDateString(language, options);
}

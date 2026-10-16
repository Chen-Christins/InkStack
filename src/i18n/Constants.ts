/**
 * i18n 常量定义
 *
 * - SUPPORTED_LANGUAGES 为当前已提供词条的语言，后续新增语言只需在此追加并补词条
 * - 语言选项名称（LanguageOption.label）使用各语言自身书写，不随界面语言变化
 */

export const DEFAULT_LANGUAGE = "zh-CN";
export const FALLBACK_LANGUAGE = "zh-CN";

/** 用户语言偏好存储键（非敏感配置，可用 localStorage） */
export const LANGUAGE_STORAGE_KEY = "app-language";

export const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = [
    "common",
    "nav",
    "auth",
    "error",
    "article",
    "admin",
    "personal",
    "rd",
    "calendar",
    "enums",
    "organization",
    "assignment",
    "user",
    "profile",
    "components",
    "home",
    "blog",
    "services",
    "sample",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export interface LanguageOption {
    id: SupportedLanguage;
    label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { id: "zh-CN", label: "简体中文" },
    { id: "en-US", label: "English" },
];

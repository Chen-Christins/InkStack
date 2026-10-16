/**
 * 应用指定语言：切换 i18next、同步 <html lang>、刷新后端错误码文案
 */

import i18n from "./index";
import { refreshErrorCodes } from "@/utils/ErrorCodes.ts";
import type { SupportedLanguage } from "./Constants";

export async function applyLanguage(language: SupportedLanguage): Promise<void> {
    if (i18n.language !== language) {
        await i18n.changeLanguage(language);
    }
    if (typeof document !== "undefined" && document.documentElement.lang !== language) {
        document.documentElement.lang = language;
    }
    await refreshErrorCodes(language);
}

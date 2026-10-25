/**
 * 旧版认证 Cookie 清理
 *
 * 新认证体系只使用 HttpOnly SESSIONID，JavaScript 读不到、也不应该尝试删除它。
 * 这里仅保留迁移期需要的旧 S_TOKEN/S_UID/S_TOKEN_TIME 清理。
 */

const LEGACY_AUTH_COOKIE_NAMES = ["S_TOKEN", "S_UID", "S_TOKEN_TIME"];

export function clearLegacyAuthCookies(): void {
    LEGACY_AUTH_COOKIE_NAMES.forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
}

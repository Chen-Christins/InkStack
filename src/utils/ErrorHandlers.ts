/**
 * 业务错误码处理器
 *
 * 所有与业务语义相关的 errno 处理逻辑都集中在这里，
 * Http.ts 只负责调用 setBusinessErrorHandler 注册的回调。
 */

import { sessionEvents, detectInvalidReason, type SessionInvalidReason } from "../auth/SessionEvents.ts";
import { setBusinessErrorHandler } from "../infra/Http.ts";

// ---------- 1101：未登录（会话过期 / 被顶下线） ----------

setBusinessErrorHandler((errno, data) => {
    if (errno === 1101) {
        const fallback = data?.msg || data?.errstr || "";
        const reason: SessionInvalidReason = detectInvalidReason(String(fallback));
        sessionEvents.emitSessionInvalidated(reason);
    }
});

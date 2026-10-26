/**
 * 会话失效事件总线
 *
 * 认证已经改为服务端 Session + HttpOnly SESSIONID Cookie，前端不再持有 token。
 * 这里只负责把 1101 等会话失效事件通知给 AuthContext / SessionNotifier。
 */

export type SessionInvalidReason = "expired" | "kicked";

class SessionEvents {
    private sessionInvalidatedListeners: ((reason: SessionInvalidReason) => void)[] = [];

    emitSessionInvalidated(reason: SessionInvalidReason) {
        this.sessionInvalidatedListeners.forEach((listener) => listener(reason));
    }

    addSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        this.sessionInvalidatedListeners.push(listener);
    }

    removeSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        const index = this.sessionInvalidatedListeners.indexOf(listener);
        if (index > -1) {
            this.sessionInvalidatedListeners.splice(index, 1);
        }
    }
}

export const sessionEvents = new SessionEvents();

/**
 * 根据服务端 errstr/msg 判定会话失效原因
 * 命中"被顶/被踢/已在其他设备"关键字 → kicked，否则视为会话过期
 */
export const detectInvalidReason = (text: string): SessionInvalidReason =>
    /kick|kicked|other device|异地|被顶|踢下线|已在其他设备|已被登录/i.test(text) ? "kicked" : "expired";

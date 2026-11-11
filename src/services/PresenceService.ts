import { sessionWS } from "./WsInstances.ts";

/**
 * 实时在线人数
 *
 * 复用统一会话长连接：
 * - 握手成功后服务端下发 `connected` 帧，携带 `online_users`
 * - 在线人数变化时下发 `online_count` 帧
 *
 * 连接生命周期由 AuthContext 统一管理，这里只负责缓存与订阅。
 */

type OnlineCountListener = (count: number | null) => void;
const listeners = new Set<OnlineCountListener>();
let _onlineCount: number | null = null;

function updateOnlineCount(raw: unknown) {
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
        return;
    }
    _onlineCount = raw;
    listeners.forEach((fn) => fn(raw));
}

sessionWS.onMessage("online_count", (data: any) => {
    updateOnlineCount(data?.count ?? data?.online_users);
});

sessionWS.onMessage("connected", (data: any) => {
    updateOnlineCount(data?.online_users);
});

// 连接断开时清空，避免展示过期人数。
sessionWS.onClose(() => {
    if (_onlineCount === null) {
        return;
    }
    _onlineCount = null;
    listeners.forEach((fn) => fn(null));
});

export function getOnlineCount(): number | null {
    return _onlineCount;
}

export function subscribeOnlineCount(listener: OnlineCountListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

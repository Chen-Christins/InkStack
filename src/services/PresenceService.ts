import { WebSocketClient } from "../infra/Websocket.ts";

/** 在线状态 WebSocket 单例 */
export const presenceWS = new WebSocketClient("/ws/v1/presence");

type OnlineCountListener = (count: number) => void;
const listeners = new Set<OnlineCountListener>();
let _onlineCount: number | null = null;

presenceWS.onMessage("online_count", (data: any) => {
    const count: number = data.count ?? data.online_users ?? 0;
    _onlineCount = count;
    listeners.forEach((fn) => fn(count));
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

export function connectPresence(uid: string | number) {
    presenceWS.connect(uid);
}

export function disconnectPresence() {
    presenceWS.disconnect();
}

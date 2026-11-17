import { useEffect, useState } from "react";
import { subscribeOnlineCount, getOnlineCount } from "../services/PresenceService.ts";

/**
 * 在任何组件中使用：读取实时在线人数
 *
 * 数据来自统一会话 WebSocket（/ws/v1/session），连接生命周期由 AuthContext 管理。
 */
export function useOnlineCount(): number | null {
    const [count, setCount] = useState(getOnlineCount());

    useEffect(() => {
        const unsubscribe = subscribeOnlineCount(setCount);
        setCount(getOnlineCount());
        return unsubscribe;
    }, []);

    return count;
}

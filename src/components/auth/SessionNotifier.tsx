import React, { useEffect } from "react";
import { sessionEvents, type SessionInvalidReason } from "@/auth/SessionEvents.ts";
import i18n from "@/i18n";
import message from "@/components/message/Message";

/**
 * 会话失效全局提示组件
 * 挂在 MessageProvider 内部，订阅 sessionEvents 的会话失效事件并弹出提示
 * （AuthContext 位于 MessageProvider 之上，无法直接调用 message，故单独承载）
 */
const SessionNotifier: React.FC = () => {
    useEffect(() => {
        const handleInvalidated = (reason: SessionInvalidReason) => {
            message.error(reason === "kicked" ? i18n.t("auth:session.kicked") : i18n.t("auth:session.expired"));
        };
        sessionEvents.addSessionInvalidatedListener(handleInvalidated);
        return () => {
            sessionEvents.removeSessionInvalidatedListener(handleInvalidated);
        };
    }, []);

    return null;
};

export default SessionNotifier;

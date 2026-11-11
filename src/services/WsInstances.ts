/**
 * WebSocket 业务单例
 *
 * sessionWS：统一会话长连接（/ws/v1/session）
 * 通知、在线人数、私信和系统消息全部复用这一条连接，按 channel 分发。
 */

import { WebSocketClient } from "../infra/Websocket.ts";

/** 统一会话 WebSocket 单例 */
export const sessionWS = new WebSocketClient("/ws/v1/session");

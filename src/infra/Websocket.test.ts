import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { WebSocketClient } from "./Websocket.ts";

/**
 * WebSocket 建连回归测试。
 *
 * 新认证体系使用 HttpOnly SESSIONID Cookie，浏览器在 WebSocket 握手时自动携带。
 * URL 只保留 uid（用于后端 onClose 兜底），不能再出现 token/token_time。
 */

/** 一个只记录入参、不真正建连的 WebSocket 替身 */
class MockWebSocket {
    static instances: MockWebSocket[] = [];
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    readonly url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }
    sent: string[] = [];
    send(data: string): void {
        this.sent.push(data);
    }
    close(): void {
        this.readyState = MockWebSocket.CLOSED;
    }
}

/** 收集一次 connect 期间 console 的全部输出文本 */
function captureConsole(client: WebSocketClient, uid: string | number | undefined): string[] {
    const lines: string[] = [];
    const spyLog = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
    const spyError = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
    });
    try {
        client.connect(uid);
    } finally {
        spyLog.mockRestore();
        spyError.mockRestore();
    }
    return lines;
}

describe("WebSocket Cookie 建连", () => {
    beforeEach(() => {
        MockWebSocket.instances = [];
        (globalThis as { WebSocket?: unknown }).WebSocket = MockWebSocket;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("建连 URL 只携带 uid，不再携带 token/token_time", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 42);

        expect(MockWebSocket.instances).toHaveLength(1);
        const url = new URL(MockWebSocket.instances[0].url);
        expect(url.searchParams.get("uid")).toBe("42");
        expect(url.searchParams.has("token")).toBe(false);
        expect(url.searchParams.has("token_time")).toBe(false);
    });

    it("没有内存 token 也可以建连（认证依赖 Cookie）", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        expect(client.connect(7)).toBe(true);
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("日志包含 uid 和 Cookie 认证标记，且不出现 token", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        const lines = captureConsole(client, 42);
        const joined = lines.join("\n");

        expect(joined).toContain("42");
        expect(joined).toContain("cookie");
        expect(joined).not.toContain("token=");
    });

    it("重复 connect 不会重复建连", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const second = client.connect(1);

        expect(second).toBe(true);
        expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("重连仍只携带 uid", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        // 手动置为 CLOSED，绕开「已连接/连接中就不重复建连」的短路
        MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED;
        const second = captureConsole(client, 1);

        expect(MockWebSocket.instances).toHaveLength(2);
        const url = new URL(MockWebSocket.instances[1].url);
        expect(url.searchParams.get("uid")).toBe("1");
        expect(url.searchParams.get("token")).toBeNull();
        expect(second.join("\n")).not.toContain("token=");
    });

    it("旧连接异步关闭时不会为新连接调度重连", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const first = MockWebSocket.instances[0];
        first.readyState = MockWebSocket.CLOSED;

        captureConsole(client, 1);
        first.onclose?.({ code: 1006, reason: "", wasClean: false } as CloseEvent);

        vi.advanceTimersByTime(31000);
        expect(MockWebSocket.instances).toHaveLength(2);
        vi.useRealTimers();
    });

    it("握手从未成功时不会自动重连刷屏", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];

        socket.readyState = MockWebSocket.CLOSED;
        socket.onclose?.({ code: 1006, reason: "", wasClean: false } as CloseEvent);
        vi.advanceTimersByTime(60000);

        expect(MockWebSocket.instances).toHaveLength(1);
        vi.useRealTimers();
    });

    it("单个消息处理器抛错不会重复分发或阻断其他处理器", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        const first = vi.fn(() => {
            throw new Error("handler failed");
        });
        const second = vi.fn();
        const wildcard = vi.fn();
        client.onMessage("notification", first);
        client.onMessage("notification", second);
        client.onMessage("*", wildcard);
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        socket.onmessage?.({ data: JSON.stringify({ type: "notification", id: 1 }) } as MessageEvent);

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        expect(wildcard).toHaveBeenCalledOnce();
        expect(wildcard).toHaveBeenCalledWith({ type: "notification", id: 1 });
    });

    it("待发送队列有上限并在连接成功后按顺序清空", () => {
        const client = new WebSocketClient("/ws/v1/notification", { maxPendingMessages: 2 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];

        expect(client.send({ id: 1 })).toBe(true);
        expect(client.send({ id: 2 })).toBe(true);
        expect(client.send({ id: 3 })).toBe(false);

        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();
        expect(socket.sent).toEqual(['{"id":1}', '{"id":2}']);
    });

    it("不可序列化消息返回 false 且不会进入队列", () => {
        const client = new WebSocketClient("/ws/v1/notification", { maxPendingMessages: 1 });
        captureConsole(client, 1);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(client.send(circular)).toBe(false);
        expect(client.send("valid")).toBe(true);
        expect(client.send("overflow")).toBe(false);
    });

    it("主动断开后拒绝缓存新消息", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        client.disconnect();

        expect(client.send("stale message")).toBe(false);
    });

    it("连接建立后启动心跳定时器", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification", { heartbeatInterval: 30000 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();

        vi.advanceTimersByTime(30000);
        expect(socket.sent).toContainEqual('{"type":"ping"}');

        vi.advanceTimersByTime(30000);
        expect(socket.sent.filter((s) => s === '{"type":"ping"}')).toHaveLength(2);

        vi.useRealTimers();
    });

    it("连接关闭后停止心跳", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification", { heartbeatInterval: 30000 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();

        vi.advanceTimersByTime(30000);
        expect(socket.sent).toContainEqual('{"type":"ping"}');

        socket.readyState = MockWebSocket.CLOSED;
        socket.onclose?.({ code: 1000, reason: "", wasClean: true } as CloseEvent);

        socket.sent = [];
        vi.advanceTimersByTime(60000);
        expect(socket.sent).not.toContainEqual('{"type":"ping"}');

        vi.useRealTimers();
    });

    it("disconnect() 后停止心跳", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification", { heartbeatInterval: 30000 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();

        vi.advanceTimersByTime(30000);
        expect(socket.sent).toContainEqual('{"type":"ping"}');

        client.disconnect();

        socket.sent = [];
        vi.advanceTimersByTime(60000);
        expect(socket.sent).not.toContainEqual('{"type":"ping"}');

        vi.useRealTimers();
    });

    it("pong 消息不触发用户注册的 handler", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        const handler = vi.fn();
        client.onMessage("*", handler);

        socket.onmessage?.({ data: JSON.stringify({ type: "pong" }) } as MessageEvent);

        expect(handler).not.toHaveBeenCalled();
    });

    it("heartbeatInterval 设为 0 时禁用心跳", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification", { heartbeatInterval: 0 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();

        vi.advanceTimersByTime(60000);
        expect(socket.sent).not.toContainEqual('{"type":"ping"}');

        vi.useRealTimers();
    });
});

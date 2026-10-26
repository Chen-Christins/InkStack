import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import useAiSummary from "./UseAiSummary.ts";

// react-dom 的 act() 需要显式标记测试环境（React 19 从 "react" 导出 act）
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * AI-SSE Cookie 认证回归测试。
 *
 * 认证已经改为 HttpOnly SESSIONID Cookie，SSE 请求必须显式 credentials: include，
 * 且不能再出现 Authorization 头或任何 token 片段。
 */

/** 构造一个立刻结束、可选带一个 chunk 的假 SSE 响应 */
function fakeSseResponse(chunks: string[] = []): Response {
    const encoder = new TextEncoder();
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (i < chunks.length) {
                controller.enqueue(encoder.encode(chunks[i]));
                i += 1;
                return;
            }
            controller.close();
        },
    });
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "text/event-stream" },
        body: stream,
    } as unknown as Response;
}

/** 把 hook 挂到一个宿主组件上，拿到 start 与当前 error */
function renderHook() {
    const captured: { start?: () => void } = {};
    const container = document.createElement("div");
    document.body.appendChild(container);

    function Host() {
        const { start } = useAiSummary(123);
        captured.start = start;
        return null;
    }

    const root = createRoot(container);
    act(() => {
        root.render(<Host />);
    });
    return {
        start: () => captured.start!(),
        unmount: () => {
            act(() => root.unmount());
            container.remove();
        },
    };
}

/** 收集一段同步+异步执行期间 console 的全部输出 */
async function captureConsole(run: () => void): Promise<string[]> {
    const lines: string[] = [];
    const record = (...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
    };
    const spyLog = vi.spyOn(console, "log").mockImplementation(record);
    const spyWarn = vi.spyOn(console, "warn").mockImplementation(record);
    const spyError = vi.spyOn(console, "error").mockImplementation(record);
    try {
        run();
        // 冲掉 fetch 的 promise 链与流式读取循环
        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
        });
    } finally {
        spyLog.mockRestore();
        spyWarn.mockRestore();
        spyError.mockRestore();
    }
    return lines;
}

describe("AI 总结 SSE Cookie 认证", () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    const originalProxy = import.meta.env.VITE_USE_PROXY;

    beforeEach(() => {
        fetchMock = vi.fn(async () => fakeSseResponse(['data: {"type":"chunk","content":"你好"}\n\n']));
        vi.stubGlobal("fetch", fetchMock);
        import.meta.env.VITE_USE_PROXY = "true";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        import.meta.env.VITE_USE_PROXY = originalProxy;
    });

    it("日志说明使用 Cookie 认证，且不出现 Authorization", async () => {
        const view = renderHook();
        const lines = await captureConsole(() => view.start());
        const joined = lines.join("\n");

        expect(joined).toContain("Cookie (SESSIONID)");
        expect(joined).not.toContain("Authorization");
        view.unmount();
    });

    it("SSE 请求使用 credentials: include，且不附加 Authorization", async () => {
        const view = renderHook();
        await captureConsole(() => view.start());

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = fetchMock.mock.calls[0][1] as RequestInit;
        expect(init.credentials).toBe("include");
        expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
        view.unmount();
    });
});

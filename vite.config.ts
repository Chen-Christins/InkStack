import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const ANSI = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
} as const;

type LogColor = keyof typeof ANSI;

const canColor = Boolean(process.stdout.isTTY);

const paint = (color: LogColor, text: string) => (canColor ? `${ANSI[color]}${text}${ANSI.reset}` : text);

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** 本地时间的毫秒级时间戳：22:48:52.134 */
const timeStamp = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const methodColor = (method: string): LogColor => {
    switch (method) {
        case "GET":
            return "cyan";
        case "POST":
            return "green";
        case "PUT":
        case "PATCH":
            return "yellow";
        case "DELETE":
            return "red";
        default:
            return "magenta";
    }
};

const statusColor = (status: number): LogColor => {
    if (status >= 500) {
        return "red";
    }
    if (status >= 400) {
        return "yellow";
    }
    if (status >= 300) {
        return "cyan";
    }
    return "green";
};

const formatDuration = (startedAt: number) => {
    const elapsed = performance.now() - startedAt;
    return elapsed >= 1000 ? `${(elapsed / 1000).toFixed(2)}s` : `${Math.round(elapsed)}ms`;
};

/** 路径保持高亮，查询参数弱化显示，便于快速扫读 */
const formatUrl = (url: string) => {
    const queryIndex = url.indexOf("?");
    if (queryIndex === -1) {
        return url;
    }
    return `${url.slice(0, queryIndex)}${paint("dim", url.slice(queryIndex))}`;
};

/**
 * 统一的代理日志：每个请求只在响应到达时输出一行，包含状态码与耗时。
 * 示例：[22:48:52.134] GET    200    12ms /api/v1/site/settings
 */
const attachProxyLogger = (proxy: any, target: string, tag?: string) => {
    proxy.on("proxyReq", (_proxyReq: any, req: any) => {
        req.__proxyStartedAt = performance.now();
    });

    proxy.on("proxyRes", (proxyRes: any, req: any) => {
        const method = req.method || "GET";
        const status = proxyRes.statusCode || 0;
        const duration = req.__proxyStartedAt ? formatDuration(req.__proxyStartedAt) : "-";
        const suffix = tag ? ` ${paint("dim", `(${tag})`)}` : "";

        console.log(
            `${paint("gray", `[${timeStamp()}]`)} ${paint(methodColor(method), method.padEnd(6))} ${paint(
                statusColor(status),
                String(status).padStart(3),
            )} ${paint("gray", duration.padStart(7))} ${formatUrl(req.url || "-")}${suffix}`,
        );
    });

    proxy.on("error", (err: Error, req: any) => {
        const method = req?.method || "GET";
        const duration = req?.__proxyStartedAt ? formatDuration(req.__proxyStartedAt) : "-";

        console.error(
            `${paint("gray", `[${timeStamp()}]`)} ${paint("red", "ERR".padEnd(6))} ${paint("red", method.padEnd(6))} ${paint(
                "gray",
                duration.padStart(7),
            )} ${formatUrl(req?.url || "-")} ${paint("red", err.message)} ${paint("gray", `(${target})`)}`,
        );
    });
};

// 转发真实客户端 IP（后端 GetRemoteIP 优先读取 X-Real-IP 头）
const setRealIp = (proxyReq: any, req: any) => {
    const ip = String(req.socket?.remoteAddress || req.headers["x-forwarded-for"] || "").replace(/^::ffff:/, "");
    if (ip) {
        proxyReq.setHeader("X-Real-IP", ip);
    }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = env.VITE_API_BASE_URL || "http://127.0.0.1:8088";
    const gatewayTarget = env.TECHHAVEN_GATEWAY_URL || "http://127.0.0.1:3091";

    const agentProxy: Record<string, ProxyOptions> =
        env.VITE_AGENT_ENABLED === "true"
            ? {
                  "^/gateway": {
                      target: gatewayTarget,
                      changeOrigin: true,
                      secure: false,
                      headers: {
                          authorization: `Bearer ${env.TECHHAVEN_GATEWAY_PROXY_TOKEN || ""}`,
                          "x-techhaven-actor": env.TECHHAVEN_GATEWAY_PROXY_ACTOR || "user:1",
                      },
                      rewrite: (requestPath) => requestPath.replace(/^\/gateway/, ""),
                      configure: (proxy) => {
                          attachProxyLogger(proxy, gatewayTarget, "gateway");
                          proxy.on("error", (_err, _req, res) => {
                              // 结束浏览器侧响应，使客户端进入基于 lastSeq 的重连分支。
                              if ("writeHead" in res && !res.headersSent) {
                                  res.writeHead(503, { "content-type": "application/json" });
                                  res.end(JSON.stringify({ error: "Agent 服务暂时不可用，请稍后重试" }));
                              } else {
                                  res.destroy();
                              }
                          });
                      },
                  },
              }
            : {};

    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        server: {
            host: true,
            proxy: {
                ...agentProxy,
                // SSE 流式端点 — 必须放在通用 /api/v1 规则之前
                "^/api/v1/article/ai-summary": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    timeout: 120000,
                    configure: (proxy) => {
                        attachProxyLogger(proxy, apiTarget, "sse");
                        proxy.on("proxyReq", (proxyReq, req) => {
                            setRealIp(proxyReq, req);
                        });
                    },
                },
                "^/api/v1": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy) => {
                        attachProxyLogger(proxy, apiTarget);
                        proxy.on("proxyReq", (proxyReq, req) => {
                            setRealIp(proxyReq, req);
                        });
                    },
                },
                "^/file(.*)": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    timeout: 100000,
                    agent: false,
                    configure: (proxy) => {
                        attachProxyLogger(proxy, apiTarget, "file");
                        proxy.on("proxyReq", (proxyReq, req) => {
                            setRealIp(proxyReq, req);
                            proxyReq.setHeader("Connection", "keep-alive");
                        });
                    },
                },
                // 统一会话 WebSocket 代理（通知 / 在线 / 聊天）
                "^/ws/v1": {
                    target: env.VITE_WS_URL || "ws://127.0.0.1:8091",
                    ws: true,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});

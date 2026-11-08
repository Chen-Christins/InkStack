import http from "../infra/Http.ts";

/**
 * 后端 Registry::RenderJson 返回的单条指标
 */
export interface MetricSample {
    name: string;
    help: string;
    type: "counter" | "gauge" | "histogram";
    labels: Record<string, string>;
    /** counter / gauge 的值 */
    value?: number;
    /** histogram 分桶，累计计数 */
    buckets?: Array<{ le: number; cumulative: number }>;
    /** histogram 样本总数 */
    count?: number;
    /** histogram 样本值总和（秒） */
    sum?: number;
}

export interface MetricsPayload {
    metrics?: MetricSample[];
}

export interface RouteMetricsRow {
    route: string;
    requests: number;
    errors: number;
    /** 错误率，百分比 */
    errorRate: number;
    /** 当前 QPS（最近一个采样窗口） */
    recentQps: number;
    /** 启动以来平均 QPS */
    avgQps: number;
    /** 平均耗时（毫秒） */
    avgLatencyMs: number;
    /** P95 耗时（毫秒），null 表示超过最大桶 */
    p95Ms: number | null;
    /** P99 耗时（毫秒），null 表示超过最大桶 */
    p99Ms: number | null;
    /** 最大桶上界（毫秒） */
    maxBucketMs: number;
    buckets: Array<{ le: number; cumulative: number }>;
    count: number;
    /** 总耗时（秒） */
    sum: number;
}

export interface ServiceInfo {
    name: string;
    version: string;
    pid: string;
}

export interface ProcessMetrics {
    uptimeSeconds: number;
    rssKb: number;
    vmKb: number;
    threads: number;
    systemTotalKb: number;
    systemAvailableKb: number;
    fibers: number;
}

export interface ConnectionMetrics {
    http: number;
    ws: number;
    onlineUsers: number;
}

export interface MetricsTotals {
    requests: number;
    errors: number;
    errorRate: number;
    recentQps: number;
    avgQps: number;
}

export interface MetricsSnapshot {
    service: ServiceInfo | null;
    process: ProcessMetrics;
    connections: ConnectionMetrics;
    totals: MetricsTotals;
    routes: RouteMetricsRow[];
}

interface RouteAccumulator {
    requests: number;
    errors: number;
    avgQpsMilli: number;
    recentQpsMilli: number;
    histogram: MetricSample | null;
}

const ROUTE_REQUESTS = "blog_http_requests_total";
const ROUTE_ERRORS = "blog_http_errors_total";
const ROUTE_DURATION = "blog_http_request_duration_seconds";
const ROUTE_AVG_QPS = "blog_http_route_avg_qps_milli";
const ROUTE_RECENT_QPS = "blog_http_route_recent_qps_milli";

/**
 * 从累计分桶估算分位数。
 * 后端 JSON 只包含有限桶，样本落在最大桶之外时返回 null。
 */
function estimatePercentileMs(buckets: Array<{ le: number; cumulative: number }>, count: number, ratio: number): number | null {
    if (count <= 0 || buckets.length === 0) {
        return null;
    }

    const target = count * ratio;
    for (const bucket of buckets) {
        if (bucket.cumulative >= target) {
            return bucket.le * 1000;
        }
    }

    return null;
}

export class MetricsService {
    /**
     * 拉取当前 worker 进程的原始指标
     */
    static async getMetrics(signal?: AbortSignal): Promise<MetricSample[]> {
        const response = await http.get<MetricsPayload>("/admin/metrics", signal ? { signal } : undefined);
        return response.data?.metrics ?? [];
    }

    /**
     * 将原始指标聚合成页面可直接消费的结构
     */
    static buildSnapshot(samples: MetricSample[]): MetricsSnapshot {
        const routes = new Map<string, RouteAccumulator>();
        const singleByName = new Map<string, MetricSample>();

        for (const sample of samples) {
            const route = sample.labels?.route;
            if (route) {
                let accumulator = routes.get(route);
                if (!accumulator) {
                    accumulator = {
                        requests: 0,
                        errors: 0,
                        avgQpsMilli: 0,
                        recentQpsMilli: 0,
                        histogram: null,
                    };
                    routes.set(route, accumulator);
                }

                switch (sample.name) {
                    case ROUTE_REQUESTS:
                        accumulator.requests = sample.value ?? 0;
                        break;
                    case ROUTE_ERRORS:
                        accumulator.errors = sample.value ?? 0;
                        break;
                    case ROUTE_AVG_QPS:
                        accumulator.avgQpsMilli = sample.value ?? 0;
                        break;
                    case ROUTE_RECENT_QPS:
                        accumulator.recentQpsMilli = sample.value ?? 0;
                        break;
                    case ROUTE_DURATION:
                        accumulator.histogram = sample;
                        break;
                    default:
                        break;
                }
                continue;
            }

            if (!singleByName.has(sample.name)) {
                singleByName.set(sample.name, sample);
            }
        }

        const routeRows: RouteMetricsRow[] = Array.from(routes.entries()).map(([route, accumulator]) => {
            const histogram = accumulator.histogram;
            const buckets = histogram?.buckets ?? [];
            const count = histogram?.count ?? 0;
            const sum = histogram?.sum ?? 0;

            return {
                route,
                requests: accumulator.requests,
                errors: accumulator.errors,
                errorRate: accumulator.requests > 0 ? (accumulator.errors / accumulator.requests) * 100 : 0,
                recentQps: accumulator.recentQpsMilli / 1000,
                avgQps: accumulator.avgQpsMilli / 1000,
                avgLatencyMs: count > 0 ? (sum / count) * 1000 : 0,
                p95Ms: estimatePercentileMs(buckets, count, 0.95),
                p99Ms: estimatePercentileMs(buckets, count, 0.99),
                maxBucketMs: buckets.length > 0 ? buckets[buckets.length - 1].le * 1000 : 0,
                buckets,
                count,
                sum,
            };
        });

        routeRows.sort((a, b) => b.requests - a.requests);

        const numberValue = (name: string): number => {
            const value = singleByName.get(name)?.value;
            return typeof value === "number" ? value : 0;
        };

        const info = singleByName.get("blog_info");
        const totalRequests = routeRows.reduce((total, row) => total + row.requests, 0);
        const totalErrors = routeRows.reduce((total, row) => total + row.errors, 0);

        return {
            service: info
                ? {
                      name: info.labels.name ?? "",
                      version: info.labels.version ?? "",
                      pid: info.labels.pid ?? "",
                  }
                : null,
            process: {
                uptimeSeconds: numberValue("blog_process_uptime_seconds"),
                rssKb: numberValue("blog_process_resident_memory_kb"),
                vmKb: numberValue("blog_process_virtual_memory_kb"),
                threads: numberValue("blog_process_threads"),
                systemTotalKb: numberValue("blog_system_memory_total_kb"),
                systemAvailableKb: numberValue("blog_system_memory_available_kb"),
                fibers: numberValue("blog_fibers"),
            },
            connections: {
                http: numberValue("blog_http_active_connections"),
                ws: numberValue("blog_ws_active_connections"),
                onlineUsers: numberValue("blog_online_users"),
            },
            totals: {
                requests: totalRequests,
                errors: totalErrors,
                errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
                recentQps: routeRows.reduce((total, row) => total + row.recentQps, 0),
                avgQps: routeRows.reduce((total, row) => total + row.avgQps, 0),
            },
            routes: routeRows,
        };
    }
}

export default MetricsService;

import { describe, expect, it } from "vitest";
import { MetricsService, type MetricSample } from "./MetricsService.ts";

function routeMetric(name: string, route: string, value?: number, extra?: Partial<MetricSample>): MetricSample {
    return {
        name,
        help: "",
        type: "counter",
        labels: { route },
        value,
        ...extra,
    };
}

describe("MetricsService.buildSnapshot", () => {
    const samples: MetricSample[] = [
        routeMetric("blog_http_requests_total", "/api/a", 100),
        routeMetric("blog_http_errors_total", "/api/a", 5),
        routeMetric("blog_http_route_avg_qps_milli", "/api/a", 1234),
        routeMetric("blog_http_route_recent_qps_milli", "/api/a", 2500),
        {
            name: "blog_http_request_duration_seconds",
            help: "",
            type: "histogram",
            labels: { route: "/api/a" },
            buckets: [
                { le: 0.01, cumulative: 90 },
                { le: 0.1, cumulative: 95 },
            ],
            count: 100,
            sum: 4,
        },
        routeMetric("blog_http_requests_total", "/api/b", 300),
        routeMetric("blog_http_errors_total", "/api/b", 0),
        routeMetric("blog_http_route_avg_qps_milli", "/api/b", 5000),
        routeMetric("blog_http_route_recent_qps_milli", "/api/b", 1000),
        {
            name: "blog_http_request_duration_seconds",
            help: "",
            type: "histogram",
            labels: { route: "/api/b" },
            buckets: [{ le: 0.005, cumulative: 300 }],
            count: 300,
            sum: 1.5,
        },
        {
            name: "blog_info",
            help: "",
            type: "gauge",
            labels: { name: "blog", version: "1.0.0", pid: "4321" },
            value: 1,
        },
        {
            name: "blog_process_uptime_seconds",
            help: "",
            type: "gauge",
            labels: {},
            value: 90,
        },
        {
            name: "blog_http_active_connections",
            help: "",
            type: "gauge",
            labels: {},
            value: 3,
        },
        {
            name: "blog_online_users",
            help: "",
            type: "gauge",
            labels: {},
            value: 7,
        },
    ];

    it("aggregates totals and sorts routes by requests", () => {
        const snapshot = MetricsService.buildSnapshot(samples);

        expect(snapshot.routes.map((row) => row.route)).toEqual(["/api/b", "/api/a"]);
        expect(snapshot.totals.requests).toBe(400);
        expect(snapshot.totals.errors).toBe(5);
        expect(snapshot.totals.errorRate).toBeCloseTo(1.25);
        expect(snapshot.totals.recentQps).toBeCloseTo(3.5);
        expect(snapshot.totals.avgQps).toBeCloseTo(6.234);
    });

    it("converts milli QPS and computes latency statistics", () => {
        const snapshot = MetricsService.buildSnapshot(samples);
        const routeA = snapshot.routes.find((row) => row.route === "/api/a");

        expect(routeA).toBeDefined();
        expect(routeA?.recentQps).toBeCloseTo(2.5);
        expect(routeA?.avgQps).toBeCloseTo(1.234);
        expect(routeA?.errorRate).toBeCloseTo(5);
        expect(routeA?.avgLatencyMs).toBeCloseTo(40);
        expect(routeA?.p95Ms).toBeCloseTo(100);
        expect(routeA?.p99Ms).toBeNull();
        expect(routeA?.maxBucketMs).toBeCloseTo(100);
    });

    it("reads service and process gauges", () => {
        const snapshot = MetricsService.buildSnapshot(samples);

        expect(snapshot.service).toEqual({ name: "blog", version: "1.0.0", pid: "4321" });
        expect(snapshot.process.uptimeSeconds).toBe(90);
        expect(snapshot.connections.http).toBe(3);
        expect(snapshot.connections.onlineUsers).toBe(7);
    });
});

import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import * as echarts from "echarts";
import {
    FaChartLine,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaCode,
    FaExchangeAlt,
    FaExclamationTriangle,
    FaInfoCircle,
    FaMemory,
    FaMicrochip,
    FaNetworkWired,
    FaServer,
    FaSync,
    FaTachometerAlt,
    FaUsers,
} from "react-icons/fa";
import Button from "@/components/button/Button";
import ErrorState from "@/components/errorState/ErrorState";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import SearchBox from "@/components/searchBox/SearchBox";
import Selector from "@/components/selector/Selector";
import Switch from "@/components/switch/Switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useAsyncResource } from "@/hooks/UseAsyncResource";
import MetricsService, { type MetricSample, type RouteMetricsRow } from "@/services/MetricsService.ts";
import { getThemeFontFamily } from "@/utils/ThemeFont";
import styles from "./Metrics.module.css";

const PAGE_SIZE = 20;

type SortKey = "requests" | "recentQps" | "avgLatency" | "errorRate";

interface SummaryCard {
    key: string;
    icon: ReactNode;
    color: "blue" | "green" | "orange" | "red" | "purple";
    value: string;
    label: string;
    hint?: string;
    compact?: boolean;
}

function formatNumber(value: number, digits = 0): string {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function formatLatencyValue(ms: number): string {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(0)} μs`;
    }
    if (ms < 1000) {
        return `${ms.toFixed(2)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} s`;
}

function formatMemory(kb: number, fallback: string): string {
    if (kb <= 0) {
        return fallback;
    }
    const mb = kb / 1024;
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
}

const Metrics: FC = () => {
    const { t } = useTranslation("admin");
    const { preset } = useTheme();

    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("requests");
    const [page, setPage] = useState(1);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<RouteMetricsRow | null>(null);
    const [rawVisible, setRawVisible] = useState(false);

    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    const fetcher = useCallback((signal: AbortSignal) => MetricsService.getMetrics(signal), []);
    const { data: samples, loading, error, reload } = useAsyncResource<MetricSample[]>(fetcher, [], { timeoutMs: 15000 });

    const snapshot = useMemo(() => (samples ? MetricsService.buildSnapshot(samples) : null), [samples]);

    useEffect(() => {
        if (samples) {
            setLastUpdated(new Date());
        }
    }, [samples]);

    useEffect(() => {
        if (!autoRefresh) {
            return;
        }
        const timer = window.setInterval(reload, refreshInterval * 1000);
        return () => window.clearInterval(timer);
    }, [autoRefresh, refreshInterval, reload]);

    useEffect(() => {
        setPage(1);
    }, [search, sortKey]);

    useEffect(() => {
        if (!selectedRoute) {
            return;
        }
        const next = snapshot?.routes.find((row) => row.route === selectedRoute.route) ?? null;
        if (next !== selectedRoute) {
            setSelectedRoute(next);
        }
    }, [snapshot, selectedRoute]);

    const formatUptime = (totalSeconds: number): string => {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        const parts: string[] = [];
        if (days > 0) {
            parts.push(`${days}${t("metrics.units.day")}`);
        }
        if (days > 0 || hours > 0) {
            parts.push(`${hours}${t("metrics.units.hour")}`);
        }
        if (days > 0 || hours > 0 || minutes > 0) {
            parts.push(`${minutes}${t("metrics.units.minute")}`);
        }
        parts.push(`${remainder}${t("metrics.units.second")}`);
        return parts.join(" ");
    };

    const renderLatency = (ms: number | null, maxBucketMs: number): string => {
        if (ms !== null) {
            return formatLatencyValue(ms);
        }
        if (maxBucketMs > 0) {
            return t("metrics.format.overMaxBucket", { value: formatLatencyValue(maxBucketMs) });
        }
        return t("metrics.format.notAvailable");
    };

    const renderAverageLatency = (row: RouteMetricsRow): string => {
        if (row.count <= 0) {
            return t("metrics.format.notAvailable");
        }
        return formatLatencyValue(row.avgLatencyMs);
    };

    const chartRoutes = useMemo(() => {
        if (!snapshot) {
            return { useRecent: true, rows: [] as RouteMetricsRow[] };
        }
        const useRecent = snapshot.routes.some((row) => row.recentQps > 0);
        const rows = [...snapshot.routes].sort((a, b) => (useRecent ? b.recentQps - a.recentQps : b.avgQps - a.avgQps)).slice(0, 10);
        return { useRecent, rows };
    }, [snapshot]);

    useEffect(() => {
        if (chartRoutes.rows.length === 0) {
            chartInstance.current?.dispose();
            chartInstance.current = null;
            return;
        }

        if (!chartRef.current) {
            return;
        }

        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current, "light", { renderer: "canvas" });
        }

        const chart = chartInstance.current;
        const themeFont = getThemeFontFamily();
        const rows = chartRoutes.rows;
        const values = rows.map((row) => Number((chartRoutes.useRecent ? row.recentQps : row.avgQps).toFixed(3)));

        const option = {
            textStyle: {
                fontFamily: themeFont,
            },
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                backgroundColor: "#ffffff",
                borderColor: "#e1e5e9",
                borderWidth: 1,
                borderRadius: 6,
                padding: [8, 12],
                textStyle: {
                    color: "#333333",
                    fontSize: 12,
                    fontFamily: themeFont,
                },
                formatter: (params: any) => {
                    const point = Array.isArray(params) ? params[0] : params;
                    const row = rows[point?.dataIndex];
                    if (!row) {
                        return "";
                    }
                    return `
                        <div style="padding: 4px 0; max-width: 360px;">
                            <div style="font-weight: 600; margin-bottom: 4px; color: #333; word-break: break-all;">${row.route}</div>
                            <div style="color: #4361ee; font-weight: 500;">${t("metrics.chart.seriesName")}: ${Number(point.value).toFixed(2)}</div>
                        </div>
                    `;
                },
            },
            grid: {
                left: "2%",
                right: "6%",
                bottom: "2%",
                top: "2%",
                containLabel: true,
            },
            xAxis: {
                type: "value",
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: "#999999",
                    fontSize: 10,
                    formatter: (value: number) => value.toFixed(2),
                },
                splitLine: {
                    lineStyle: {
                        color: "#f0f0f0",
                        type: "dashed",
                        width: 1,
                        opacity: 0.6,
                    },
                },
            },
            yAxis: {
                type: "category",
                inverse: true,
                data: rows.map((row) => row.route),
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: "#666666",
                    fontSize: 11,
                    width: 280,
                    overflow: "truncate",
                    fontFamily: themeFont,
                },
            },
            series: [
                {
                    name: t("metrics.chart.seriesName"),
                    type: "bar",
                    data: values,
                    barMaxWidth: 18,
                    itemStyle: {
                        borderRadius: [0, 4, 4, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: "#4361ee" },
                            { offset: 1, color: "#7c9cff" },
                        ]),
                    },
                    label: {
                        show: true,
                        position: "right",
                        color: "#666666",
                        fontSize: 11,
                        formatter: (params: any) => Number(params.value).toFixed(2),
                    },
                    emphasis: {
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: "#3651d4" },
                                { offset: 1, color: "#6b8cff" },
                            ]),
                        },
                    },
                },
            ],
        };

        chart.setOption(option as echarts.EChartsOption, true);

        const handleResize = () => {
            chart.resize();
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [chartRoutes, preset, t]);

    useEffect(() => {
        return () => {
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    if (loading && !snapshot) {
        return (
            <div className={styles.metrics}>
                <Loading text={t("metrics.loading")} size="large" />
            </div>
        );
    }

    if (error && !snapshot) {
        return (
            <div className={styles.metrics}>
                <ErrorState
                    title={t("metrics.errorTitle")}
                    message={error instanceof Error ? error.message : undefined}
                    icon={<FaExclamationTriangle />}
                    actionText={t("metrics.errorRetry")}
                    onAction={reload}
                />
            </div>
        );
    }

    if (!snapshot) {
        return null;
    }

    const intervalOptions = [
        { label: t("metrics.interval.seconds10"), value: 10 },
        { label: t("metrics.interval.seconds30"), value: 30 },
        { label: t("metrics.interval.seconds60"), value: 60 },
    ];

    const sortOptions = [
        { label: t("metrics.table.sortOptions.requests"), value: "requests" },
        { label: t("metrics.table.sortOptions.recentQps"), value: "recentQps" },
        { label: t("metrics.table.sortOptions.avgLatency"), value: "avgLatency" },
        { label: t("metrics.table.sortOptions.errorRate"), value: "errorRate" },
    ];

    const systemTotal = snapshot.process.systemTotalKb;
    const systemAvailable = snapshot.process.systemAvailableKb;
    const systemUsed = systemTotal > 0 ? Math.max(0, systemTotal - systemAvailable) : 0;
    const systemUsedPercent = systemTotal > 0 ? Math.min(100, Math.max(0, (systemUsed / systemTotal) * 100)) : 0;

    const summaryCards: SummaryCard[] = [
        {
            key: "requests",
            icon: <FaExchangeAlt />,
            color: "blue",
            value: formatNumber(snapshot.totals.requests),
            label: t("metrics.summary.totalRequests"),
        },
        {
            key: "errors",
            icon: <FaExclamationTriangle />,
            color: "red",
            value: formatNumber(snapshot.totals.errors),
            label: t("metrics.summary.totalErrors"),
            hint: `${t("metrics.summary.errorRate")} ${snapshot.totals.errorRate.toFixed(2)}%`,
        },
        {
            key: "qps",
            icon: <FaTachometerAlt />,
            color: "purple",
            value: snapshot.totals.recentQps.toFixed(2),
            label: t("metrics.summary.currentQps"),
            hint: `${t("metrics.table.headers.avgQps")} ${snapshot.totals.avgQps.toFixed(2)}`,
        },
        {
            key: "connections",
            icon: <FaNetworkWired />,
            color: "green",
            value: formatNumber(snapshot.connections.http + snapshot.connections.ws),
            label: t("metrics.summary.activeConnections"),
            hint: t("metrics.summary.connectionDetail", {
                http: snapshot.connections.http,
                ws: snapshot.connections.ws,
            }),
        },
        {
            key: "online",
            icon: <FaUsers />,
            color: "orange",
            value: formatNumber(snapshot.connections.onlineUsers),
            label: t("metrics.summary.onlineUsers"),
        },
        {
            key: "uptime",
            icon: <FaClock />,
            color: "blue",
            value: formatUptime(snapshot.process.uptimeSeconds),
            label: t("metrics.summary.uptime"),
            compact: true,
        },
    ];

    const keyword = search.trim().toLowerCase();
    const matchedRoutes = keyword ? snapshot.routes.filter((row) => row.route.toLowerCase().includes(keyword)) : snapshot.routes;
    const sortedRoutes = [...matchedRoutes].sort((a, b) => {
        switch (sortKey) {
            case "recentQps":
                return b.recentQps - a.recentQps;
            case "avgLatency":
                return b.avgLatencyMs - a.avgLatencyMs;
            case "errorRate":
                return b.errorRate - a.errorRate;
            case "requests":
            default:
                return b.requests - a.requests;
        }
    });

    const totalPages = Math.max(1, Math.ceil(sortedRoutes.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageRoutes = sortedRoutes.slice(startIndex, startIndex + PAGE_SIZE);
    const hasRoutes = snapshot.routes.length > 0;
    const hasMatches = sortedRoutes.length > 0;

    return (
        <div className={styles.metrics}>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitleBlock}>
                    <h1 className={styles.pageTitle}>{t("metrics.title")}</h1>
                    <p className={styles.pageDescription}>{t("metrics.description")}</p>
                    <p className={styles.workerHint}>
                        <FaInfoCircle />
                        <span>{t("metrics.workerHint")}</span>
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.lastUpdated}>
                        {lastUpdated ? t("metrics.lastUpdated", { time: lastUpdated.toLocaleTimeString() }) : ""}
                    </span>
                    <Button variant="outline" size="small" onClick={() => setRawVisible(true)}>
                        <FaCode /> {t("metrics.rawData")}
                    </Button>
                    <Button size="small" loading={loading} onClick={reload}>
                        <FaSync /> {t("metrics.refresh")}
                    </Button>
                    <div className={styles.autoRefresh}>
                        <Switch checked={autoRefresh} onChange={(checked) => setAutoRefresh(checked)} size="small" />
                        <span>{t("metrics.autoRefresh")}</span>
                    </div>
                    <Selector
                        className={styles.intervalSelector}
                        options={intervalOptions}
                        value={refreshInterval}
                        onChange={(value) => setRefreshInterval(Number(value))}
                        disabled={!autoRefresh}
                        size="small"
                    />
                </div>
            </div>

            {error ? (
                <div className={styles.errorBanner}>
                    <FaExclamationTriangle />
                    <span>{t("metrics.staleError")}</span>
                </div>
            ) : null}

            <div className={styles.statsGrid}>
                {summaryCards.map((card) => (
                    <div key={card.key} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles[card.color]}`}>{card.icon}</div>
                        </div>
                        <div className={`${styles.statValue} ${card.compact ? styles.statValueCompact : ""}`}>{card.value}</div>
                        <div className={styles.statLabel}>{card.label}</div>
                        {card.hint ? <div className={styles.statHint}>{card.hint}</div> : null}
                    </div>
                ))}
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                        <FaServer />
                        <h3>{t("metrics.service.title")}</h3>
                    </div>
                    <div className={styles.infoRows}>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.service.name")}</span>
                            <strong>{snapshot.service?.name || t("metrics.service.unknown")}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.service.version")}</span>
                            <strong>{snapshot.service?.version || t("metrics.service.unknown")}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.service.pid")}</span>
                            <strong>{snapshot.service?.pid || t("metrics.service.unknown")}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                        <FaMemory />
                        <h3>{t("metrics.process.title")}</h3>
                    </div>
                    <div className={styles.infoRows}>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.process.rss")}</span>
                            <strong>{formatMemory(snapshot.process.rssKb, t("metrics.format.notAvailable"))}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.process.virtualMemory")}</span>
                            <strong>{formatMemory(snapshot.process.vmKb, t("metrics.format.notAvailable"))}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.process.threads")}</span>
                            <strong>{formatNumber(snapshot.process.threads)}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>{t("metrics.process.fibers")}</span>
                            <strong>{formatNumber(snapshot.process.fibers)}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                        <FaMicrochip />
                        <h3>{t("metrics.system.title")}</h3>
                    </div>
                    {systemTotal > 0 ? (
                        <div className={styles.memorySection}>
                            <div className={styles.memoryUsage}>
                                {t("metrics.system.usage", { percent: systemUsedPercent.toFixed(1) })}
                            </div>
                            <div className={styles.memoryBar}>
                                <div className={styles.memoryBarFill} style={{ width: `${systemUsedPercent}%` }} />
                            </div>
                            <div className={styles.memoryMeta}>
                                <span>
                                    {t("metrics.system.used", { used: formatMemory(systemUsed, t("metrics.format.notAvailable")) })}
                                </span>
                                <span>
                                    {t("metrics.system.available", {
                                        available: formatMemory(systemAvailable, t("metrics.format.notAvailable")),
                                    })}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.infoEmpty}>{t("metrics.system.unavailable")}</p>
                    )}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3 className={styles.cardTitle}>{t("metrics.chart.title")}</h3>
                        <p className={styles.cardSubtitle}>
                            {chartRoutes.useRecent ? t("metrics.chart.subtitle") : t("metrics.chart.subtitleAvg")}
                        </p>
                    </div>
                </div>
                {chartRoutes.rows.length > 0 ? (
                    <div className={styles.chartContainer} ref={chartRef} />
                ) : (
                    <div className={styles.emptyState}>{t("metrics.chart.empty")}</div>
                )}
            </div>

            <div className={`${styles.card} ${styles.tableCard}`}>
                <div className={styles.tableHeader}>
                    <div className={styles.tableTitleBlock}>
                        <h3 className={styles.cardTitle}>{t("metrics.table.title")}</h3>
                        <span className={styles.tableCount}>{t("metrics.table.count", { count: snapshot.routes.length })}</span>
                    </div>
                    <div className={styles.tableActions}>
                        <SearchBox
                            value={search}
                            onChange={(value) => setSearch(value)}
                            placeholder={t("metrics.table.searchPlaceholder")}
                            size="small"
                            className={styles.searchBox}
                        />
                        <Selector
                            className={styles.sortSelector}
                            options={sortOptions}
                            value={sortKey}
                            onChange={(value) => setSortKey(value as SortKey)}
                            size="small"
                        />
                    </div>
                </div>

                {!hasMatches ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <FaChartLine />
                        </div>
                        <p className={styles.emptyTitle}>{hasRoutes ? t("metrics.table.noMatch") : t("metrics.table.empty")}</p>
                        <p className={styles.emptyHint}>{hasRoutes ? t("metrics.table.noMatchHint") : t("metrics.table.emptyHint")}</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th scope="col">{t("metrics.table.headers.route")}</th>
                                        <th scope="col">{t("metrics.table.headers.requests")}</th>
                                        <th scope="col">{t("metrics.table.headers.errors")}</th>
                                        <th scope="col">{t("metrics.table.headers.errorRate")}</th>
                                        <th scope="col">{t("metrics.table.headers.recentQps")}</th>
                                        <th scope="col">{t("metrics.table.headers.avgQps")}</th>
                                        <th scope="col">{t("metrics.table.headers.avgLatency")}</th>
                                        <th scope="col">{t("metrics.table.headers.p95")}</th>
                                        <th scope="col">{t("metrics.table.headers.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRoutes.map((row) => (
                                        <tr key={row.route}>
                                            <td>
                                                <span className={styles.route} title={row.route}>
                                                    {row.route}
                                                </span>
                                            </td>
                                            <td>{formatNumber(row.requests)}</td>
                                            <td>{formatNumber(row.errors)}</td>
                                            <td>
                                                <span
                                                    className={`${styles.errorRate} ${
                                                        row.errorRate >= 10
                                                            ? styles.errorRateHigh
                                                            : row.errorRate > 0
                                                              ? styles.errorRateWarning
                                                              : ""
                                                    }`}
                                                >
                                                    {row.errorRate.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td>{row.recentQps.toFixed(2)}</td>
                                            <td>{row.avgQps.toFixed(2)}</td>
                                            <td>{renderAverageLatency(row)}</td>
                                            <td>{renderLatency(row.p95Ms, row.maxBucketMs)}</td>
                                            <td>
                                                <Button size="small" variant="ghost" onClick={() => setSelectedRoute(row)}>
                                                    {t("metrics.table.details")}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {sortedRoutes.length > PAGE_SIZE ? (
                            <div className={styles.pagination}>
                                <Button
                                    size="small"
                                    variant="outline"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                                >
                                    <FaChevronLeft /> {t("metrics.table.prev")}
                                </Button>
                                <span className={styles.pageInfo}>
                                    {t("metrics.table.pageInfo", { current: currentPage, total: totalPages })}
                                </span>
                                <Button
                                    size="small"
                                    variant="outline"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                >
                                    {t("metrics.table.next")} <FaChevronRight />
                                </Button>
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            {selectedRoute ? (
                <Modal
                    visible
                    title={`${t("metrics.detail.title")} · ${selectedRoute.route}`}
                    onClose={() => setSelectedRoute(null)}
                    size="large"
                    footer={
                        <Button variant="outline" onClick={() => setSelectedRoute(null)}>
                            {t("metrics.detail.close")}
                        </Button>
                    }
                >
                    <div className={styles.detailSummary}>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.requests")}</span>
                            <strong>{formatNumber(selectedRoute.requests)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.errors")}</span>
                            <strong>{formatNumber(selectedRoute.errors)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.errorRate")}</span>
                            <strong>{selectedRoute.errorRate.toFixed(2)}%</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.avgLatency")}</span>
                            <strong>{renderAverageLatency(selectedRoute)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.p95")}</span>
                            <strong>{renderLatency(selectedRoute.p95Ms, selectedRoute.maxBucketMs)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.p99")}</span>
                            <strong>{renderLatency(selectedRoute.p99Ms, selectedRoute.maxBucketMs)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.totalCount")}</span>
                            <strong>{formatNumber(selectedRoute.count)}</strong>
                        </div>
                        <div className={styles.detailSummaryItem}>
                            <span>{t("metrics.detail.summary.totalSum")}</span>
                            <strong>{formatLatencyValue(selectedRoute.sum * 1000)}</strong>
                        </div>
                    </div>

                    <h4 className={styles.detailSectionTitle}>{t("metrics.detail.buckets")}</h4>
                    {selectedRoute.buckets.length > 0 ? (
                        <div className={styles.bucketTableWrapper}>
                            <table className={styles.bucketTable}>
                                <thead>
                                    <tr>
                                        <th scope="col">{t("metrics.detail.bucketLe")}</th>
                                        <th scope="col">{t("metrics.detail.bucketCount")}</th>
                                        <th scope="col">{t("metrics.detail.bucketRatio")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRoute.buckets.map((bucket) => {
                                        const ratio = selectedRoute.count > 0 ? (bucket.cumulative / selectedRoute.count) * 100 : 0;
                                        return (
                                            <tr key={bucket.le}>
                                                <td>{formatLatencyValue(bucket.le * 1000)}</td>
                                                <td>{formatNumber(bucket.cumulative)}</td>
                                                <td>
                                                    <div className={styles.bucketRatioCell}>
                                                        <div className={styles.bucketBar}>
                                                            <div
                                                                className={styles.bucketBarFill}
                                                                style={{ width: `${Math.min(100, ratio)}%` }}
                                                            />
                                                        </div>
                                                        <span>{ratio.toFixed(2)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className={styles.detailEmpty}>{t("metrics.detail.noBuckets")}</p>
                    )}
                    <p className={styles.detailHint}>{t("metrics.detail.overflowHint")}</p>
                </Modal>
            ) : null}

            <Modal
                visible={rawVisible}
                title={t("metrics.rawDataTitle")}
                onClose={() => setRawVisible(false)}
                size="large"
                footer={
                    <Button variant="outline" onClick={() => setRawVisible(false)}>
                        {t("metrics.detail.close")}
                    </Button>
                }
            >
                <pre className={styles.rawJson}>{JSON.stringify(samples ?? [], null, 2)}</pre>
            </Modal>
        </div>
    );
};

export default Metrics;

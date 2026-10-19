import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as echarts from "echarts";
import { FaChartBar, FaCodeBranch, FaExclamationTriangle } from "react-icons/fa";
import Button from "@/components/button/Button";
import Loading from "@/components/loading/Loading";
import { useTheme } from "@/contexts/ThemeContext";
import RdPlatformService from "@/services/RdPlatformService.ts";
import type { RdPrDistributionData, RdPrDistributionPoint, RdPrDistributionRange } from "@/types/RdPlatform.ts";
import { getThemeFontFamily } from "@/utils/ThemeFont";
import styles from "./PrDistributionChart.module.css";

interface PrDistributionChartProps {
    /** 当前选中的组织；为空时由后端决定统计范围（管理员为全部组织） */
    orgId?: string;
}

/** 单个时间桶的合入率，0-100 */
const getMergeRate = (point: RdPrDistributionPoint): number => {
    if (point.total <= 0) {
        return 0;
    }
    return Math.min(100, Math.round((point.merged * 1000) / point.total) / 10);
};

const formatRate = (value: number): string => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

const PrDistributionChart: React.FC<PrDistributionChartProps> = ({ orgId = "" }) => {
    const { t } = useTranslation("rd");
    const { theme, preset } = useTheme();
    const [range, setRange] = useState<RdPrDistributionRange>("3m");
    const [data, setData] = useState<RdPrDistributionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const chartRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);

    const loadData = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setLoading(true);
        setError("");
        try {
            const next = await RdPlatformService.getPrDistribution({
                orgId: orgId || undefined,
                range,
            });
            if (requestId !== requestIdRef.current) {
                return;
            }
            setData(next);
        } catch (err: any) {
            if (requestId !== requestIdRef.current) {
                return;
            }
            setError(err?.message || t("prDistribution.errorHint"));
            setData(null);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [orgId, range, t]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        const container = chartRef.current;
        if (!container || !data || data.points.length === 0) {
            return;
        }

        const chart = echarts.init(container);
        const rootStyles = getComputedStyle(document.documentElement);
        const textColor = rootStyles.getPropertyValue("--text-secondary").trim() || "#64748b";
        const borderColor = rootStyles.getPropertyValue("--border-primary").trim() || "#e5e7eb";
        const cardBg = rootStyles.getPropertyValue("--card-bg").trim() || "#ffffff";
        const themeFont = getThemeFontFamily();

        const points = data.points;
        const labels = points.map((point) => {
            const [, month, day] = point.date.split("-");
            return `${month}-${day}`;
        });
        const seriesTotal = t("prDistribution.seriesTotal");
        const seriesMerged = t("prDistribution.seriesMerged");
        const seriesRate = t("prDistribution.seriesRate");
        const labelTotal = t("prDistribution.tooltipTotal");
        const labelMerged = t("prDistribution.tooltipMerged");
        const labelRate = t("prDistribution.tooltipRate");

        chart.setOption({
            textStyle: { fontFamily: themeFont },
            color: ["#2563eb", "#10b981", "#f59e0b"],
            tooltip: {
                trigger: "axis",
                confine: true,
                axisPointer: { type: "shadow" },
                backgroundColor: cardBg,
                borderColor,
                textStyle: { color: textColor, fontSize: 12 },
                formatter: (params: any) => {
                    const list = Array.isArray(params) ? params : [params];
                    const index = list[0]?.dataIndex ?? 0;
                    const point = points[index];
                    if (!point) {
                        return "";
                    }
                    const title = data.granularity === "week" ? `${point.date} ~ ${point.endDate}` : point.date;
                    const rate = formatRate(getMergeRate(point));
                    return [
                        `<div style="font-weight:600;margin-bottom:6px;color:inherit">${title}</div>`,
                        `<div style="display:flex;justify-content:space-between;gap:24px"><span>${labelTotal}</span><b>${point.total}</b></div>`,
                        `<div style="display:flex;justify-content:space-between;gap:24px"><span>${labelMerged}</span><b>${point.merged}</b></div>`,
                        `<div style="display:flex;justify-content:space-between;gap:24px"><span>${labelRate}</span><b>${rate}</b></div>`,
                    ].join("");
                },
            },
            legend: {
                top: 0,
                right: 8,
                itemWidth: 12,
                itemHeight: 8,
                itemGap: 16,
                textStyle: { color: textColor, fontSize: 12 },
            },
            grid: { top: 42, right: 14, bottom: 8, left: 10, containLabel: true },
            xAxis: {
                type: "category",
                data: labels,
                axisLine: { lineStyle: { color: borderColor } },
                axisTick: { show: false },
                axisLabel: {
                    color: textColor,
                    fontSize: 11,
                    interval: 0,
                    hideOverlap: true,
                    rotate: data.granularity === "week" ? 35 : 0,
                },
            },
            yAxis: [
                {
                    type: "value",
                    minInterval: 1,
                    splitLine: { lineStyle: { color: borderColor } },
                    axisLabel: { color: textColor, fontSize: 11 },
                },
                {
                    type: "value",
                    min: 0,
                    max: 100,
                    interval: 25,
                    splitLine: { show: false },
                    axisLabel: { color: textColor, fontSize: 11, formatter: "{value}%" },
                },
            ],
            series: [
                {
                    name: seriesTotal,
                    type: "bar",
                    data: points.map((point) => point.total),
                    barMaxWidth: 22,
                    barGap: "15%",
                    barCategoryGap: "38%",
                    itemStyle: { borderRadius: [4, 4, 0, 0] },
                },
                {
                    name: seriesMerged,
                    type: "bar",
                    data: points.map((point) => point.merged),
                    barMaxWidth: 22,
                    itemStyle: { borderRadius: [4, 4, 0, 0] },
                },
                {
                    name: seriesRate,
                    type: "line",
                    yAxisIndex: 1,
                    data: points.map(getMergeRate),
                    smooth: true,
                    symbol: "circle",
                    symbolSize: 6,
                    lineStyle: { width: 2 },
                    itemStyle: { color: "#f59e0b" },
                },
            ],
        });

        const handleResize = () => chart.resize();
        window.addEventListener("resize", handleResize);

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(handleResize);
            observer.observe(container);
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            observer?.disconnect();
            chart.dispose();
        };
    }, [data, t, theme, preset]);

    const points = data?.points ?? [];
    const summary = data?.summary;
    const hasData = data ? data.summary.total > 0 || points.some((point) => point.total > 0 || point.merged > 0) : false;
    const showChart = !loading && !error && hasData;
    const showEmpty = !loading && !error && !hasData;
    const description = range === "3m" ? t("prDistribution.description3m") : t("prDistribution.description15d");

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div className={styles.heading}>
                    <h2 className={styles.title}>
                        <FaCodeBranch />
                        {t("prDistribution.title")}
                    </h2>
                    <p className={styles.description}>{description}</p>
                </div>
                <div className={styles.rangeSwitch} role="group" aria-label={t("prDistribution.rangeAria")}>
                    <Button
                        size="small"
                        color={range === "15d" ? "primary" : "secondary"}
                        variant={range === "15d" ? "solid" : "light"}
                        className={styles.rangeButton}
                        onClick={() => setRange("15d")}
                    >
                        {t("prDistribution.range15d")}
                    </Button>
                    <Button
                        size="small"
                        color={range === "3m" ? "primary" : "secondary"}
                        variant={range === "3m" ? "solid" : "light"}
                        className={styles.rangeButton}
                        onClick={() => setRange("3m")}
                    >
                        {t("prDistribution.range3m")}
                    </Button>
                </div>
            </div>

            <div className={styles.card}>
                {summary && (
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryItem}>
                            <span className={`${styles.dot} ${styles.dotTotal}`} />
                            <span className={styles.summaryLabel}>{t("prDistribution.summaryTotal")}</span>
                            <strong className={styles.summaryValue}>{summary.total}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={`${styles.dot} ${styles.dotMerged}`} />
                            <span className={styles.summaryLabel}>{t("prDistribution.summaryMerged")}</span>
                            <strong className={styles.summaryValue}>{summary.merged}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={`${styles.dot} ${styles.dotRate}`} />
                            <span className={styles.summaryLabel}>{t("prDistribution.summaryRate")}</span>
                            <strong className={styles.summaryValue}>{formatRate(summary.mergeRate)}</strong>
                        </div>
                        <span className={styles.granularity}>
                            {data?.granularity === "week" ? t("prDistribution.byWeek") : t("prDistribution.byDay")}
                        </span>
                    </div>
                )}

                <div className={styles.body}>
                    {loading && (
                        <div className={styles.state}>
                            <Loading size="small" text={t("prDistribution.loading")} />
                        </div>
                    )}
                    {!loading && error && (
                        <div className={styles.state}>
                            <FaExclamationTriangle className={styles.stateIcon} />
                            <p className={styles.stateTitle}>{t("prDistribution.errorTitle")}</p>
                            <p className={styles.stateText}>{error}</p>
                            <Button size="small" variant="light" onClick={loadData}>
                                {t("prDistribution.retry")}
                            </Button>
                        </div>
                    )}
                    {showEmpty && (
                        <div className={styles.state}>
                            <FaChartBar className={styles.stateIcon} />
                            <p className={styles.stateTitle}>{t("prDistribution.emptyTitle")}</p>
                            <p className={styles.stateText}>{t("prDistribution.emptyHint")}</p>
                        </div>
                    )}
                    {showChart && <div ref={chartRef} className={styles.chart} role="img" aria-label={t("prDistribution.title")} />}
                </div>
            </div>
        </section>
    );
};

export default PrDistributionChart;

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as echarts from "echarts";
import { FaArrowDown, FaArrowUp, FaBug, FaChartLine, FaClock, FaClipboardCheck, FaCodeBranch } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/button/Button";
import ErrorState from "@/components/errorState/ErrorState";
import Loading from "@/components/loading/Loading";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { useTheme } from "@/contexts/ThemeContext";
import RdPlatformService from "@/services/RdPlatformService.ts";
import type { RdTrendAnalysisData } from "@/types/RdPlatform.ts";
import { getThemeFontFamily } from "@/utils/ThemeFont";
import styles from "./TrendAnalysis.module.css";

type TrendPeriod = 7 | 30;
type HealthTone = "success" | "danger" | "primary" | "warning";

const parseTrendPeriod = (value: string | null): TrendPeriod => (value === "7" ? 7 : 30);

const TrendAnalysis: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useTranslation("rd");
    const { selectedOrgId, loading: orgLoading } = useRdOrg();
    const { preset } = useTheme();
    const [trendData, setTrendData] = useState<RdTrendAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const throughputRef = useRef<HTMLDivElement>(null);
    const backlogRef = useRef<HTMLDivElement>(null);
    const distributionRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);

    const periodDays = parseTrendPeriod(searchParams.get("period"));
    const axisLabelInterval = periodDays === 30 ? 2 : 0;

    const handlePeriodChange = (period: TrendPeriod) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("period", String(period));
        setSearchParams(nextParams, { replace: true });
    };

    const loadTrends = useCallback(async () => {
        if (orgLoading) {
            return;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setLoading(true);
        setError("");
        try {
            const data = await RdPlatformService.getTrends({
                orgId: selectedOrgId || undefined,
                periodDays,
                granularity: "day",
            });
            if (requestId !== requestIdRef.current) {
                return;
            }
            setTrendData(data);
        } catch (err: any) {
            if (requestId !== requestIdRef.current) {
                return;
            }
            setError(err?.message || t("trend.errorTitle"));
            setTrendData(null);
        } finally {
            if (requestId !== requestIdRef.current) {
                return;
            }
            setLoading(false);
        }
    }, [orgLoading, periodDays, selectedOrgId, t]);

    useEffect(() => {
        loadTrends();
    }, [loadTrends]);

    const workDistribution = useMemo(() => {
        if (!trendData) {
            return [];
        }
        return [
            { name: t("trend.distRequirementDelivery"), value: trendData.workDistribution.requirementDelivery },
            { name: t("trend.distBugFix"), value: trendData.workDistribution.bugFix },
            { name: t("trend.distRdTask"), value: trendData.workDistribution.rdTask },
            { name: t("trend.distCodeReview"), value: trendData.workDistribution.codeReview },
        ];
    }, [trendData, t]);

    const teamHealth = useMemo(() => {
        if (!trendData) {
            return [];
        }
        return [
            { label: t("trend.healthThroughput"), value: trendData.teamHealth.throughput, tone: "success" as HealthTone },
            { label: t("trend.healthBugPressure"), value: trendData.teamHealth.bugPressure, tone: "danger" as HealthTone },
            { label: t("trend.healthReviewEfficiency"), value: trendData.teamHealth.reviewEfficiency, tone: "primary" as HealthTone },
            { label: t("trend.healthReworkRisk"), value: trendData.teamHealth.reworkRisk, tone: "warning" as HealthTone },
        ];
    }, [trendData, t]);

    useEffect(() => {
        if (!trendData || trendData.series.length === 0) {
            return;
        }

        const charts: echarts.ECharts[] = [];
        const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim() || "#64748b";
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border-primary").trim() || "#e5e7eb";
        const themeFont = getThemeFontFamily();

        if (throughputRef.current) {
            const chart = echarts.init(throughputRef.current);
            chart.setOption({
                textStyle: { fontFamily: themeFont },
                color: ["#2563eb", "#10b981", "#ef4444"],
                tooltip: { trigger: "axis" },
                legend: { top: 0, textStyle: { color: textColor } },
                grid: { top: 42, right: 18, bottom: 28, left: 36 },
                xAxis: {
                    type: "category",
                    data: trendData.series.map((item) => item.date),
                    axisLine: { lineStyle: { color: borderColor } },
                    axisLabel: { color: textColor, interval: axisLabelInterval, rotate: periodDays === 30 ? 30 : 0 },
                },
                yAxis: {
                    type: "value",
                    splitLine: { lineStyle: { color: borderColor } },
                    axisLabel: { color: textColor },
                },
                series: [
                    {
                        name: t("trend.seriesRequirements"),
                        type: "line",
                        smooth: true,
                        data: trendData.series.map((item) => item.requirements),
                    },
                    {
                        name: t("trend.seriesCompleted"),
                        type: "line",
                        smooth: true,
                        data: trendData.series.map((item) => item.completed),
                    },
                    { name: t("trend.seriesBugs"), type: "line", smooth: true, data: trendData.series.map((item) => item.bugs) },
                ],
            });
            charts.push(chart);
        }

        if (backlogRef.current) {
            const chart = echarts.init(backlogRef.current);
            chart.setOption({
                textStyle: { fontFamily: themeFont },
                color: ["#3b82f6", "#f59e0b", "#ef4444"],
                tooltip: { trigger: "axis" },
                legend: { top: 0, textStyle: { color: textColor } },
                grid: { top: 42, right: 18, bottom: 28, left: 36 },
                xAxis: {
                    type: "category",
                    data: trendData.series.map((item) => item.date),
                    axisLine: { lineStyle: { color: borderColor } },
                    axisLabel: { color: textColor, interval: axisLabelInterval, rotate: periodDays === 30 ? 30 : 0 },
                },
                yAxis: {
                    type: "value",
                    splitLine: { lineStyle: { color: borderColor } },
                    axisLabel: { color: textColor },
                },
                series: [
                    { name: t("trend.seriesTasks"), type: "bar", stack: "total", data: trendData.series.map((item) => item.tasks) },
                    {
                        name: t("trend.seriesReopened"),
                        type: "bar",
                        stack: "risk",
                        data: trendData.series.map((item) => item.reopened),
                    },
                    {
                        name: t("trend.seriesCycleTime"),
                        type: "line",
                        smooth: true,
                        data: trendData.series.map((item) => item.cycleTime),
                    },
                ],
            });
            charts.push(chart);
        }

        if (distributionRef.current) {
            const chart = echarts.init(distributionRef.current);
            chart.setOption({
                textStyle: { fontFamily: themeFont },
                color: ["#2563eb", "#ef4444", "#10b981", "#8b5cf6"],
                tooltip: { trigger: "item" },
                legend: { bottom: 0, textStyle: { color: textColor } },
                series: [
                    {
                        name: t("trend.seriesWorkDistribution"),
                        type: "pie",
                        radius: ["46%", "70%"],
                        center: ["50%", "43%"],
                        avoidLabelOverlap: true,
                        label: { formatter: "{b}\n{d}%" },
                        data: workDistribution,
                    },
                ],
            });
            charts.push(chart);
        }

        const handleResize = () => charts.forEach((chart) => chart.resize());
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            charts.forEach((chart) => chart.dispose());
        };
    }, [axisLabelInterval, periodDays, trendData, workDistribution, t, preset]);

    if ((loading || orgLoading) && !trendData) {
        return <Loading text={t("trend.loading")} />;
    }

    if (error && !trendData) {
        return <ErrorState title={t("trend.errorTitle")} message={error} actionText={t("trend.retry")} onAction={loadTrends} />;
    }

    if (!trendData || trendData.series.length === 0) {
        return (
            <ErrorState
                title={t("trend.emptyTitle")}
                message={t("trend.emptyMessage")}
                actionText={t("trend.retry")}
                onAction={loadTrends}
            />
        );
    }

    const { summary } = trendData;

    return (
        <div className={styles.trends}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("trend.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("trend.pageDescription", { days: periodDays })}</p>
                </div>
                <div className={styles.pageActions}>
                    {loading && <span className={styles.refreshing}>{t("trend.refreshing")}</span>}
                    <div className={styles.periodSwitch} aria-label={t("trend.periodAria")}>
                        <Button
                            size="small"
                            color={periodDays === 7 ? "primary" : "secondary"}
                            variant={periodDays === 7 ? "solid" : "light"}
                            className={styles.periodButton}
                            onClick={() => handlePeriodChange(7)}
                        >
                            {t("trend.period7")}
                        </Button>
                        <Button
                            size="small"
                            color={periodDays === 30 ? "primary" : "secondary"}
                            variant={periodDays === 30 ? "solid" : "light"}
                            className={styles.periodButton}
                            onClick={() => handlePeriodChange(30)}
                        >
                            {t("trend.period30")}
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={`${styles.metricIcon} ${styles.primary}`}>
                        <FaClipboardCheck />
                    </div>
                    <div className={styles.metricValue}>{summary.completedTotal}</div>
                    <div className={styles.metricLabel}>{t("trend.completedTotal")}</div>
                    <div className={summary.taskDelta >= 0 ? styles.metricMeta : styles.metricMetaWarn}>
                        {summary.taskDelta >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                        {t("trend.taskDelta", { value: `${summary.taskDelta >= 0 ? "+" : ""}${summary.taskDelta}` })}
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <div className={`${styles.metricIcon} ${styles.danger}`}>
                        <FaBug />
                    </div>
                    <div className={styles.metricValue}>{summary.bugTotal}</div>
                    <div className={styles.metricLabel}>{t("trend.bugTotal")}</div>
                    <div className={styles.metricMetaMuted}>{t("trend.bugHint")}</div>
                </div>
                <div className={styles.metricCard}>
                    <div className={`${styles.metricIcon} ${styles.success}`}>
                        <FaCodeBranch />
                    </div>
                    <div className={styles.metricValue}>{summary.avgReviewPassRate}%</div>
                    <div className={styles.metricLabel}>{t("trend.avgReviewPassRate")}</div>
                    <div className={styles.metricMeta}>
                        <FaArrowUp /> {t("trend.reviewHint")}
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <div className={`${styles.metricIcon} ${styles.warning}`}>
                        <FaClock />
                    </div>
                    <div className={styles.metricValue}>{t("trend.avgCycleTimeValue", { value: summary.avgCycleTime })}</div>
                    <div className={styles.metricLabel}>{t("trend.avgCycleTime")}</div>
                    <div className={summary.cycleDelta <= 0 ? styles.metricMeta : styles.metricMetaWarn}>
                        {summary.cycleDelta <= 0 ? <FaArrowDown /> : <FaArrowUp />}
                        {t("trend.cycleDelta", { value: summary.cycleDelta })}
                    </div>
                </div>
            </div>

            <div className={styles.chartGrid}>
                <section className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2>{t("trend.throughputTitle")}</h2>
                        <span>{t("trend.throughputSubtitle")}</span>
                    </div>
                    <div ref={throughputRef} className={styles.chartContainer} />
                </section>

                <section className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2>{t("trend.backlogTitle")}</h2>
                        <span>{t("trend.backlogSubtitle")}</span>
                    </div>
                    <div ref={backlogRef} className={styles.chartContainer} />
                </section>

                <section className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2>{t("trend.distributionTitle")}</h2>
                        <span>{t("trend.distributionSubtitle", { days: periodDays })}</span>
                    </div>
                    <div ref={distributionRef} className={styles.chartContainer} />
                </section>

                <section className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2>{t("trend.healthTitle")}</h2>
                        <span>{t("trend.healthSubtitle")}</span>
                    </div>
                    <div className={styles.healthList}>
                        {teamHealth.map((item) => (
                            <div key={item.label} className={styles.healthItem}>
                                <div className={styles.healthLabel}>
                                    <span>{item.label}</span>
                                    <strong>{item.value}%</strong>
                                </div>
                                <div className={styles.healthTrack}>
                                    <div className={`${styles.healthBar} ${styles[item.tone]}`} style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className={styles.insightSection}>
                <div className={styles.insightTitle}>
                    <FaChartLine />
                    {t("trend.insightTitle")}
                </div>
                <div className={styles.insightGrid}>
                    {trendData.insights.map((item) => (
                        <div key={item.title} className={styles.insightCard}>
                            <h3>{item.title}</h3>
                            <p>{item.content}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TrendAnalysis;

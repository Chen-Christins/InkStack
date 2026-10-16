import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as echarts from "echarts";
import type { UserStats } from "@/services/AuthService.ts";
import styles from "../PersonalCenter.module.css";

interface Props {
    stats: UserStats;
}

const COLORS = {
    blue: "#3b82f6",
    green: "#10b981",
    red: "#ef4444",
    purple: "#8b5cf6",
    orange: "#f59e0b",
    teal: "#14b8a6",
    gray: "#94a3b8",
};

const StatsTab: React.FC<Props> = ({ stats }) => {
    const { t } = useTranslation("personal");
    const compositionRef = useRef<HTMLDivElement>(null);
    const engagementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const charts: echarts.ECharts[] = [];

        // 文章构成（已发布 / 私密 / 其他）
        if (compositionRef.current) {
            const chart = echarts.init(compositionRef.current, "light", { renderer: "canvas" });
            const others = Math.max(0, stats.total_articles - stats.published_articles - stats.private_articles);
            chart.setOption({
                tooltip: { trigger: "item", formatter: t("stats.compositionTooltip") },
                legend: {
                    bottom: 0,
                    left: "center",
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: { color: "#64748b", fontSize: 12 },
                },
                series: [
                    {
                        name: t("stats.compositionSeries"),
                        type: "pie",
                        radius: ["45%", "70%"],
                        center: ["50%", "45%"],
                        avoidLabelOverlap: true,
                        itemStyle: { borderColor: "#fff", borderWidth: 2 },
                        label: { show: false },
                        data: [
                            { value: stats.published_articles, name: t("stats.statusPublished"), itemStyle: { color: COLORS.green } },
                            { value: stats.private_articles, name: t("stats.statusPrivate"), itemStyle: { color: COLORS.purple } },
                            { value: others, name: t("stats.statusOthers"), itemStyle: { color: COLORS.gray } },
                        ],
                    },
                ],
            });
            charts.push(chart);
        }

        // 平均每篇互动（浏览 / 点赞 / 评论）
        if (engagementRef.current) {
            const chart = echarts.init(engagementRef.current, "light", { renderer: "canvas" });
            const avgViews = stats.published_articles > 0 ? Math.round(stats.total_views / stats.published_articles) : 0;
            const avgLikes = stats.published_articles > 0 ? Math.round(stats.total_likes / stats.published_articles) : 0;
            const avgComments = stats.published_articles > 0 ? Math.round(stats.total_comments / stats.published_articles) : 0;
            chart.setOption({
                tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: t("stats.engagementTooltip") },
                grid: { left: "3%", right: "6%", bottom: "6%", top: "12%", containLabel: true },
                xAxis: {
                    type: "category",
                    data: [t("stats.axisViews"), t("stats.axisLikes"), t("stats.axisComments")],
                    axisLine: { lineStyle: { color: "#e1e5e9" } },
                    axisLabel: { color: "#64748b" },
                },
                yAxis: {
                    type: "value",
                    splitLine: { lineStyle: { color: "#eef2f7" } },
                    axisLabel: { color: "#94a3b8" },
                },
                series: [
                    {
                        type: "bar",
                        barWidth: "46%",
                        itemStyle: { borderRadius: [6, 6, 0, 0] },
                        data: [
                            { value: avgViews, itemStyle: { color: COLORS.blue } },
                            { value: avgLikes, itemStyle: { color: COLORS.red } },
                            { value: avgComments, itemStyle: { color: COLORS.purple } },
                        ],
                        label: { show: true, position: "top", color: "#475569", fontWeight: 600 },
                    },
                ],
            });
            charts.push(chart);
        }

        const handleResize = () => charts.forEach((c) => c.resize());
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            charts.forEach((c) => c.dispose());
        };
    }, [stats, t]);

    const avgViews = stats.published_articles > 0 ? Math.round(stats.total_views / stats.published_articles) : 0;
    const avgLikes = stats.published_articles > 0 ? Math.round(stats.total_likes / stats.published_articles) : 0;
    const avgComments = stats.published_articles > 0 ? Math.round(stats.total_comments / stats.published_articles) : 0;
    const others = Math.max(0, stats.total_articles - stats.published_articles - stats.private_articles);

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("stats.title")}</h2>
            </div>

            <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>{t("stats.compositionTitle")}</h3>
                    <div ref={compositionRef} className={styles.chartCanvas} />
                </div>
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>{t("stats.engagementTitle")}</h3>
                    <div ref={engagementRef} className={styles.chartCanvas} />
                </div>
            </div>

            <div className={styles.statsDetails}>
                <h3>{t("stats.detailTitle")}</h3>

                <div className={styles.detailTable}>
                    <div className={styles.detailCaption}>{t("stats.articleOverview")}</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.totalArticles")}</span>
                        <span className={styles.detailValue}>{t("stats.articlesValue", { value: stats.total_articles })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.publishedArticles")}</span>
                        <span className={styles.detailValue}>{t("stats.articlesValue", { value: stats.published_articles })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.privateArticles")}</span>
                        <span className={styles.detailValue}>{t("stats.articlesValue", { value: stats.private_articles })}</span>
                    </div>
                    {others > 0 && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>{t("stats.others")}</span>
                            <span className={styles.detailValue}>{t("stats.articlesValue", { value: others })}</span>
                        </div>
                    )}
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.tags")}</span>
                        <span className={styles.detailValue}>{t("stats.countValue", { value: stats.total_tags })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.organizations")}</span>
                        <span className={styles.detailValue}>{t("stats.countValue", { value: stats.total_organizations })}</span>
                    </div>
                </div>

                <div className={styles.detailTable}>
                    <div className={styles.detailCaption}>{t("stats.engagementOverview")}</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.totalViews")}</span>
                        <span className={styles.detailValue}>
                            {t("stats.timesValue", { value: stats.total_views.toLocaleString() })}
                        </span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.totalLikes")}</span>
                        <span className={styles.detailValue}>{t("stats.countValue", { value: stats.total_likes })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.totalComments")}</span>
                        <span className={styles.detailValue}>{t("stats.commentValue", { value: stats.total_comments })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.avgViews")}</span>
                        <span className={styles.detailValue}>{t("stats.viewsPerArticle", { value: avgViews })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.avgLikes")}</span>
                        <span className={styles.detailValue}>{t("stats.likesPerArticle", { value: avgLikes })}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>{t("stats.avgComments")}</span>
                        <span className={styles.detailValue}>{t("stats.commentsPerArticle", { value: avgComments })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsTab;

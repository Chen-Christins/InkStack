import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaUsers, FaEye, FaChartLine, FaUserCheck } from "react-icons/fa";
import StatsService from "@/services/StatsService.ts";
import { useOnlineCount } from "@/hooks/UseOnlineCount.ts";
import Skeleton from "@/components/skeleton/Skeleton";
import type { StatsData } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./StatsPanel.module.css";

const POLL_INTERVAL = 30_000; // 30 秒轮询一次 HTTP 统计

const StatsPanel: React.FC = () => {
    const { t } = useTranslation("components");
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [httpStats, setHttpStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const onlineUsers = useOnlineCount(); // 实时 WebSocket 推送
    const onlineLoading = authLoading || (isAuthenticated ? onlineUsers === null : loading);

    useEffect(() => {
        let cancelled = false;

        const fetchStats = () => {
            StatsService.getStats()
                .then((data) => {
                    if (cancelled) {
                        return;
                    }
                    setHttpStats(data);
                })
                .catch((err: any) => {
                    console.error("获取站点统计失败:", err?.message || err);
                })
                .finally(() => {
                    if (!cancelled) {
                        setLoading(false);
                    }
                });
        };

        fetchStats();
        const timer = setInterval(fetchStats, POLL_INTERVAL);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const statsItems = [
        {
            title: t("statsPanel.onlineUsers"),
            value: isAuthenticated ? onlineUsers : (httpStats?.onlineUsers ?? "-"),
            loading: onlineLoading,
            icon: <FaUsers className={styles.statIcon} />,
            color: styles.online,
        },
        {
            title: t("statsPanel.todayVisits"),
            value: httpStats?.todayVisits ?? "-",
            loading,
            icon: <FaChartLine className={styles.statIcon} />,
            color: styles.today,
        },
        {
            title: t("statsPanel.totalVisits"),
            value: httpStats?.totalVisits.toLocaleString() ?? "-",
            loading,
            icon: <FaEye className={styles.statIcon} />,
            color: styles.total,
        },
        {
            title: t("statsPanel.totalVisitors"),
            value: httpStats?.totalVisitors.toLocaleString() ?? "-",
            loading,
            icon: <FaUserCheck className={styles.statIcon} />,
            color: styles.visitors,
        },
    ];

    return (
        <div className={styles.statsPanel}>
            <h3 className={styles.panelTitle}>
                <FaChartLine className={styles.titleIcon} /> {t("statsPanel.title")}
            </h3>
            <div className={styles.statsGrid} aria-busy={loading || onlineLoading}>
                {statsItems.map((item, index) => (
                    <div key={index} className={styles.statItem}>
                        <div className={item.color}>{item.icon}</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>
                                {item.loading ? <Skeleton width={48} height="1.575rem" /> : item.value}
                            </div>
                            <div className={styles.statTitle}>{item.title}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsPanel;

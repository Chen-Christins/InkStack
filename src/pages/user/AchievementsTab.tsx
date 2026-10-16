import React from "react";
import { useTranslation } from "react-i18next";
import { FaFire, FaPenNib, FaComments, FaStar, FaMedal, FaCode, FaHeart, FaRocket, FaTrophy } from "react-icons/fa";
import styles from "./UserPage.module.css";
import acStyles from "./Achievements.module.css";
import { AuthService, type AchievementData, type AchievementBadge } from "@/services/AuthService.ts";
import message from "@/components/message/Message";
import { useAsyncResource } from "@/hooks/UseAsyncResource";

const ICON_MAP: Record<string, React.ReactNode> = {
    pen: <FaPenNib />,
    heart: <FaHeart />,
    fire: <FaFire />,
    code: <FaCode />,
    star: <FaStar />,
    comments: <FaComments />,
    rocket: <FaRocket />,
    trophy: <FaTrophy />,
};

const LEVEL_COLORS = ["var(--bg-tertiary)", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

const AchievementsTab: React.FC = () => {
    const { t } = useTranslation("user");
    const { data, loading } = useAsyncResource<AchievementData | null>(async () => {
        try {
            return await AuthService.getAchievements();
        } catch (err: any) {
            message.error(err?.message || t("achievements.messages.loadFailed"));
            throw err;
        }
    }, []);

    const stats = data?.stats;
    const badges: AchievementBadge[] = data?.badges ?? [];
    const heatmap: number[][] = data?.heatmap ?? [];
    const totalContributions = stats?.total_contributions ?? 0;

    const months = [
        t("achievements.months.jan"),
        t("achievements.months.feb"),
        t("achievements.months.mar"),
        t("achievements.months.apr"),
        t("achievements.months.may"),
        t("achievements.months.jun"),
        t("achievements.months.jul"),
        t("achievements.months.aug"),
        t("achievements.months.sep"),
        t("achievements.months.oct"),
        t("achievements.months.nov"),
        t("achievements.months.dec"),
    ];
    const weekdays = ["", t("achievements.weekdays.mon"), "", t("achievements.weekdays.wed"), "", t("achievements.weekdays.fri"), ""];

    if (loading) {
        return (
            <div className={styles.tabWrap} style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
                {t("achievements.loading")}
            </div>
        );
    }

    return (
        <div className={styles.tabWrap}>
            <div className={acStyles.statsRow}>
                {[
                    {
                        label: t("achievements.stats.totalContributions"),
                        value: totalContributions,
                        icon: <FaFire />,
                        color: "#f97316",
                    },
                    {
                        label: t("achievements.stats.publishedArticles"),
                        value: stats?.published_articles ?? 0,
                        icon: <FaPenNib />,
                        color: "#3b82f6",
                    },
                    {
                        label: t("achievements.stats.totalLikes"),
                        value: stats?.total_likes ?? 0,
                        icon: <FaHeart />,
                        color: "#ef4444",
                    },
                    {
                        label: t("achievements.stats.unlockedBadges"),
                        value: `${stats?.unlocked_badges ?? 0}/${stats?.total_badges ?? 0}`,
                        icon: <FaMedal />,
                        color: "#eab308",
                    },
                ].map((s) => (
                    <div key={s.label} className={acStyles.statCard}>
                        <div className={acStyles.statIcon} style={{ color: s.color, background: `${s.color}1a` }}>
                            {s.icon}
                        </div>
                        <div>
                            <div className={acStyles.statValue}>{s.value}</div>
                            <div className={acStyles.statLabel}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                    <FaFire /> {t("achievements.heatmap.title")}
                </h2>
                <p className={styles.cardDesc}>{t("achievements.heatmap.desc", { total: totalContributions })}</p>
                <div className={acStyles.heatmapScroll}>
                    <div className={acStyles.heatmap}>
                        <div className={acStyles.months}>
                            {months.map((m, i) => (
                                <span key={i} className={acStyles.monthLabel}>
                                    {m}
                                </span>
                            ))}
                        </div>
                        <div className={acStyles.gridWrap}>
                            <div className={acStyles.weekdays}>
                                {weekdays.map((d, i) => (
                                    <span key={i} className={acStyles.weekdayLabel}>
                                        {d}
                                    </span>
                                ))}
                            </div>
                            <div className={acStyles.grid}>
                                {heatmap.map((col, wi) => (
                                    <div key={wi} className={acStyles.col}>
                                        {col.map((level, di) => (
                                            <div
                                                key={di}
                                                className={acStyles.cell}
                                                style={{ background: LEVEL_COLORS[level] ?? LEVEL_COLORS[0] }}
                                                title={t("achievements.heatmap.level", { level })}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={acStyles.legend}>
                            <span>{t("achievements.heatmap.less")}</span>
                            {LEVEL_COLORS.map((c, i) => (
                                <span key={i} className={acStyles.cell} style={{ background: c }} />
                            ))}
                            <span>{t("achievements.heatmap.more")}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                    <FaMedal /> {t("achievements.badges.title")}
                </h2>
                <div className={acStyles.badgeGrid}>
                    {badges.map((b) => (
                        <div key={b.id} className={`${acStyles.badge} ${!b.unlocked ? acStyles.badgeLocked : ""}`}>
                            <div className={acStyles.badgeIcon} style={{ color: b.color, background: `${b.color}1a` }}>
                                {ICON_MAP[b.icon] ?? <FaMedal />}
                            </div>
                            <div className={acStyles.badgeName}>{b.name}</div>
                            <div className={acStyles.badgeDesc}>{b.desc}</div>
                            {b.unlocked ? (
                                <span className={acStyles.badgeUnlocked}>{t("achievements.badges.unlocked")}</span>
                            ) : (
                                <span className={acStyles.badgeProgress}>{b.progress}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AchievementsTab;

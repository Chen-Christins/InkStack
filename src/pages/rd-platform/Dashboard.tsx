import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { formatDateTime } from "@/utils/Utils.ts";
import { FaClipboardList, FaBug, FaTasks, FaExclamationTriangle, FaCode } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import Loading from "@/components/loading/Loading";
import { encodeId } from "@/utils/HashId.ts";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "@/services/RdPlatformService.ts";
import AssigneeDisplay from "@/components/assigneeDisplay/AssigneeDisplay";
import PrDistributionChart from "./PrDistributionChart";
import type { RdStats, Requirement, Bug, Task } from "@/types/RdPlatform.ts";

const Dashboard: React.FC = () => {
    const { t } = useTranslation("rd");
    const navigate = useRdNavigate();
    const { selectedOrgId } = useRdOrg();
    const [stats, setStats] = useState<RdStats | null>(null);
    const [recentRequirements, setRecentRequirements] = useState<Requirement[]>([]);
    const [recentBugs, setRecentBugs] = useState<Bug[]>([]);
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [reviewStats, setReviewStats] = useState({ totalReviews: 0, pendingReviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const orgIds = selectedOrgId ? [selectedOrgId] : undefined;
                const [s, reqs, bugs, tasks] = await Promise.all([
                    RdAPI.getStats(orgIds),
                    RdAPI.getRequirements({ page: 1, pageSize: 5, organizationIds: orgIds }),
                    RdAPI.getBugs({ page: 1, pageSize: 5, organizationIds: orgIds }),
                    RdAPI.getTasks({ page: 1, pageSize: 5, organizationIds: orgIds }),
                ]);
                setStats(s);
                setRecentRequirements(reqs.data);
                setRecentBugs(bugs.data);
                setRecentTasks(tasks.data);
                setReviewStats({ totalReviews: s.totalReviews ?? 0, pendingReviews: s.pendingReviews ?? 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedOrgId]);

    if (loading) {
        return <Loading />;
    }

    const statusText: Record<string, string> = {
        new: t("dashboard.status.new"),
        developing: t("dashboard.status.developing"),
        testing: t("dashboard.status.testing"),
        done: t("dashboard.status.done"),
        closed: t("dashboard.status.closed"),
        accepted: t("dashboard.status.accepted"),
        processing: t("dashboard.status.processing"),
        verified: t("dashboard.status.verified"),
        reopened: t("dashboard.status.reopened"),
        todo: t("dashboard.status.todo"),
        doing: t("dashboard.status.doing"),
    };

    const priorityText: Record<string, string> = {
        urgent: t("dashboard.priority.urgent"),
        high: t("dashboard.priority.high"),
        medium: t("dashboard.priority.medium"),
        low: t("dashboard.priority.low"),
    };

    const severityText: Record<string, string> = {
        fatal: t("dashboard.severity.fatal"),
        serious: t("dashboard.severity.serious"),
        normal: t("dashboard.severity.normal"),
        minor: t("dashboard.severity.minor"),
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("dashboard.title")}</h1>
                    <p className={styles.pageDescription}>{t("dashboard.description")}</p>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard} onClick={() => navigate("/rd/requirements")}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaClipboardList />
                    </div>
                    <div className={styles.statValue}>{stats?.totalRequirements ?? 0}</div>
                    <div className={styles.statLabel}>{t("dashboard.stats.totalRequirements")}</div>
                    <div className={styles.statSub}>
                        {t("dashboard.stats.openRequirements", { value: stats?.openRequirements ?? 0 })}
                    </div>
                </div>
                <div className={styles.statCard} onClick={() => navigate("/rd/bugs")}>
                    <div className={`${styles.statIcon} ${styles.danger}`}>
                        <FaBug />
                    </div>
                    <div className={styles.statValue}>{stats?.totalBugs ?? 0}</div>
                    <div className={styles.statLabel}>{t("dashboard.stats.totalBugs")}</div>
                    <div className={styles.statSub}>{t("dashboard.stats.unresolvedBugs", { value: stats?.unresolvedBugs ?? 0 })}</div>
                </div>
                <div className={styles.statCard} onClick={() => navigate("/rd/tasks")}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaTasks />
                    </div>
                    <div className={styles.statValue}>{stats?.totalTasks ?? 0}</div>
                    <div className={styles.statLabel}>{t("dashboard.stats.totalTasks")}</div>
                    <div className={styles.statSub}>{t("dashboard.stats.overdueTasks", { value: stats?.overdueTasks ?? 0 })}</div>
                </div>
                <div className={styles.statCard} onClick={() => navigate("/rd/reviews")}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaCode />
                    </div>
                    <div className={styles.statValue}>{reviewStats.totalReviews}</div>
                    <div className={styles.statLabel}>{t("dashboard.stats.totalReviews")}</div>
                    <div className={styles.statSub}>{t("dashboard.stats.pendingReviews", { value: reviewStats.pendingReviews })}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaExclamationTriangle />
                    </div>
                    <div className={styles.statValue}>{(stats?.openRequirements ?? 0) + (stats?.unresolvedBugs ?? 0)}</div>
                    <div className={styles.statLabel}>{t("dashboard.stats.pendingWorkItems")}</div>
                    <div className={styles.statSub}>{t("dashboard.stats.requirementsAndBugs")}</div>
                </div>
            </div>

            {/* PR 分布 */}
            <PrDistributionChart orgId={selectedOrgId} />

            {/* 最近的需求 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t("dashboard.requirements.title")}</h2>
                    <button className={styles.viewAllBtn} onClick={() => navigate("/rd/requirements")}>
                        {t("dashboard.viewAll")}
                    </button>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t("dashboard.table.title")}</th>
                                <th>{t("dashboard.table.priority")}</th>
                                <th>{t("dashboard.table.status")}</th>
                                <th>{t("dashboard.table.assignee")}</th>
                                <th>{t("dashboard.table.createdAt")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRequirements.map((r) => (
                                <tr
                                    key={r.id}
                                    className={styles.clickableRow}
                                    onClick={() => navigate(`/rd/requirements/${encodeId(r.id, "requirement")}`)}
                                >
                                    <td data-label={t("dashboard.table.title")}>{r.title}</td>
                                    <td data-label={t("dashboard.table.priority")}>
                                        <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>
                                            {priorityText[r.priority]}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.status")}>
                                        <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>
                                            {statusText[r.status] || r.status}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.assignee")}>
                                        <AssigneeDisplay name={r.assignee} avatar={r.assigneeAvatar} />
                                    </td>
                                    <td data-label={t("dashboard.table.createdAt")}>{formatDateTime(r.createdAt)}</td>
                                </tr>
                            ))}
                            {recentRequirements.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>
                                        <div className={styles.emptyCellIcon}>
                                            <FaClipboardList />
                                        </div>
                                        <div className={styles.emptyCellText}>{t("dashboard.requirements.empty")}</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 最近的缺陷 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t("dashboard.bugs.title")}</h2>
                    <button className={styles.viewAllBtn} onClick={() => navigate("/rd/bugs")}>
                        {t("dashboard.viewAll")}
                    </button>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t("dashboard.table.title")}</th>
                                <th>{t("dashboard.table.severity")}</th>
                                <th>{t("dashboard.table.priority")}</th>
                                <th>{t("dashboard.table.status")}</th>
                                <th>{t("dashboard.table.assignee")}</th>
                                <th>{t("dashboard.table.createdAt")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBugs.map((b) => (
                                <tr
                                    key={b.id}
                                    className={styles.clickableRow}
                                    onClick={() => navigate(`/rd/bugs/${encodeId(b.id, "bug")}`)}
                                >
                                    <td data-label={t("dashboard.table.title")}>{b.title}</td>
                                    <td data-label={t("dashboard.table.severity")}>
                                        <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>
                                            {severityText[b.severity]}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.priority")}>
                                        <span className={`${styles.badge} ${styles[`priority_${b.priority}`]}`}>
                                            {priorityText[b.priority]}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.status")}>
                                        <span className={`${styles.badge} ${styles[`status_${b.status}`]}`}>
                                            {statusText[b.status] || b.status}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.assignee")}>
                                        <AssigneeDisplay name={b.assignee} avatar={b.assigneeAvatar} />
                                    </td>
                                    <td data-label={t("dashboard.table.createdAt")}>{formatDateTime(b.createdAt)}</td>
                                </tr>
                            ))}
                            {recentBugs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.emptyCell}>
                                        <div className={styles.emptyCellIcon}>
                                            <FaBug />
                                        </div>
                                        <div className={styles.emptyCellText}>{t("dashboard.bugs.empty")}</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 最近的任务 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t("dashboard.tasks.title")}</h2>
                    <button className={styles.viewAllBtn} onClick={() => navigate("/rd/tasks")}>
                        {t("dashboard.viewAll")}
                    </button>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t("dashboard.table.title")}</th>
                                <th>{t("dashboard.table.status")}</th>
                                <th>{t("dashboard.table.priority")}</th>
                                <th>{t("dashboard.table.assignee")}</th>
                                <th>{t("dashboard.table.deadline")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTasks.map((task) => (
                                <tr
                                    key={task.id}
                                    className={styles.clickableRow}
                                    onClick={() => navigate(`/rd/tasks/${encodeId(task.id, "task")}`)}
                                >
                                    <td data-label={t("dashboard.table.title")}>{task.title}</td>
                                    <td data-label={t("dashboard.table.status")}>
                                        <span className={`${styles.badge} ${styles[`status_${task.status}`]}`}>
                                            {statusText[task.status]}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.priority")}>
                                        <span className={`${styles.badge} ${styles[`priority_${task.priority}`]}`}>
                                            {priorityText[task.priority]}
                                        </span>
                                    </td>
                                    <td data-label={t("dashboard.table.assignee")}>
                                        <AssigneeDisplay name={task.assignee} avatar={task.assigneeAvatar} />
                                    </td>
                                    <td data-label={t("dashboard.table.deadline")}>
                                        {task.deadline ? formatDateTime(task.deadline) : "-"}
                                    </td>
                                </tr>
                            ))}
                            {recentTasks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>
                                        <div className={styles.emptyCellIcon}>
                                            <FaTasks />
                                        </div>
                                        <div className={styles.emptyCellText}>{t("dashboard.tasks.empty")}</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

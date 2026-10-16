import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { encodeId } from "@/utils/HashId.ts";
import { FaCheckCircle, FaExclamationCircle, FaArrowRight, FaCalendarAlt, FaClipboardList, FaTasks, FaEye } from "react-icons/fa";
import Skeleton from "@/components/skeleton/Skeleton";
import AuthRequired from "@/components/auth/AuthRequired";
import AssignmentService from "@/services/AssignmentService.ts";
import { useAsyncResource } from "@/hooks/UseAsyncResource";
import styles from "./AssignmentList.module.css";
import ErrorState from "@/components/errorState/ErrorState";

interface Assignment {
    id: string | number;
    name: string;
    description: string;
    subject_name: string;
    end_time: number;
    status: number;
    priority: number;
    create_time: number;
    file_size: number;
    file_type: string;
}

const STATUS_MAP: { [key: number]: string } = {
    1: "open", // 开启中
    2: "closed", // 已关闭
};

const AssignmentList: React.FC = () => {
    const { t } = useTranslation("assignment");
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
    const {
        data: assignments = [],
        loading: dataLoading,
        error,
    } = useAsyncResource<Assignment[]>(async () => {
        const response = await AssignmentService.getUserAssignments();
        return response.list || [];
    }, []);

    const filteredAssignments = assignments.filter((item) => {
        if (filter === "all") {
            return true;
        }
        const statusString = STATUS_MAP[item.status] || "pending";
        return statusString === filter;
    });

    const getStatusBadge = (status: number) => {
        const statusString = STATUS_MAP[status] || "open";
        switch (statusString) {
            case "open":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> {t("list.status.open")}
                    </span>
                );
            case "closed":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                        <FaExclamationCircle /> {t("list.status.closed")}
                    </span>
                );
            default:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> {t("list.status.open")}
                    </span>
                );
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <AuthRequired message={t("list.authRequired")}>
                    <>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>
                                <FaTasks /> {t("list.pageTitle")}
                            </h1>
                            <div className={styles.filterBar}>
                                <button
                                    className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                                    onClick={() => setFilter("all")}
                                >
                                    {t("list.filter.all")}
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "open" ? styles.active : ""}`}
                                    onClick={() => setFilter("open")}
                                >
                                    {t("list.filter.open")}
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "closed" ? styles.active : ""}`}
                                    onClick={() => setFilter("closed")}
                                >
                                    {t("list.filter.closed")}
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className={styles.errorState}>
                                <ErrorState
                                    title={t("list.loadFailed")}
                                    message={error instanceof Error ? error.message : t("list.fetchFailed")}
                                    icon={<FaExclamationCircle />}
                                    actionText={t("list.backToList")}
                                    onAction={() => navigate("/assignments")}
                                />
                            </div>
                        ) : dataLoading ? (
                            <div className={styles.grid}>
                                {/* 骨架屏加载状态 */}
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <Skeleton variant="rectangular" width={100} height={24} style={{ borderRadius: "6px" }} />
                                            <Skeleton variant="rounded" width={80} height={24} style={{ borderRadius: "30px" }} />
                                        </div>

                                        <div style={{ margin: "1rem 0" }}>
                                            <Skeleton variant="text" width="80%" height={28} style={{ marginBottom: "0.5rem" }} />
                                            <Skeleton variant="text" lines={2} />
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.deadline} style={{ width: "120px" }}>
                                                <Skeleton variant="text" width="100%" />
                                            </div>
                                            <Skeleton variant="rectangular" width={100} height={36} style={{ borderRadius: "8px" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredAssignments.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredAssignments.map((item) => (
                                    <div key={item.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.courseBadge}>{item.subject_name}</span>
                                            {getStatusBadge(item.status)}
                                        </div>

                                        <h3 className={styles.cardTitle}>{item.name}</h3>
                                        <p className={styles.cardDesc}>{item.description}</p>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.deadline}>
                                                <FaCalendarAlt />
                                                {t("list.deadline", { value: formatDate(item.end_time) })}
                                            </div>
                                            <div className={styles.buttonGroup}>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.viewBtn}`}
                                                    onClick={() =>
                                                        navigate(`/assignment/submissions/${encodeId(item.id, "assignment")}`)
                                                    }
                                                    title={t("list.viewSubmissions")}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${STATUS_MAP[item.status] === "closed" ? styles.btnSecondary : styles.btnPrimary}`}
                                                    onClick={() => navigate(`/assignment/submit/${encodeId(item.id, "assignment")}`)}
                                                >
                                                    {STATUS_MAP[item.status] === "closed" ? t("list.viewDetails") : t("list.goSubmit")}{" "}
                                                    <FaArrowRight />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaClipboardList className={styles.emptyIcon} />
                                <h3 className={styles.emptyText}>{t("list.empty.title")}</h3>
                                <p className={styles.emptySubtext}>{t("list.empty.subtext")}</p>
                            </div>
                        )}
                    </>
                </AuthRequired>
            </div>
        </div>
    );
};

export default AssignmentList;

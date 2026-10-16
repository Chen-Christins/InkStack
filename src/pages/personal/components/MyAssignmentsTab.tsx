import React, { useMemo, useState } from "react";
import { FaArrowRight, FaCalendarAlt, FaCheckCircle, FaClipboardList, FaExclamationCircle, FaEye, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button/Button";
import CustomSelect from "@/components/customSelect/CustomSelect";
import ErrorState from "@/components/errorState/ErrorState";
import Input from "@/components/input/Input";
import Skeleton from "@/components/skeleton/Skeleton";
import AssignmentService, { type GetUserAssignmentsResponse } from "@/services/AssignmentService.ts";
import type { SelectOption } from "@/types";
import { encodeId } from "@/utils/HashId.ts";
import { useAsyncResource } from "@/hooks/UseAsyncResource";
import styles from "../PersonalCenter.module.css";

type Assignment = GetUserAssignmentsResponse["list"][number];
type AssignmentFilter = "all" | "open" | "closed";

const STATUS_MAP: Record<number, AssignmentFilter> = {
    1: "open",
    2: "closed",
};

const MyAssignmentsTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const navigate = useNavigate();

    const filterOptions: SelectOption[] = [
        { id: "all", name: t("assignments.filterAll"), color: "#6b7280" },
        { id: "open", name: t("assignments.statusOpen"), color: "#10b981" },
        { id: "closed", name: t("assignments.statusClosed"), color: "#ef4444" },
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<AssignmentFilter>("all");
    const [selectedFilter, setSelectedFilter] = useState<SelectOption | null>(filterOptions[0]);

    const {
        data: assignments = [],
        loading,
        error,
        reload,
    } = useAsyncResource<Assignment[]>(async () => {
        const response = await AssignmentService.getUserAssignments();
        return response.list || [];
    }, []);

    const filteredAssignments = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return assignments.filter((item) => {
            const status = STATUS_MAP[item.status] || "open";
            const matchesStatus = filter === "all" || status === filter;
            const matchesKeyword =
                !keyword ||
                item.name.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.subject_name.toLowerCase().includes(keyword);

            return matchesStatus && matchesKeyword;
        });
    }, [assignments, filter, searchTerm]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const getStatusBadge = (status: number) => {
        const statusString = STATUS_MAP[status] || "open";
        return statusString === "closed" ? (
            <span className={`${styles.assignmentStatus} ${styles.assignmentStatusClosed}`}>
                <FaExclamationCircle />
                {t("assignments.statusClosed")}
            </span>
        ) : (
            <span className={`${styles.assignmentStatus} ${styles.assignmentStatusOpen}`}>
                <FaCheckCircle />
                {t("assignments.statusOpen")}
            </span>
        );
    };

    const handleFilterChange = (option: SelectOption | null) => {
        setSelectedFilter(option);
        setFilter((option?.id as AssignmentFilter | undefined) || "all");
    };

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("assignments.title")}</h2>
            </div>

            <div className={styles.searchFilterBar}>
                <Input
                    value={searchTerm}
                    onChange={setSearchTerm}
                    prefix={<FaSearch />}
                    placeholder={t("assignments.searchPlaceholder")}
                    allowClear
                    className={styles.assignmentSearchInput}
                />
                <CustomSelect
                    name={t("assignments.statusName")}
                    options={filterOptions}
                    value={selectedFilter}
                    onChange={handleFilterChange}
                    className={`${styles.statusSelect} ${styles.assignmentStatusSelect}`}
                    hideBadge={true}
                />
            </div>

            {error ? (
                <ErrorState
                    title={t("assignments.loadFailed")}
                    message={error instanceof Error ? error.message : t("assignments.loadFailedMessage")}
                    icon={<FaExclamationCircle />}
                    actionText={t("assignments.reload")}
                    onAction={reload}
                />
            ) : loading ? (
                <div className={styles.assignmentsGrid}>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className={styles.assignmentCard}>
                            <div className={styles.assignmentCardHeader}>
                                <Skeleton variant="rounded" width={96} height={24} />
                                <Skeleton variant="rounded" width={72} height={24} />
                            </div>
                            <Skeleton variant="text" width="70%" height={26} />
                            <Skeleton variant="text" lines={2} />
                            <div className={styles.assignmentFooter}>
                                <Skeleton variant="text" width={120} />
                                <Skeleton variant="rounded" width={112} height={34} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className={styles.emptyState}>
                    <FaClipboardList className={styles.emptyIcon} />
                    <h3>{t("assignments.emptyTitle")}</h3>
                    <p>{t("assignments.emptyDescription")}</p>
                </div>
            ) : (
                <div className={styles.assignmentsGrid}>
                    {filteredAssignments.map((item) => {
                        const closed = STATUS_MAP[item.status] === "closed";

                        return (
                            <div key={item.id} className={styles.assignmentCard}>
                                <div className={styles.assignmentCardHeader}>
                                    <span className={styles.assignmentSubject}>{item.subject_name}</span>
                                    {getStatusBadge(item.status)}
                                </div>

                                <h3 className={styles.assignmentTitle}>{item.name}</h3>
                                <p className={styles.assignmentDescription}>{item.description || t("assignments.noDescription")}</p>

                                <div className={styles.assignmentMeta}>
                                    <span>
                                        <FaCalendarAlt />
                                        {t("assignments.deadline", { date: formatDate(item.end_time) })}
                                    </span>
                                    <span>{Math.round(item.file_size)} MB</span>
                                    <span>{item.file_type}</span>
                                </div>

                                <div className={styles.assignmentFooter}>
                                    <Button
                                        variant="light"
                                        color="secondary"
                                        size="small"
                                        className={styles.assignmentIconButton}
                                        onClick={() => navigate(`/assignment/submissions/${encodeId(item.id, "assignment")}`)}
                                    >
                                        <FaEye />
                                        {t("assignments.submissions")}
                                    </Button>
                                    <Button
                                        color={closed ? "secondary" : "primary"}
                                        variant={closed ? "light" : "solid"}
                                        size="small"
                                        onClick={() => navigate(`/assignment/submit/${encodeId(item.id, "assignment")}`)}
                                    >
                                        {closed ? t("assignments.viewDetail") : t("assignments.goSubmit")}
                                        <FaArrowRight />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyAssignmentsTab;

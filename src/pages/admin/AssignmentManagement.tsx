import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaBookOpen,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaFlag,
} from "react-icons/fa";
import DatePicker from "@/components/datePicker/DatePicker";
import { formatDateTime } from "@/utils/Utils.ts";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import Modal from "@/components/modal/Modal";
import styles from "./AssignmentManagement.module.css";
import AssignmentService, { type AssignmentStatsResponse } from "@/services/AssignmentService.ts";
import { AssignmentStatus, AssignmentPriority } from "@/types/Enums.ts";
import { useInitialLoaded } from "@/hooks/UseInitialLoaded";

// 模拟任务数据接口
interface Assignment {
    id: string;
    title: string;
    courseName: string;
    organizationName: string;
    assignedBy: string;
    deadline: string;
    status: "active" | "draft" | "closed";
    submissionCount: number;
    totalStudents: number;
    createdAt: string;
    description?: string;
    priority: "low" | "medium" | "high" | "urgent";
    maxFileSize?: number; // MB
    allowedTypes?: string[];
}

const STATE_STR_MAP_NUMBER: Record<string, number> = {
    [AssignmentStatus.DRAFT]: AssignmentStatus.DRAFT,
    [AssignmentStatus.OPEN]: AssignmentStatus.OPEN,
    [AssignmentStatus.CLOSED]: AssignmentStatus.CLOSED,
};

const STATE_NUMBER_MAP_STR: Record<number, string> = {
    [AssignmentStatus.DRAFT]: "draft",
    [AssignmentStatus.OPEN]: "active",
    [AssignmentStatus.CLOSED]: "closed",
};

const PRIORITY_STR_MAP_NUMBER: Record<string, number> = {
    low: AssignmentPriority.LOW,
    medium: AssignmentPriority.MEDIUM,
    high: AssignmentPriority.HIGH,
    urgent: AssignmentPriority.URGENT,
};

const PRIORITY_NUMBER_MAP_STR: Record<number, string> = {
    [AssignmentPriority.LOW]: "low",
    [AssignmentPriority.MEDIUM]: "medium",
    [AssignmentPriority.HIGH]: "high",
    [AssignmentPriority.URGENT]: "urgent",
};

const AssignmentManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const [loading, setLoading] = useState(true);
    const initialLoaded = useInitialLoaded(loading);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);

    // 统计数据
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        closed: 0,
        draft: 0,
    });

    const fetchStats = async () => {
        try {
            const res: AssignmentStatsResponse = await AssignmentService.getAdminAssignmentStats();
            setStats({
                total: res.total_assignments,
                active: res.active_assignments,
                closed: res.closed_assignments,
                draft: res.draft_assignments,
            });
        } catch (error) {
            console.error("获取统计数据失败:", error);
        }
    };

    // 模态框状态
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
    const [formData, setFormData] = useState<Partial<Assignment>>({
        title: "",
        courseName: "",
        deadline: "",
        status: "draft",
        description: "",
        priority: "medium",
        maxFileSize: 50,
        allowedTypes: [],
    });
    const [allowedTypesInput, setAllowedTypesInput] = useState("");

    const pageSize = 10;

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                page_num: currentPage,
                page_size: pageSize,
            };
            if (statusFilter !== "all") {
                params.state = STATE_STR_MAP_NUMBER[statusFilter];
            }

            const res = await AssignmentService.getAdminAssignments(params);

            const mappedList: Assignment[] = (res.list || []).map((item) => ({
                id: String(item.id),
                title: item.name,
                courseName: item.subject_name,
                organizationName: item.organization_name || "",
                assignedBy: item.assigned_by || "",
                deadline: formatDateTime(item.end_time),
                status: STATE_NUMBER_MAP_STR[Number(item.status)] as "active" | "draft" | "closed",
                submissionCount: 0, // 暂无数据
                totalStudents: 0, // 暂无数据
                createdAt: formatDateTime(item.create_time),
                description: item.description,
                priority: PRIORITY_NUMBER_MAP_STR[item.priority] as "low" | "medium" | "high" | "urgent",
                maxFileSize: item.file_size,
                allowedTypes: item.file_type ? item.file_type.split(",") : [],
            }));
            console.log("任务列表数据:", mappedList);
            setAssignments(mappedList);
            setTotal(res.total);
        } catch (error) {
            console.error("获取任务列表失败:", error);
            message.error(t("assignments.message.fetchListFailed"));
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, statusFilter]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    useEffect(() => {
        fetchStats();
    }, []);

    // 打开编辑模态框
    const openEditModal = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        // 将格式化的时间字符串转换为ISO格式供DatePicker使用
        const deadlineDate = assignment.deadline ? new Date(assignment.deadline.replace(/\//g, "-")) : null;
        setFormData({
            title: assignment.title,
            courseName: assignment.courseName,
            deadline: deadlineDate ? deadlineDate.toISOString() : "",
            status: assignment.status,
            priority: assignment.priority,
            description: assignment.description || "",
            maxFileSize: assignment.maxFileSize || 50,
            allowedTypes: assignment.allowedTypes || [],
        });
        setAllowedTypesInput(assignment.allowedTypes?.join(", ") || "");
        setIsModalVisible(true);
    };

    // 打开预览模态框
    const openPreviewModal = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        setIsPreviewVisible(true);
    };

    // 打开创建模态框
    const openCreateModal = () => {
        setCurrentAssignment(null);
        setFormData({
            title: "",
            courseName: "",
            deadline: "",
            status: "draft",
            description: "",
            priority: "medium",
            maxFileSize: 50,
            allowedTypes: [],
        });
        setAllowedTypesInput("");
        setIsModalVisible(true);
    };

    // 处理表单提交
    const handleSubmit = async () => {
        if (
            !formData.title ||
            !formData.courseName ||
            !formData.deadline ||
            !formData.priority ||
            !formData.maxFileSize ||
            !formData.description ||
            !formData.allowedTypes ||
            formData.allowedTypes.length === 0
        ) {
            message.error(t("assignments.message.incomplete"));
            return;
        }

        setLoading(true);
        try {
            if (currentAssignment) {
                // 编辑模式
                await AssignmentService.createAssignment({
                    id: currentAssignment.id,
                    name: formData.title!,
                    subject_name: formData.courseName!,
                    end_time: String(Math.floor(new Date(formData.deadline!).getTime() / 1000)),
                    file_size: formData.maxFileSize || 50,
                    status: String(STATE_STR_MAP_NUMBER[formData.status || "draft"]),
                    file_type: formData.allowedTypes?.join(",") || "",
                    description: formData.description || "",
                    priority: PRIORITY_STR_MAP_NUMBER[formData.priority || "medium"],
                });
                await fetchAssignments(); // 刷新列表
                fetchStats();
                message.success(t("assignments.message.updateSuccess"));
            } else {
                // 创建模式
                await AssignmentService.createAssignment({
                    name: formData.title!,
                    subject_name: formData.courseName!,
                    end_time: String(Math.floor(new Date(formData.deadline!).getTime() / 1000)),
                    file_size: formData.maxFileSize || 50,
                    status: String(STATE_STR_MAP_NUMBER[formData.status || "draft"]),
                    priority: PRIORITY_STR_MAP_NUMBER[formData.priority || "medium"],
                    file_type: formData.allowedTypes?.join(",") || "",
                    description: formData.description || "",
                });
                await fetchAssignments(); // 刷新列表
                fetchStats();
                message.success(t("assignments.message.publishSuccess"));
            }
            setIsModalVisible(false);
        } catch (error: any) {
            console.error("操作失败:", error);
            message.error(error.message || t("assignments.message.operationFailed"));
        } finally {
            setLoading(false);
        }
    };

    // 筛选逻辑 (仅在当前页搜索)
    const filteredAssignments = assignments.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.assignedBy.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // 分页逻辑
    const totalPages = Math.ceil(total / pageSize);
    const currentData = filteredAssignments;
    const startIndex = (currentPage - 1) * pageSize;

    // 生成页码数组
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (start > 1) {
                pages.push(1);
                if (start > 2) {
                    pages.push("...");
                }
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) {
                    pages.push("...");
                }
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: t("assignments.delete.title"),
            content: t("assignments.delete.content"),
            confirmText: t("assignments.delete.confirmText"),
            cancelText: t("assignments.delete.cancelText"),
        });

        if (isConfirmed) {
            setLoading(true);
            try {
                await AssignmentService.deleteAssignments({ ids: id });
                await fetchAssignments(); // 刷新列表
                fetchStats();
                message.success(t("assignments.delete.success"));
            } catch (error) {
                console.error("删除失败:", error);
                message.error(t("assignments.delete.error"));
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        <FaCheckCircle /> {t("assignments.status.active")}
                    </span>
                );
            case "draft":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusDraft}`}>
                        <FaEdit /> {t("assignments.status.draft")}
                    </span>
                );
            case "closed":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusClosed}`}>
                        <FaTimesCircle /> {t("assignments.status.closed")}
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading && !initialLoaded) {
        return <Loading />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("assignments.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("assignments.pageDescription")}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
                        <FaPlus /> {t("assignments.publishTask")}
                    </button>
                </div>
            </div>
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaBookOpen />
                    </div>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>{t("assignments.stats.total")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statValue}>{stats.active}</div>
                    <div className={styles.statLabel}>{t("assignments.stats.active")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTimesCircle />
                    </div>
                    <div className={styles.statValue}>{stats.closed}</div>
                    <div className={styles.statLabel}>{t("assignments.stats.closed")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaEdit />
                    </div>
                    <div className={styles.statValue}>{stats.draft}</div>
                    <div className={styles.statLabel}>{t("assignments.stats.draft")}</div>
                </div>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        {t("assignments.filter.title")}
                    </h3>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("assignments.filter.searchLabel")}</label>
                        <Input
                            placeholder={t("assignments.filter.searchPlaceholder")}
                            value={searchTerm}
                            onChange={(value) => setSearchTerm(value)}
                            prefix={<FaSearch />}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("assignments.filter.statusLabel")}</label>
                        <CustomSelect
                            name={t("assignments.filter.statusSelectName")}
                            options={[
                                { id: "all", name: t("assignments.status.all"), color: "var(--text-secondary)" },
                                { id: "active", name: t("assignments.status.active"), color: "var(--success)" },
                                { id: "closed", name: t("assignments.status.closed"), color: "var(--error)" },
                                { id: "draft", name: t("assignments.status.draft"), color: "var(--warning)" },
                            ]}
                            value={{
                                id: statusFilter,
                                name:
                                    statusFilter === "all"
                                        ? t("assignments.status.all")
                                        : statusFilter === "active"
                                          ? t("assignments.status.active")
                                          : statusFilter === "closed"
                                            ? t("assignments.status.closed")
                                            : t("assignments.status.draft"),
                                color: "",
                            }}
                            onChange={(option) => setStatusFilter(option ? String(option.id) : "all")}
                            placeholder={t("assignments.filter.statusPlaceholder")}
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>{t("assignments.table.title")}</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                            {t("assignments.table.totalTasks", { total })}
                        </span>
                    </div>
                </div>
                <table className={styles.assignmentTable}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>{t("assignments.table.headers.info")}</th>
                            <th>{t("assignments.table.headers.course")}</th>
                            <th>{t("assignments.table.headers.organization")}</th>
                            <th>{t("assignments.table.headers.assignedBy")}</th>
                            <th>{t("assignments.table.headers.priority")}</th>
                            <th>{t("assignments.table.headers.deadline")}</th>
                            <th>{t("assignments.table.headers.submissions")}</th>
                            <th>{t("assignments.table.headers.status")}</th>
                            <th>{t("assignments.table.headers.createdAt")}</th>
                            <th>{t("assignments.table.headers.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                                    <Loading size="small" />
                                </td>
                            </tr>
                        ) : currentData.length > 0 ? (
                            currentData.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <div
                                                className={styles.userAvatar}
                                                style={{
                                                    background: "var(--primary-light)",
                                                    color: "var(--primary)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <FaBookOpen />
                                            </div>
                                            <div className={styles.userDetails}>
                                                <div className={styles.userName}>{item.title}</div>
                                                <div className={styles.userEmail}>
                                                    {item.description && (
                                                        <span
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "var(--text-secondary)",
                                                                lineHeight: "1.4",
                                                            }}
                                                        >
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.courseName}</td>
                                    <td>{item.organizationName || "-"}</td>
                                    <td>{item.assignedBy || "-"}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <span className={`${styles.priorityBadge} ${styles[item.priority]}`}>
                                            <FaFlag />
                                            {item.priority === "low" && t("assignments.priority.low")}
                                            {item.priority === "medium" && t("assignments.priority.medium")}
                                            {item.priority === "high" && t("assignments.priority.high")}
                                            {item.priority === "urgent" && t("assignments.priority.urgent")}
                                        </span>
                                    </td>
                                    <td>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                fontSize: "13px",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            <FaClock /> {item.deadline}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: "13px" }}>
                                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{item.submissionCount}</span>
                                            <span style={{ color: "var(--text-secondary)" }}> / {item.totalStudents}</span>
                                        </div>
                                        <div
                                            style={{
                                                width: "100px",
                                                height: "4px",
                                                background: "var(--border-secondary)",
                                                borderRadius: "2px",
                                                margin: "4px auto 0",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${(item.submissionCount / item.totalStudents) * 100}%`,
                                                    height: "100%",
                                                    background: "var(--primary)",
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.createdAt}</td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.actionBtn}
                                                title={t("assignments.table.view")}
                                                onClick={() => openPreviewModal(item)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title={t("assignments.table.edit")}
                                                onClick={() => openEditModal(item)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.delete}`}
                                                title={t("assignments.table.delete")}
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={10}
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {t("assignments.table.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages >= 1 && (
                    <div className={styles.pagination}>
                        <span className={styles.pageInfo}>
                            {t("assignments.pagination.showing", {
                                start: startIndex + 1,
                                end: Math.min(startIndex + pageSize, total),
                                total,
                            })}
                        </span>
                        <div className={styles.pageButtons}>
                            <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                                <FaAngleDoubleLeft />
                            </button>
                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                                <FaChevronLeft />
                            </button>
                            {getPageNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === "..." ? (
                                        <span className={styles.paginationEllipsis}>...</span>
                                    ) : (
                                        <button
                                            className={`${styles.pageBtn} ${currentPage === page ? styles.active : ""}`}
                                            onClick={() => setCurrentPage(page as number)}
                                        >
                                            {page}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}
                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                            >
                                <FaChevronRight />
                            </button>
                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                            >
                                <FaAngleDoubleRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 创建/编辑模态框 */}
            <Modal
                visible={isModalVisible}
                title={currentAssignment ? t("assignments.modal.editTitle") : t("assignments.modal.createTitle")}
                onClose={() => setIsModalVisible(false)}
                width={600}
                footer={
                    <>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsModalVisible(false)}>
                            {t("assignments.modal.cancel")}
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>
                            {currentAssignment ? t("assignments.modal.saveButton") : t("assignments.modal.publishButton")}
                        </button>
                    </>
                }
            >
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("assignments.form.titleLabel")}</label>
                    <Input
                        placeholder={t("assignments.form.titlePlaceholder")}
                        value={formData.title || ""}
                        onChange={(value) => setFormData({ ...formData, title: value })}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("assignments.form.courseLabel")}</label>
                    <Input
                        placeholder={t("assignments.form.coursePlaceholder")}
                        value={formData.courseName || ""}
                        onChange={(value) => setFormData({ ...formData, courseName: value })}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("assignments.form.deadlineLabel")}</label>
                        <DatePicker
                            showTime
                            value={formData.deadline ? new Date(formData.deadline) : undefined}
                            onChange={(date) =>
                                setFormData({
                                    ...formData,
                                    deadline: date ? date.toISOString() : "",
                                })
                            }
                            size="large"
                            className={styles.formInput}
                            style={{ width: "100%" }}
                            placeholder={t("assignments.form.deadlinePlaceholder")}
                            format="YYYY-MM-DD HH:mm:ss"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("assignments.form.maxFileSizeLabel")}</label>
                        <Input
                            type="number"
                            placeholder={t("assignments.form.maxFileSizePlaceholder")}
                            value={String(formData.maxFileSize || "")}
                            onChange={(value) => {
                                const num = Number(value);
                                if (num > 96) {
                                    message.error(t("assignments.message.fileSizeExceeded"));
                                    return;
                                }
                                setFormData({ ...formData, maxFileSize: num });
                            }}
                            className={styles.formInput}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label className={styles.formLabel}>{t("assignments.form.statusLabel")}</label>
                        <CustomSelect
                            name={t("assignments.form.statusSelectName")}
                            options={[
                                { id: "active", name: t("assignments.status.active"), color: "var(--success)" },
                                { id: "closed", name: t("assignments.status.closed"), color: "var(--error)" },
                                { id: "draft", name: t("assignments.status.draft"), color: "var(--warning)" },
                            ]}
                            value={{
                                id: formData.status || "draft",
                                name:
                                    formData.status === "active"
                                        ? t("assignments.status.active")
                                        : formData.status === "closed"
                                          ? t("assignments.status.closed")
                                          : t("assignments.status.draft"),
                                color: "",
                            }}
                            onChange={(option) => setFormData({ ...formData, status: option?.id as any })}
                            placeholder={t("assignments.form.statusPlaceholder")}
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label className={styles.formLabel}>{t("assignments.form.priorityLabel")}</label>
                        <CustomSelect
                            name={t("assignments.form.prioritySelectName")}
                            options={[
                                { id: "low", name: t("assignments.priority.low"), color: "#6c757d" },
                                { id: "medium", name: t("assignments.priority.medium"), color: "#ffc107" },
                                { id: "high", name: t("assignments.priority.high"), color: "#ff9800" },
                                { id: "urgent", name: t("assignments.priority.urgent"), color: "#dc3545" },
                            ]}
                            value={{
                                id: formData.priority || "medium",
                                name:
                                    formData.priority === "low"
                                        ? t("assignments.priority.low")
                                        : formData.priority === "medium"
                                          ? t("assignments.priority.medium")
                                          : formData.priority === "high"
                                            ? t("assignments.priority.high")
                                            : t("assignments.priority.urgent"),
                                color: "",
                            }}
                            onChange={(option) => setFormData({ ...formData, priority: option?.id as any })}
                            placeholder={t("assignments.form.priorityPlaceholder")}
                            hideBadge={true}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("assignments.form.allowedTypesLabel")}</label>
                    <Input
                        placeholder={t("assignments.form.allowedTypesPlaceholder")}
                        value={allowedTypesInput}
                        onChange={(value) => {
                            setAllowedTypesInput(value);
                            setFormData((prev) => ({
                                ...prev,
                                allowedTypes: value
                                    .split(/[,，]/)
                                    .map((t) => t.trim())
                                    .filter((t) => t),
                            }));
                        }}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("assignments.form.descriptionLabel")}</label>
                    <textarea
                        className={styles.formTextarea}
                        placeholder={t("assignments.form.descriptionPlaceholder")}
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
            </Modal>

            {/* 预览模态框 */}
            <Modal
                visible={isPreviewVisible}
                title={t("assignments.preview.title")}
                onClose={() => setIsPreviewVisible(false)}
                width={600}
                footer={
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsPreviewVisible(false)}>
                        {t("assignments.preview.close")}
                    </button>
                }
            >
                {currentAssignment && (
                    <div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("assignments.preview.assignmentTitle")}</div>
                            <div className={styles.detailValue} style={{ fontSize: "18px", fontWeight: 600 }}>
                                {currentAssignment.title}
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.course")}</div>
                                <div className={styles.detailValue}>{currentAssignment.courseName}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.organization")}</div>
                                <div className={styles.detailValue}>{currentAssignment.organizationName || "-"}</div>
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.assignedBy")}</div>
                                <div className={styles.detailValue}>{currentAssignment.assignedBy || "-"}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.currentStatus")}</div>
                                <div className={styles.detailValue}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        {getStatusBadge(currentAssignment.status)}
                                        <span
                                            className={`${styles.priorityBadge} ${styles[currentAssignment.priority]}`}
                                            style={{ marginLeft: "8px" }}
                                        >
                                            <FaFlag />
                                            {currentAssignment.priority === "low" && t("assignments.priority.low")}
                                            {currentAssignment.priority === "medium" && t("assignments.priority.medium")}
                                            {currentAssignment.priority === "high" && t("assignments.priority.high")}
                                            {currentAssignment.priority === "urgent" && t("assignments.priority.urgent")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.deadline")}</div>
                                <div className={styles.detailValue}>{currentAssignment.deadline}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.createdAt")}</div>
                                <div className={styles.detailValue}>{currentAssignment.createdAt}</div>
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.maxFileSize")}</div>
                                <div className={styles.detailValue}>
                                    {currentAssignment.maxFileSize
                                        ? `${currentAssignment.maxFileSize} MB`
                                        : t("assignments.preview.notSet")}
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("assignments.preview.allowedTypes")}</div>
                                <div className={styles.detailValue}>
                                    {currentAssignment.allowedTypes?.join(", ") || t("assignments.preview.unlimited")}
                                </div>
                            </div>
                        </div>

                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("assignments.preview.submissions")}</div>
                            <div className={styles.detailValue}>
                                {t("assignments.preview.submitted", {
                                    submitted: currentAssignment.submissionCount,
                                    total: currentAssignment.totalStudents,
                                })}
                                <div
                                    style={{
                                        width: "100%",
                                        height: "6px",
                                        background: "var(--bg-secondary)",
                                        borderRadius: "3px",
                                        marginTop: "8px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${(currentAssignment.submissionCount / currentAssignment.totalStudents) * 100}%`,
                                            height: "100%",
                                            background: "var(--primary)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("assignments.preview.description")}</div>
                            <div
                                className={styles.detailValue}
                                style={{
                                    background: "var(--bg-secondary)",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    minHeight: "80px",
                                }}
                            >
                                {currentAssignment.description || t("assignments.preview.noDescription")}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AssignmentManagement;

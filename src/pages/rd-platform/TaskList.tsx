import { useRdList } from "@/hooks/UseRdList.ts";
import { useOrgMemberOptions } from "@/hooks/UseOrgMemberOptions.ts";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { formatDateTime } from "@/utils/Utils.ts";
import { encodeId } from "@/utils/HashId.ts";
import {
    FaPlus,
    FaEye,
    FaEdit,
    FaTrash,
    FaFilter,
    FaTasks,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import styles from "./ListPage.module.css";
import taskStyles from "./TaskList.module.css";
import Input from "@/components/input/Input";
import DatePicker from "@/components/datePicker/DatePicker";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { RdPlatformService as RdAPI } from "@/services/RdPlatformService.ts";
import AssigneeDisplay from "@/components/assigneeDisplay/AssigneeDisplay";
import type { Task } from "@/types/RdPlatform.ts";
import { OrgPermission } from "@/types/RdPlatform.ts";
import type { SelectOption } from "../../types";

const PAGE_SIZE = 10;

const emptyTask = {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "",
    organizationId: "",
    requirementId: "",
    deadline: "",
    estimatedHours: 0,
};

const TaskList: React.FC = () => {
    const { t } = useTranslation("rd");
    const enums = useEnumLabels();
    const navigate = useRdNavigate();
    const { user } = useAuth();
    const { isAdmin, userOrgIds, orgs, maxOrgRole, selectedOrgId } = useRdOrg();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", status: "", priority: "", assignee: "" });

    const statusOptions: SelectOption[] = [
        { id: "", name: t("tasks.status.all"), color: "#6c757d" },
        { id: "todo", name: enums.rdTaskStatus.todo, color: "#3b82f6" },
        { id: "doing", name: enums.rdTaskStatus.doing, color: "#eab308" },
        { id: "done", name: enums.rdTaskStatus.done, color: "#22c55e" },
        { id: "closed", name: enums.rdTaskStatus.closed, color: "#6b7280" },
    ];

    const priorityOptions: SelectOption[] = [
        { id: "", name: t("tasks.priority.all"), color: "#6c757d" },
        { id: "high", name: enums.rdPriority.high, color: "#ef4444" },
        { id: "medium", name: enums.rdPriority.medium, color: "#f59e0b" },
        { id: "low", name: enums.rdPriority.low, color: "#22c55e" },
    ];

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form, setForm] = useState({ ...emptyTask });
    const memberOptions = useOrgMemberOptions(modalVisible, form.organizationId);
    const {
        data: tasks,
        total,
        loading,
        initialLoaded,
        refresh: fetchData,
    } = useRdList(RdAPI.getTasks, filters, currentPage, selectedOrgId, PAGE_SIZE);

    const handleFilterChange = (field: string, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const getDefaultOrgId = (): string => {
        if (orgs.length === 1) {
            return orgs[0].orgId;
        }
        return "";
    };

    const openCreate = () => {
        setEditingTask(null);
        setForm({ ...emptyTask, organizationId: selectedOrgId || getDefaultOrgId() });
        setModalVisible(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assignee: task.assignee,
            organizationId: task.organizationId,
            requirementId: task.requirementId,
            deadline: task.deadline,
            estimatedHours: task.estimatedHours,
        });
        setModalVisible(true);
    };

    const handleFormChange = (field: string, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            message.warn(t("tasks.message.titleRequired"));
            return;
        }
        if (!isAdmin && !form.organizationId) {
            message.warn(t("tasks.message.orgRequired"));
            return;
        }

        const data = {
            title: form.title.trim(),
            description: form.description,
            status: form.status as Task["status"],
            priority: form.priority as Task["priority"],
            assignee: form.assignee,
            organizationId: form.organizationId || userOrgIds[0] || "",
            requirementId: form.requirementId,
            deadline: form.deadline,
            estimatedHours: Number(form.estimatedHours) || 0,
        };

        try {
            if (editingTask) {
                await RdAPI.updateTask(editingTask.id, data);
                message.success(t("tasks.message.updateSuccess"));
            } else {
                await RdAPI.createTask({ ...data, creator: user?.name || user?.account || i18n.t("common:unknown") });
                message.success(t("tasks.message.createSuccess"));
            }
            setModalVisible(false);
            fetchData();
        } catch (err: any) {
            message.error(err?.message || t("tasks.message.operationFailed"));
        }
    };

    const handleDelete = async (task: Task) => {
        await confirm({
            title: t("tasks.message.deleteConfirmTitle"),
            content: (
                <div>
                    {t("tasks.message.deleteConfirmPrefix")}
                    <strong>{task.title}</strong>
                    {t("tasks.message.deleteConfirmSuffix")}
                </div>
            ),
            confirmText: t("tasks.actions.delete"),
            cancelText: t("tasks.modal.cancel"),
            onConfirm: async () => {
                try {
                    await RdAPI.deleteTask(task.id, task.organizationId);
                    message.success(t("tasks.message.deleteSuccess"));
                    fetchData();
                } catch (err: any) {
                    message.error(err?.message || t("tasks.message.deleteFailed"));
                }
            },
        });
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + 4);
            if (start > 1) {
                pages.push(1);
                if (start > 2) {
                    pages.push("...");
                }
            }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages) {
                if (end < totalPages - 1) {
                    pages.push("...");
                }
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (loading && !initialLoaded) {
        return <Loading />;
    }

    return (
        <div className={styles.listPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("tasks.page.title")}</h1>
                    <p className={styles.pageDescription}>{t("tasks.page.description")}</p>
                </div>
                {OrgPermission.canCreateTask(maxOrgRole) && (
                    <button className={styles.createBtn} onClick={openCreate}>
                        <FaPlus /> {t("tasks.actions.create")}
                    </button>
                )}
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter /> {t("tasks.filters.title")}
                    </h3>
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setFilters({ search: "", status: "", priority: "", assignee: "" });
                            setCurrentPage(1);
                        }}
                    >
                        {t("tasks.filters.clear")}
                    </button>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("tasks.filters.search")}</label>
                        <Input
                            placeholder={t("tasks.filters.searchPlaceholder")}
                            value={filters.search}
                            onChange={(val) => handleFilterChange("search", val)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("tasks.filters.assignee")}</label>
                        <Input
                            placeholder={t("tasks.filters.assigneePlaceholder")}
                            value={filters.assignee}
                            onChange={(val) => handleFilterChange("assignee", val)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("tasks.filters.status")}</label>
                        <CustomSelect
                            name={t("tasks.filters.status")}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.id === filters.status) || null}
                            onChange={(o) => handleFilterChange("status", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("tasks.filters.priority")}</label>
                        <CustomSelect
                            name={t("tasks.filters.priority")}
                            options={priorityOptions}
                            value={priorityOptions.find((o) => o.id === filters.priority) || null}
                            onChange={(o) => handleFilterChange("priority", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t("tasks.table.title")}</th>
                            <th>{t("tasks.table.status")}</th>
                            <th>{t("tasks.table.priority")}</th>
                            <th>{t("tasks.table.assignee")}</th>
                            <th>{t("tasks.table.deadline")}</th>
                            <th>{t("tasks.table.estimatedHours")}</th>
                            <th>{t("tasks.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    <Loading size="small" />
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            tasks.map((task) => (
                                <tr key={task.id}>
                                    <td
                                        className={styles.titleCell}
                                        data-label={t("tasks.table.title")}
                                        onClick={() => navigate(`/rd/tasks/${encodeId(task.id, "task")}`)}
                                    >
                                        {task.title}
                                    </td>
                                    <td data-label={t("tasks.table.status")}>
                                        <span className={`${styles.badge} ${styles[`status_${task.status}`]}`}>
                                            {enums.rdTaskStatus[task.status]}
                                        </span>
                                    </td>
                                    <td data-label={t("tasks.table.priority")}>
                                        <span className={`${styles.badge} ${styles[`priority_${task.priority}`]}`}>
                                            {enums.rdPriority[task.priority]}
                                        </span>
                                    </td>
                                    <td data-label={t("tasks.table.assignee")}>
                                        <AssigneeDisplay name={task.assignee} avatar={task.assigneeAvatar} />
                                    </td>
                                    <td data-label={t("tasks.table.deadline")}>
                                        {task.deadline ? formatDateTime(task.deadline) : "-"}
                                    </td>
                                    <td data-label={t("tasks.table.estimatedHours")}>
                                        {task.estimatedHours ? `${task.estimatedHours}h` : "-"}
                                    </td>
                                    <td data-label={t("tasks.table.actions")}>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.view}`}
                                                title={t("tasks.actions.view")}
                                                onClick={() => navigate(`/rd/tasks/${encodeId(task.id, "task")}`)}
                                            >
                                                <FaEye />
                                            </button>
                                            {OrgPermission.canEdit(maxOrgRole) && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.edit}`}
                                                    title={t("tasks.actions.edit")}
                                                    onClick={() => openEdit(task)}
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {OrgPermission.canDelete(maxOrgRole) && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    title={t("tasks.actions.delete")}
                                                    onClick={() => handleDelete(task)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        {!loading && tasks.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    <div className={styles.emptyCellIcon}>
                                        <FaTasks />
                                    </div>
                                    <div className={styles.emptyCellText}>{t("tasks.table.empty")}</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>{t("tasks.pagination.total", { total })}</span>
                    <div className={styles.paginationControls}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                            <FaAngleDoubleLeft />
                        </button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                            <FaChevronLeft />
                        </button>
                        {getPageNumbers().map((page, i) =>
                            page === "..." ? (
                                <span key={`dot-${i}`} className={styles.paginationEllipsis}>
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    className={currentPage === page ? styles.activePage : ""}
                                    onClick={() => setCurrentPage(page as number)}
                                >
                                    {page}
                                </button>
                            ),
                        )}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                            <FaChevronRight />
                        </button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                            <FaAngleDoubleRight />
                        </button>
                    </div>
                </div>
            }

            {/* Create/Edit Modal */}
            <Modal
                visible={modalVisible}
                title={editingTask ? t("tasks.modal.editTitle") : t("tasks.modal.createTitle")}
                onClose={() => setModalVisible(false)}
                width={640}
                footer={
                    <div className={taskStyles.modalFooter}>
                        <button onClick={() => setModalVisible(false)} className={taskStyles.modalCancelBtn}>
                            {t("tasks.modal.cancel")}
                        </button>
                        <button onClick={handleSubmit} className={taskStyles.modalSubmitBtn}>
                            {editingTask ? t("tasks.modal.save") : t("tasks.modal.create")}
                        </button>
                    </div>
                }
            >
                <div className={taskStyles.formContainer}>
                    <div>
                        <label className={taskStyles.formLabel}>
                            {t("tasks.modal.titleLabel")} <span className={taskStyles.formLabelRequired}>*</span>
                        </label>
                        <Input
                            placeholder={t("tasks.modal.titlePlaceholder")}
                            value={form.title}
                            onChange={(val) => handleFormChange("title", val)}
                            size="large"
                        />
                    </div>

                    {(isAdmin || orgs.length > 1) && (
                        <div>
                            <label className={taskStyles.formLabel}>
                                {t("tasks.modal.orgLabel")} {!isAdmin && <span className={taskStyles.formLabelRequired}>*</span>}
                            </label>
                            <CustomSelect
                                name={t("tasks.modal.orgLabel")}
                                options={orgs.map((o) => ({ id: o.orgId, name: o.orgName, color: "#6c757d" }))}
                                value={
                                    orgs.find((o) => o.orgId === form.organizationId)
                                        ? {
                                              id: form.organizationId,
                                              name: orgs.find((o) => o.orgId === form.organizationId)!.orgName,
                                              color: "#6c757d",
                                          }
                                        : null
                                }
                                onChange={(o) => handleFormChange("organizationId", (o?.id as string) || "")}
                                hideBadge
                                disabled={!!editingTask || !!selectedOrgId}
                            />
                        </div>
                    )}

                    <div className={taskStyles.formRow}>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.statusLabel")}</label>
                            <CustomSelect
                                name={t("tasks.modal.statusLabel")}
                                options={statusOptions.filter((o) => o.id !== "")}
                                value={statusOptions.find((o) => o.id === form.status) || null}
                                onChange={(o) => handleFormChange("status", (o?.id as string) || "todo")}
                                hideBadge
                            />
                        </div>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.priorityLabel")}</label>
                            <CustomSelect
                                name={t("tasks.modal.priorityLabel")}
                                options={priorityOptions.filter((o) => o.id !== "")}
                                value={priorityOptions.find((o) => o.id === form.priority) || null}
                                onChange={(o) => handleFormChange("priority", (o?.id as string) || "medium")}
                                hideBadge
                            />
                        </div>
                    </div>

                    <div className={taskStyles.formRow}>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.assigneeLabel")}</label>
                            <CustomSelect
                                name={t("tasks.modal.assigneeLabel")}
                                options={memberOptions}
                                value={
                                    memberOptions.find((o) => o.id === form.assignee) ||
                                    (form.assignee ? { id: form.assignee, name: form.assignee, color: "#6c757d" } : null)
                                }
                                onChange={(o) => handleFormChange("assignee", (o?.id as string) || "")}
                                hideBadge
                            />
                        </div>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.deadlineLabel")}</label>
                            <DatePicker
                                placeholder={t("tasks.modal.deadlinePlaceholder")}
                                value={form.deadline ? new Date(form.deadline) : undefined}
                                onChange={(date) => {
                                    const str = date
                                        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                        : "";
                                    handleFormChange("deadline", str);
                                }}
                                size="large"
                                allowClear
                            />
                        </div>
                    </div>

                    <div className={taskStyles.formRow}>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.estimatedHoursLabel")}</label>
                            <Input
                                placeholder={t("tasks.modal.estimatedHoursPlaceholder")}
                                value={String(form.estimatedHours || "")}
                                onChange={(val) => handleFormChange("estimatedHours", Number(val) || 0)}
                                type="number"
                                size="large"
                            />
                        </div>
                        <div className={taskStyles.formField}>
                            <label className={taskStyles.formLabel}>{t("tasks.modal.requirementLabel")}</label>
                            <Input
                                placeholder={t("tasks.modal.requirementPlaceholder")}
                                value={form.requirementId}
                                onChange={(val) => handleFormChange("requirementId", val)}
                                size="large"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={taskStyles.formLabel}>{t("tasks.modal.descriptionLabel")}</label>
                        <textarea
                            placeholder={t("tasks.modal.descriptionPlaceholder")}
                            value={form.description}
                            onChange={(e) => handleFormChange("description", e.target.value)}
                            rows={4}
                            className={taskStyles.formTextarea}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TaskList;

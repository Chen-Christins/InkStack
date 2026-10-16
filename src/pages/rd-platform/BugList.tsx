import { useRdList } from "@/hooks/UseRdList.ts";
import { useOrgMemberOptions } from "@/hooks/UseOrgMemberOptions.ts";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { formatDateTime } from "@/utils/Utils.ts";
import { encodeId } from "@/utils/HashId.ts";
import {
    FaPlus,
    FaEye,
    FaEdit,
    FaTrash,
    FaFilter,
    FaBug,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import styles from "./ListPage.module.css";
import bugStyles from "./BugList.module.css";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "@/services/RdPlatformService.ts";
import AssigneeDisplay from "@/components/assigneeDisplay/AssigneeDisplay";
import type { SelectOption } from "../../types";
import type { Bug } from "@/types/RdPlatform.ts";
import { OrgPermission } from "@/types/RdPlatform.ts";

// ---- constants ----
const PAGE_SIZE = 10;

interface FormData {
    title: string;
    description: string;
    severity: string;
    priority: string;
    status: string;
    assignee: string;
    organizationId: string;
    relatedRequirementId: string;
    module: string;
    stepsToReproduce: string;
    environment: string;
}

const emptyForm: FormData = {
    title: "",
    description: "",
    severity: "normal",
    priority: "high",
    status: "new",
    assignee: "",
    organizationId: "",
    relatedRequirementId: "",
    module: "",
    stepsToReproduce: "",
    environment: "",
};

// ---- component ----
const BugList: React.FC = () => {
    const { t } = useTranslation("rd");
    const enums = useEnumLabels();
    const navigate = useRdNavigate();
    const { user } = useAuth();
    const { isAdmin, userOrgIds, orgs, orgNameMap, maxOrgRole, selectedOrgId } = useRdOrg();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", status: "", severity: "", priority: "" });

    const statusOptions: SelectOption[] = [
        { id: "", name: t("bugs.filters.allStatus"), color: "#6c757d" },
        { id: "new", name: enums.bugStatus.new, color: "#3b82f6" },
        { id: "processing", name: enums.bugStatus.processing, color: "#a855f7" },
        { id: "verified", name: enums.bugStatus.verified, color: "#22c55e" },
        { id: "closed", name: enums.bugStatus.closed, color: "#6b7280" },
        { id: "reopened", name: enums.bugStatus.reopened, color: "#ef4444" },
    ];

    const severityOptions: SelectOption[] = [
        { id: "", name: t("bugs.filters.allSeverity"), color: "#6c757d" },
        { id: "fatal", name: enums.severity.fatal, color: "#dc2626" },
        { id: "serious", name: enums.severity.serious, color: "#ea580c" },
        { id: "normal", name: enums.severity.normal, color: "#f59e0b" },
        { id: "minor", name: enums.severity.minor, color: "#22c55e" },
    ];

    const priorityOptions: SelectOption[] = [
        { id: "", name: t("bugs.filters.allPriority"), color: "#6c757d" },
        { id: "urgent", name: enums.rdPriority.urgent, color: "#dc2626" },
        { id: "high", name: enums.rdPriority.high, color: "#ef4444" },
        { id: "medium", name: enums.rdPriority.medium, color: "#f59e0b" },
        { id: "low", name: enums.rdPriority.low, color: "#22c55e" },
    ];

    const formSeverityOptions = severityOptions.filter((o) => o.id !== "");
    const formPriorityOptions = priorityOptions.filter((o) => o.id !== "");
    const formStatusOptions = statusOptions.filter((o) => o.id !== "");

    const statusText: Record<string, string> = {
        new: enums.bugStatus.new,
        processing: enums.bugStatus.processing,
        verified: enums.bugStatus.verified,
        closed: enums.bugStatus.closed,
        reopened: enums.bugStatus.reopened,
    };
    const severityText: Record<string, string> = {
        fatal: enums.severity.fatal,
        serious: enums.severity.serious,
        normal: enums.severity.normal,
        minor: enums.severity.minor,
    };
    const priorityText: Record<string, string> = {
        urgent: enums.rdPriority.urgent,
        high: enums.rdPriority.high,
        medium: enums.rdPriority.medium,
        low: enums.rdPriority.low,
    };

    // modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create");
    const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
    const [form, setForm] = useState<FormData>({ ...emptyForm });
    const memberOptions = useOrgMemberOptions(modalVisible, form.organizationId);
    const {
        data: bugs,
        total,
        loading,
        refresh: fetchData,
    } = useRdList(RdAPI.getBugs, filters, currentPage, selectedOrgId, PAGE_SIZE);

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

    // ---- modal handlers ----
    const openCreate = () => {
        setModalMode("create");
        setSelectedBug(null);
        setForm({ ...emptyForm, organizationId: selectedOrgId || getDefaultOrgId() });
        setModalVisible(true);
    };
    const openEdit = (bug: Bug) => {
        setModalMode("edit");
        setSelectedBug(bug);
        setForm({
            title: bug.title,
            description: bug.description,
            severity: bug.severity,
            priority: bug.priority,
            status: bug.status,
            assignee: bug.assignee,
            organizationId: bug.organizationId,
            relatedRequirementId: bug.relatedRequirementId,
            module: bug.module,
            stepsToReproduce: bug.stepsToReproduce,
            environment: bug.environment,
        });
        setModalVisible(true);
    };
    const closeModal = () => {
        setModalVisible(false);
        setSelectedBug(null);
    };
    const setFormField = (field: keyof FormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            message.warn(t("bugs.messages.titleRequired"));
            return;
        }
        if (!isAdmin && !form.organizationId) {
            message.warn(t("bugs.messages.orgRequired"));
            return;
        }
        const data = {
            title: form.title.trim(),
            description: form.description,
            severity: form.severity as Bug["severity"],
            priority: form.priority as Bug["priority"],
            status: form.status as Bug["status"],
            assignee: form.assignee,
            organizationId: form.organizationId || userOrgIds[0] || "",
            relatedRequirementId: form.relatedRequirementId,
            module: form.module,
            stepsToReproduce: form.stepsToReproduce,
            environment: form.environment,
        };
        try {
            if (modalMode === "edit" && selectedBug) {
                await RdAPI.updateBug(selectedBug.id, data);
                message.success(t("bugs.messages.updateSuccess"));
            } else {
                await RdAPI.createBug({ ...data, status: "new", creator: user?.name || user?.account || i18n.t("common:unknown") });
                message.success(t("bugs.messages.createSuccess"));
            }
            closeModal();
            fetchData();
        } catch (err: any) {
            message.error(err?.message || t("bugs.messages.operationFailed"));
        }
    };

    const handleDelete = async (bug: Bug) => {
        await confirm({
            title: t("bugs.messages.deleteTitle"),
            content: (
                <div>
                    {t("bugs.messages.deleteContentPrefix")}
                    <strong>{bug.title}</strong>
                    {t("bugs.messages.deleteContentSuffix")}
                </div>
            ),
            confirmText: t("bugs.messages.deleteConfirm"),
            cancelText: t("bugs.messages.deleteCancel"),
            onConfirm: async () => {
                try {
                    await RdAPI.deleteBug(bug.id, bug.organizationId);
                    message.success(t("bugs.messages.deleteSuccess"));
                    fetchData();
                } catch (err: any) {
                    message.error(err?.message || t("bugs.messages.deleteFailed"));
                }
            },
        });
    };

    const renderField = (label: string, value: React.ReactNode) => (
        <div className={bugStyles.detailField}>
            <span className={bugStyles.detailFieldLabel}>{label}</span>
            <span className={bugStyles.detailFieldValue}>{value || "-"}</span>
        </div>
    );

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const s = Math.max(1, currentPage - 2),
                e = Math.min(totalPages, s + 4);
            if (s > 1) {
                pages.push(1);
                if (s > 2) {
                    pages.push("...");
                }
            }
            for (let i = s; i <= e; i++) pages.push(i);
            if (e < totalPages) {
                if (e < totalPages - 1) {
                    pages.push("...");
                }
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (loading && bugs.length === 0) {
        return <Loading />;
    }

    return (
        <div className={styles.listPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("bugs.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("bugs.pageDescription")}</p>
                </div>
                {OrgPermission.canCreate(maxOrgRole) && (
                    <button className={styles.createBtn} onClick={openCreate}>
                        <FaPlus /> {t("bugs.createButton")}
                    </button>
                )}
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter /> {t("bugs.filters.title")}
                    </h3>
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setFilters({ search: "", status: "", severity: "", priority: "" });
                            setCurrentPage(1);
                        }}
                    >
                        {t("bugs.filters.clear")}
                    </button>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("bugs.filters.searchLabel")}</label>
                        <Input
                            placeholder={t("bugs.filters.searchPlaceholder")}
                            value={filters.search}
                            onChange={(val) => handleFilterChange("search", val)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("bugs.filters.statusLabel")}</label>
                        <CustomSelect
                            name={t("bugs.filters.statusLabel")}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.id === filters.status) || null}
                            onChange={(o) => handleFilterChange("status", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("bugs.filters.severityLabel")}</label>
                        <CustomSelect
                            name={t("bugs.filters.severityLabel")}
                            options={severityOptions}
                            value={severityOptions.find((o) => o.id === filters.severity) || null}
                            onChange={(o) => handleFilterChange("severity", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("bugs.filters.priorityLabel")}</label>
                        <CustomSelect
                            name={t("bugs.filters.priorityLabel")}
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
                            <th>{t("bugs.table.title")}</th>
                            <th>{t("bugs.table.severity")}</th>
                            <th>{t("bugs.table.priority")}</th>
                            <th>{t("bugs.table.status")}</th>
                            <th>{t("bugs.table.assignee")}</th>
                            <th>{t("bugs.table.module")}</th>
                            <th>{t("bugs.table.creator")}</th>
                            <th>{t("bugs.table.createdAt")}</th>
                            <th>{t("bugs.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bugs.map((b) => (
                            <tr key={b.id}>
                                <td
                                    className={styles.titleCell}
                                    data-label={t("bugs.table.title")}
                                    onClick={() => navigate(`/rd/bugs/${encodeId(b.id, "bug")}`)}
                                >
                                    {b.title}
                                </td>
                                <td data-label={t("bugs.table.severity")}>
                                    <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>
                                        {severityText[b.severity]}
                                    </span>
                                </td>
                                <td data-label={t("bugs.table.priority")}>
                                    <span className={`${styles.badge} ${styles[`priority_${b.priority}`]}`}>
                                        {priorityText[b.priority]}
                                    </span>
                                </td>
                                <td data-label={t("bugs.table.status")}>
                                    <span className={`${styles.badge} ${styles[`status_${b.status}`]}`}>{statusText[b.status]}</span>
                                </td>
                                <td data-label={t("bugs.table.assignee")}>
                                    <AssigneeDisplay name={b.assignee} avatar={b.assigneeAvatar} />
                                </td>
                                <td data-label={t("bugs.table.module")}>{b.module || "-"}</td>
                                <td data-label={t("bugs.table.creator")}>{b.creator}</td>
                                <td data-label={t("bugs.table.createdAt")}>{formatDateTime(b.createdAt)}</td>
                                <td data-label={t("bugs.table.actions")}>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.view}`}
                                            title={t("bugs.table.view")}
                                            onClick={() => navigate(`/rd/bugs/${encodeId(b.id, "bug")}`)}
                                        >
                                            <FaEye />
                                        </button>
                                        {OrgPermission.canEdit(maxOrgRole) && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.edit}`}
                                                title={t("bugs.table.edit")}
                                                onClick={() => openEdit(b)}
                                            >
                                                <FaEdit />
                                            </button>
                                        )}
                                        {OrgPermission.canDelete(maxOrgRole) && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.delete}`}
                                                title={t("bugs.table.delete")}
                                                onClick={() => handleDelete(b)}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bugs.length === 0 && (
                            <tr>
                                <td colSpan={9} className={styles.emptyCell}>
                                    <div className={styles.emptyCellIcon}>
                                        <FaBug />
                                    </div>
                                    <div className={styles.emptyCellText}>{t("bugs.table.empty")}</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>{t("bugs.pagination.total", { total })}</span>
                    <div className={styles.paginationControls}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                            <FaAngleDoubleLeft />
                        </button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                            <FaChevronLeft />
                        </button>
                        {getPageNumbers().map((page, i) =>
                            page === "..." ? (
                                <span key={`d-${i}`} className={styles.paginationEllipsis}>
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

            {/* ============ MODAL ============ */}
            <Modal
                visible={modalVisible}
                title={
                    modalMode === "create"
                        ? t("bugs.modal.createTitle")
                        : modalMode === "edit"
                          ? t("bugs.modal.editTitle")
                          : selectedBug?.title || t("bugs.modal.detailTitle")
                }
                onClose={closeModal}
                width={760}
                footer={
                    modalMode === "view" ? null : (
                        <div className={bugStyles.modalFooter}>
                            <button onClick={closeModal} className={bugStyles.modalCancelBtn}>
                                {t("bugs.modal.cancel")}
                            </button>
                            <button onClick={handleSubmit} className={bugStyles.modalSubmitBtn}>
                                {modalMode === "edit" ? t("bugs.modal.save") : t("bugs.modal.create")}
                            </button>
                        </div>
                    )
                }
            >
                {modalMode === "view" && selectedBug ? (
                    /* ---- detail view ---- */
                    <div data-allow-copy="true">
                        <div className={bugStyles.detailBadges}>
                            <span className={`${styles.badge} ${styles[`severity_${selectedBug.severity}`]}`}>
                                {severityText[selectedBug.severity]}
                            </span>
                            <span className={`${styles.badge} ${styles[`priority_${selectedBug.priority}`]}`}>
                                {priorityText[selectedBug.priority]}
                            </span>
                            <span className={`${styles.badge} ${styles[`status_${selectedBug.status}`]}`}>
                                {statusText[selectedBug.status]}
                            </span>
                        </div>
                        <div className={bugStyles.detailGrid}>
                            {renderField(
                                t("bugs.modal.detail.assignee"),
                                <AssigneeDisplay name={selectedBug.assignee} avatar={selectedBug.assigneeAvatar} />,
                            )}
                            {renderField(t("bugs.modal.detail.creator"), selectedBug.creator)}
                            {renderField(
                                t("bugs.modal.detail.organization"),
                                orgNameMap[selectedBug.organizationId] || selectedBug.organizationId,
                            )}
                            {renderField(t("bugs.modal.detail.module"), selectedBug.module)}
                            {renderField(t("bugs.modal.detail.relatedRequirement"), selectedBug.relatedRequirementId)}
                            {renderField(t("bugs.modal.detail.environment"), selectedBug.environment)}
                            {renderField(t("bugs.modal.detail.createdAt"), formatDateTime(selectedBug.createdAt))}
                            {renderField(t("bugs.modal.detail.updatedAt"), formatDateTime(selectedBug.updatedAt))}
                        </div>
                        <div className={selectedBug.stepsToReproduce ? bugStyles.detailSection : bugStyles.detailSectionLast}>
                            <h4 className={bugStyles.detailSectionTitle}>{t("bugs.modal.description")}</h4>
                            <div className={bugStyles.detailDescription}>
                                {selectedBug.description || t("bugs.modal.noDescription")}
                            </div>
                        </div>
                        {selectedBug.stepsToReproduce && (
                            <div>
                                <h4 className={bugStyles.detailSectionTitle}>{t("bugs.modal.stepsToReproduce")}</h4>
                                <div className={bugStyles.detailDescription}>{selectedBug.stepsToReproduce}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ---- create / edit form ---- */
                    <div className={bugStyles.formContainer}>
                        <div>
                            <label className={bugStyles.formLabel}>
                                {t("bugs.modal.form.title")} <span className={bugStyles.formLabelRequired}>*</span>
                            </label>
                            <Input
                                placeholder={t("bugs.modal.form.titlePlaceholder")}
                                value={form.title}
                                onChange={(v) => setFormField("title", v)}
                                size="large"
                            />
                        </div>
                        {(isAdmin || orgs.length > 1) && (
                            <div>
                                <label className={bugStyles.formLabel}>
                                    {t("bugs.modal.form.organization")}{" "}
                                    {!isAdmin && <span className={bugStyles.formLabelRequired}>*</span>}
                                </label>
                                <CustomSelect
                                    name={t("bugs.modal.form.organization")}
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
                                    onChange={(o) => setFormField("organizationId", (o?.id as string) || "")}
                                    hideBadge
                                    disabled={modalMode === "edit" || !!selectedOrgId}
                                />
                            </div>
                        )}
                        <div className={bugStyles.formRow}>
                            <div className={bugStyles.formField}>
                                <label className={bugStyles.formLabel}>{t("bugs.modal.form.severity")}</label>
                                <CustomSelect
                                    name={t("bugs.modal.form.severity")}
                                    options={formSeverityOptions}
                                    value={formSeverityOptions.find((o) => o.id === form.severity) || null}
                                    onChange={(o) => setFormField("severity", (o?.id as string) || "normal")}
                                    hideBadge
                                />
                            </div>
                            <div className={bugStyles.formField}>
                                <label className={bugStyles.formLabel}>{t("bugs.modal.form.priority")}</label>
                                <CustomSelect
                                    name={t("bugs.modal.form.priority")}
                                    options={formPriorityOptions}
                                    value={formPriorityOptions.find((o) => o.id === form.priority) || null}
                                    onChange={(o) => setFormField("priority", (o?.id as string) || "high")}
                                    hideBadge
                                />
                            </div>
                            {modalMode === "edit" && (
                                <div className={bugStyles.formField}>
                                    <label className={bugStyles.formLabel}>{t("bugs.modal.form.status")}</label>
                                    <CustomSelect
                                        name={t("bugs.modal.form.status")}
                                        options={formStatusOptions}
                                        value={formStatusOptions.find((o) => o.id === form.status) || null}
                                        onChange={(o) => setFormField("status", (o?.id as string) || "new")}
                                        hideBadge
                                    />
                                </div>
                            )}
                        </div>
                        <div className={bugStyles.formRow}>
                            <div className={bugStyles.formField}>
                                <label className={bugStyles.formLabel}>{t("bugs.modal.form.assignee")}</label>
                                <CustomSelect
                                    name={t("bugs.modal.form.assignee")}
                                    options={memberOptions}
                                    value={
                                        memberOptions.find((o) => o.id === form.assignee) ||
                                        (form.assignee ? { id: form.assignee, name: form.assignee, color: "#6c757d" } : null)
                                    }
                                    onChange={(o) => setFormField("assignee", (o?.id as string) || "")}
                                    hideBadge
                                />
                            </div>
                            <div className={bugStyles.formField}>
                                <label className={bugStyles.formLabel}>{t("bugs.modal.form.relatedRequirementId")}</label>
                                <Input
                                    placeholder={t("bugs.modal.form.optional")}
                                    value={form.relatedRequirementId}
                                    onChange={(v) => setFormField("relatedRequirementId", v)}
                                    size="large"
                                />
                            </div>
                            <div className={bugStyles.formField}>
                                <label className={bugStyles.formLabel}>{t("bugs.modal.form.module")}</label>
                                <Input
                                    placeholder={t("bugs.modal.form.modulePlaceholder")}
                                    value={form.module}
                                    onChange={(v) => setFormField("module", v)}
                                    size="large"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={bugStyles.formLabel}>{t("bugs.modal.form.description")}</label>
                            <textarea
                                placeholder={t("bugs.modal.form.descriptionPlaceholder")}
                                value={form.description}
                                onChange={(e) => setFormField("description", e.target.value)}
                                rows={5}
                                className={bugStyles.formTextarea}
                            />
                        </div>
                        <div>
                            <label className={bugStyles.formLabel}>{t("bugs.modal.form.stepsToReproduce")}</label>
                            <textarea
                                placeholder={t("bugs.modal.form.stepsToReproducePlaceholder")}
                                value={form.stepsToReproduce}
                                onChange={(e) => setFormField("stepsToReproduce", e.target.value)}
                                rows={4}
                                className={bugStyles.formTextarea}
                            />
                        </div>
                        <div>
                            <label className={bugStyles.formLabel}>{t("bugs.modal.form.environment")}</label>
                            <Input
                                placeholder={t("bugs.modal.form.environmentPlaceholder")}
                                value={form.environment}
                                onChange={(v) => setFormField("environment", v)}
                                size="large"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BugList;

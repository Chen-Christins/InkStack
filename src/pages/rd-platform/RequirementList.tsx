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
    FaClipboardList,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import styles from "./ListPage.module.css";
import reqStyles from "./RequirementList.module.css";
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
import type { Requirement } from "@/types/RdPlatform.ts";
import { OrgPermission } from "@/types/RdPlatform.ts";

// ---- constants ----
const PAGE_SIZE = 10;

interface FormData {
    title: string;
    description: string;
    priority: string;
    status: string;
    assignee: string;
    organizationId: string;
    iteration: string;
    category: string;
    source: string;
}

const emptyForm: FormData = {
    title: "",
    description: "",
    priority: "medium",
    status: "new",
    assignee: "",
    organizationId: "",
    iteration: "",
    category: "",
    source: "",
};

// ---- component ----
const RequirementList: React.FC = () => {
    const navigate = useRdNavigate();
    const { t } = useTranslation("rd");
    const labels = useEnumLabels();
    const { user } = useAuth();
    const { isAdmin, userOrgIds, orgs, orgNameMap, maxOrgRole, selectedOrgId } = useRdOrg();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

    const statusOptions: SelectOption[] = [
        { id: "", name: t("requirements.filters.allStatus"), color: "#6c757d" },
        { id: "new", name: labels.reqStatus.new, color: "#3b82f6" },
        { id: "developing", name: labels.reqStatus.developing, color: "#eab308" },
        { id: "testing", name: labels.reqStatus.testing, color: "#a855f7" },
        { id: "done", name: labels.reqStatus.done, color: "#22c55e" },
        { id: "closed", name: labels.reqStatus.closed, color: "#6b7280" },
    ];

    const priorityOptions: SelectOption[] = [
        { id: "", name: t("requirements.filters.allPriority"), color: "#6c757d" },
        { id: "high", name: labels.rdPriority.high, color: "#ef4444" },
        { id: "medium", name: labels.rdPriority.medium, color: "#f59e0b" },
        { id: "low", name: labels.rdPriority.low, color: "#22c55e" },
    ];

    const formPriorityOptions = priorityOptions.filter((o) => o.id !== "");
    const formStatusOptions = statusOptions.filter((o) => o.id !== "");

    // modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create");
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
    const [form, setForm] = useState<FormData>({ ...emptyForm });
    const memberOptions = useOrgMemberOptions(modalVisible, form.organizationId);
    const {
        data: requirements,
        total,
        loading,
        refresh: fetchData,
    } = useRdList(RdAPI.getRequirements, filters, currentPage, selectedOrgId, PAGE_SIZE);

    const handleFilterChange = (field: string, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    // ---- modal handlers ----
    const getDefaultOrgId = (): string => {
        if (orgs.length === 1) {
            return orgs[0].orgId;
        }
        return "";
    };

    const openCreate = () => {
        setModalMode("create");
        setSelectedReq(null);
        setForm({ ...emptyForm, organizationId: selectedOrgId || getDefaultOrgId() });
        setModalVisible(true);
    };

    const openEdit = (req: Requirement) => {
        setModalMode("edit");
        setSelectedReq(req);
        setForm({
            title: req.title,
            description: req.description,
            priority: req.priority,
            status: req.status,
            assignee: req.assignee,
            organizationId: req.organizationId,
            iteration: req.iteration,
            category: req.category,
            source: req.source,
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedReq(null);
    };

    const setFormField = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            message.warn(t("requirements.messages.titleRequired"));
            return;
        }
        if (!isAdmin && !form.organizationId) {
            message.warn(t("requirements.messages.orgRequired"));
            return;
        }
        const data = {
            title: form.title.trim(),
            description: form.description,
            priority: form.priority as Requirement["priority"],
            status: form.status as Requirement["status"],
            assignee: form.assignee,
            organizationId: form.organizationId || userOrgIds[0] || "",
            iteration: form.iteration,
            category: form.category,
            source: form.source,
        };
        try {
            if (modalMode === "edit" && selectedReq) {
                await RdAPI.updateRequirement(selectedReq.id, data);
                message.success(t("requirements.messages.updateSuccess"));
            } else {
                await RdAPI.createRequirement({
                    ...data,
                    status: "new",
                    creator: user?.name || user?.account || i18n.t("common:unknown"),
                });
                message.success(t("requirements.messages.createSuccess"));
            }
            closeModal();
            fetchData();
        } catch (err: any) {
            message.error(err?.message || t("requirements.messages.actionFailed"));
        }
    };

    const handleDelete = async (req: Requirement) => {
        await confirm({
            title: t("requirements.messages.deleteTitle"),
            content: (
                <div>
                    {t("requirements.messages.deleteContentPrefix")}
                    <strong>{req.title}</strong>
                    {t("requirements.messages.deleteContentSuffix")}
                </div>
            ),
            confirmText: t("requirements.messages.deleteConfirm"),
            cancelText: t("requirements.messages.deleteCancel"),
            onConfirm: async () => {
                try {
                    await RdAPI.deleteRequirement(req.id, req.organizationId);
                    message.success(t("requirements.messages.deleteSuccess"));
                    fetchData();
                } catch (err: any) {
                    message.error(err?.message || t("requirements.messages.deleteFailed"));
                }
            },
        });
    };

    // ---- render helpers ----
    const renderField = (label: string, value: React.ReactNode) => (
        <div className={reqStyles.detailField}>
            <span className={reqStyles.detailFieldLabel}>{label}</span>
            <span className={reqStyles.detailFieldValue}>{value || "-"}</span>
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

    if (loading && requirements.length === 0) {
        return <Loading />;
    }

    return (
        <div className={styles.listPage}>
            {/* header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("requirements.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("requirements.pageDescription")}</p>
                </div>
                {OrgPermission.canCreate(maxOrgRole) && (
                    <button className={styles.createBtn} onClick={openCreate}>
                        <FaPlus /> {t("requirements.createButton")}
                    </button>
                )}
            </div>

            {/* filters */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter /> {t("requirements.filters.title")}
                    </h3>
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setFilters({ search: "", status: "", priority: "" });
                            setCurrentPage(1);
                        }}
                    >
                        {t("requirements.filters.clear")}
                    </button>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("requirements.filters.searchLabel")}</label>
                        <Input
                            placeholder={t("requirements.filters.searchPlaceholder")}
                            value={filters.search}
                            onChange={(val) => handleFilterChange("search", val)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("requirements.filters.statusLabel")}</label>
                        <CustomSelect
                            name={t("requirements.filters.statusLabel")}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.id === filters.status) || null}
                            onChange={(o) => handleFilterChange("status", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("requirements.filters.priorityLabel")}</label>
                        <CustomSelect
                            name={t("requirements.filters.priorityLabel")}
                            options={priorityOptions}
                            value={priorityOptions.find((o) => o.id === filters.priority) || null}
                            onChange={(o) => handleFilterChange("priority", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                </div>
            </div>

            {/* table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t("requirements.table.title")}</th>
                            <th>{t("requirements.table.priority")}</th>
                            <th>{t("requirements.table.status")}</th>
                            <th>{t("requirements.table.assignee")}</th>
                            <th>{t("requirements.table.iteration")}</th>
                            <th>{t("requirements.table.creator")}</th>
                            <th>{t("requirements.table.createdAt")}</th>
                            <th>{t("requirements.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requirements.map((r) => (
                            <tr key={r.id}>
                                <td
                                    className={styles.titleCell}
                                    data-label={t("requirements.table.title")}
                                    onClick={() => navigate(`/rd/requirements/${encodeId(r.id, "requirement")}`)}
                                >
                                    {r.title}
                                </td>
                                <td data-label={t("requirements.table.priority")}>
                                    <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>
                                        {labels.rdPriority[r.priority]}
                                    </span>
                                </td>
                                <td data-label={t("requirements.table.status")}>
                                    <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>
                                        {labels.reqStatus[r.status]}
                                    </span>
                                </td>
                                <td data-label={t("requirements.table.assignee")}>
                                    <AssigneeDisplay name={r.assignee} avatar={r.assigneeAvatar} />
                                </td>
                                <td data-label={t("requirements.table.iteration")}>{r.iteration || "-"}</td>
                                <td data-label={t("requirements.table.creator")}>{r.creator}</td>
                                <td data-label={t("requirements.table.createdAt")}>{formatDateTime(r.createdAt)}</td>
                                <td data-label={t("requirements.table.actions")}>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.view}`}
                                            title={t("requirements.table.view")}
                                            onClick={() => navigate(`/rd/requirements/${encodeId(r.id, "requirement")}`)}
                                        >
                                            <FaEye />
                                        </button>
                                        {OrgPermission.canEdit(maxOrgRole) && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.edit}`}
                                                title={t("requirements.table.edit")}
                                                onClick={() => openEdit(r)}
                                            >
                                                <FaEdit />
                                            </button>
                                        )}
                                        {OrgPermission.canDelete(maxOrgRole) && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.delete}`}
                                                title={t("requirements.table.delete")}
                                                onClick={() => handleDelete(r)}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {requirements.length === 0 && (
                            <tr>
                                <td colSpan={8} className={styles.emptyCell}>
                                    <div className={styles.emptyCellIcon}>
                                        <FaClipboardList />
                                    </div>
                                    <div className={styles.emptyCellText}>{t("requirements.table.empty")}</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* pagination */}
            {
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>{t("requirements.pagination.total", { total })}</span>
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
                        ? t("requirements.modal.createTitle")
                        : modalMode === "edit"
                          ? t("requirements.modal.editTitle")
                          : selectedReq?.title || t("requirements.modal.detailTitle")
                }
                onClose={closeModal}
                width={720}
                footer={
                    modalMode === "view" ? null : (
                        <div className={reqStyles.modalFooter}>
                            <button onClick={closeModal} className={reqStyles.modalCancelBtn}>
                                {t("requirements.modal.cancel")}
                            </button>
                            <button onClick={handleSubmit} className={reqStyles.modalSubmitBtn}>
                                {modalMode === "edit" ? t("requirements.modal.save") : t("requirements.modal.create")}
                            </button>
                        </div>
                    )
                }
            >
                {modalMode === "view" && selectedReq ? (
                    /* ---- detail view ---- */
                    <div data-allow-copy="true">
                        <div className={reqStyles.detailBadges}>
                            <span className={`${styles.badge} ${styles[`priority_${selectedReq.priority}`]}`}>
                                {labels.rdPriority[selectedReq.priority]}
                            </span>
                            <span className={`${styles.badge} ${styles[`status_${selectedReq.status}`]}`}>
                                {labels.reqStatus[selectedReq.status]}
                            </span>
                        </div>
                        <div className={reqStyles.detailGrid}>
                            {renderField(
                                t("requirements.modal.detail.assignee"),
                                <AssigneeDisplay name={selectedReq.assignee} avatar={selectedReq.assigneeAvatar} />,
                            )}
                            {renderField(t("requirements.modal.detail.creator"), selectedReq.creator)}
                            {renderField(
                                t("requirements.modal.detail.organization"),
                                orgNameMap[selectedReq.organizationId] || selectedReq.organizationId,
                            )}
                            {renderField(t("requirements.modal.detail.iteration"), selectedReq.iteration)}
                            {renderField(t("requirements.modal.detail.category"), selectedReq.category)}
                            {renderField(t("requirements.modal.detail.source"), selectedReq.source)}
                            {renderField(t("requirements.modal.detail.createdAt"), formatDateTime(selectedReq.createdAt))}
                            {renderField(t("requirements.modal.detail.updatedAt"), formatDateTime(selectedReq.updatedAt))}
                        </div>
                        <div>
                            <h4 className={reqStyles.detailSectionTitle}>{t("requirements.modal.description")}</h4>
                            <div className={reqStyles.detailDescription}>
                                {selectedReq.description || t("requirements.modal.noDescription")}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ---- create / edit form ---- */
                    <div className={reqStyles.formContainer}>
                        <div>
                            <label className={reqStyles.formLabel}>
                                {t("requirements.modal.form.title")} <span className={reqStyles.formLabelRequired}>*</span>
                            </label>
                            <Input
                                placeholder={t("requirements.modal.form.titlePlaceholder")}
                                value={form.title}
                                onChange={(v) => setFormField("title", v)}
                                size="large"
                            />
                        </div>
                        {(isAdmin || orgs.length > 1) && (
                            <div>
                                <label className={reqStyles.formLabel}>
                                    {t("requirements.modal.form.organization")}{" "}
                                    {!isAdmin && <span className={reqStyles.formLabelRequired}>*</span>}
                                </label>
                                <CustomSelect
                                    name={t("requirements.modal.form.organization")}
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
                        <div className={reqStyles.formRow}>
                            <div className={reqStyles.formField}>
                                <label className={reqStyles.formLabel}>{t("requirements.modal.form.priority")}</label>
                                <CustomSelect
                                    name={t("requirements.modal.form.priority")}
                                    options={formPriorityOptions}
                                    value={formPriorityOptions.find((o) => o.id === form.priority) || null}
                                    onChange={(o) => setFormField("priority", (o?.id as string) || "medium")}
                                    hideBadge
                                />
                            </div>
                            {modalMode === "edit" && (
                                <div className={reqStyles.formField}>
                                    <label className={reqStyles.formLabel}>{t("requirements.modal.form.status")}</label>
                                    <CustomSelect
                                        name={t("requirements.modal.form.status")}
                                        options={formStatusOptions}
                                        value={formStatusOptions.find((o) => o.id === form.status) || null}
                                        onChange={(o) => setFormField("status", (o?.id as string) || "new")}
                                        hideBadge
                                    />
                                </div>
                            )}
                            <div className={reqStyles.formField}>
                                <label className={reqStyles.formLabel}>{t("requirements.modal.form.assignee")}</label>
                                <CustomSelect
                                    name={t("requirements.modal.form.assignee")}
                                    options={memberOptions}
                                    value={
                                        memberOptions.find((o) => o.id === form.assignee) ||
                                        (form.assignee ? { id: form.assignee, name: form.assignee, color: "#6c757d" } : null)
                                    }
                                    onChange={(o) => setFormField("assignee", (o?.id as string) || "")}
                                    hideBadge
                                />
                            </div>
                        </div>
                        <div className={reqStyles.formRow}>
                            <div className={reqStyles.formField}>
                                <label className={reqStyles.formLabel}>{t("requirements.modal.form.iteration")}</label>
                                <Input
                                    placeholder={t("requirements.modal.form.iterationPlaceholder")}
                                    value={form.iteration}
                                    onChange={(v) => setFormField("iteration", v)}
                                    size="large"
                                />
                            </div>
                            <div className={reqStyles.formField}>
                                <label className={reqStyles.formLabel}>{t("requirements.modal.form.category")}</label>
                                <Input
                                    placeholder={t("requirements.modal.form.categoryPlaceholder")}
                                    value={form.category}
                                    onChange={(v) => setFormField("category", v)}
                                    size="large"
                                />
                            </div>
                            <div className={reqStyles.formField}>
                                <label className={reqStyles.formLabel}>{t("requirements.modal.form.source")}</label>
                                <Input
                                    placeholder={t("requirements.modal.form.sourcePlaceholder")}
                                    value={form.source}
                                    onChange={(v) => setFormField("source", v)}
                                    size="large"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={reqStyles.formLabel}>{t("requirements.modal.form.description")}</label>
                            <textarea
                                placeholder={t("requirements.modal.form.descriptionPlaceholder")}
                                value={form.description}
                                onChange={(e) => setFormField("description", e.target.value)}
                                rows={6}
                                className={reqStyles.formTextarea}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RequirementList;

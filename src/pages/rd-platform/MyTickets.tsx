import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { formatDateTime } from "@/utils/Utils.ts";
import { encodeId } from "@/utils/HashId.ts";
import {
    FaEye,
    FaEdit,
    FaClipboardList,
    FaBug,
    FaTasks,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import styles from "./ListPage.module.css";
import myStyles from "./MyTickets.module.css";
import Input from "@/components/input/Input";
import DatePicker from "@/components/datePicker/DatePicker";

import CustomSelect from "@/components/customSelect/CustomSelect";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import message from "@/components/message/Message";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "@/services/RdPlatformService.ts";
import AssigneeDisplay from "@/components/assigneeDisplay/AssigneeDisplay";
import type { SelectOption } from "../../types";
import type { Requirement, Bug, Task } from "@/types/RdPlatform.ts";

const PAGE_SIZE = 10;

type TabKey = "req" | "bug" | "task";
type TabData = Requirement | Bug | Task;

const MyTickets: React.FC = () => {
    const { t } = useTranslation("rd");
    const navigate = useRdNavigate();
    const { orgNameMap, selectedOrgId } = useRdOrg();
    const [activeTab, setActiveTab] = useState<TabKey>("req");
    const [data, setData] = useState<TabData[]>([]);
    const [total, setTotal] = useState(0);
    const [totalMap, setTotalMap] = useState<Record<TabKey, number>>({ req: 0, bug: 0, task: 0 });
    const [loading, setLoading] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    // modal
    const [modalVisible, setModalVisible] = useState(false);
    const [detail, setDetail] = useState<{ type: TabKey; item: TabData } | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [memberOptions, setMemberOptions] = useState<SelectOption[]>([]);

    const reqStatusOptions: SelectOption[] = [
        { id: "", name: t("myTickets.status.all"), color: "#6c757d" },
        { id: "new", name: t("myTickets.status.new"), color: "#3b82f6" },
        { id: "developing", name: t("myTickets.status.developing"), color: "#eab308" },
        { id: "testing", name: t("myTickets.status.testing"), color: "#a855f7" },
        { id: "done", name: t("myTickets.status.done"), color: "#22c55e" },
        { id: "closed", name: t("myTickets.status.closed"), color: "#6b7280" },
    ];

    const bugStatusOptions: SelectOption[] = [
        { id: "", name: t("myTickets.status.all"), color: "#6c757d" },
        { id: "new", name: t("myTickets.status.new"), color: "#3b82f6" },
        { id: "processing", name: t("myTickets.status.processing"), color: "#a855f7" },
        { id: "verified", name: t("myTickets.status.verified"), color: "#22c55e" },
        { id: "closed", name: t("myTickets.status.closed"), color: "#6b7280" },
        { id: "reopened", name: t("myTickets.status.reopened"), color: "#ef4444" },
    ];

    const taskStatusOptions: SelectOption[] = [
        { id: "", name: t("myTickets.status.all"), color: "#6c757d" },
        { id: "todo", name: t("myTickets.status.todo"), color: "#6b7280" },
        { id: "doing", name: t("myTickets.status.doing"), color: "#3b82f6" },
        { id: "done", name: t("myTickets.status.done"), color: "#22c55e" },
        { id: "closed", name: t("myTickets.status.closed"), color: "#6b7280" },
    ];

    const reqPriorityOptions: SelectOption[] = [
        { id: "high", name: t("myTickets.priority.high"), color: "#ef4444" },
        { id: "medium", name: t("myTickets.priority.medium"), color: "#f59e0b" },
        { id: "low", name: t("myTickets.priority.low"), color: "#22c55e" },
    ];
    const bugSeverityOptions: SelectOption[] = [
        { id: "fatal", name: t("myTickets.severity.fatal"), color: "#dc2626" },
        { id: "serious", name: t("myTickets.severity.serious"), color: "#ea580c" },
        { id: "normal", name: t("myTickets.severity.normal"), color: "#f59e0b" },
        { id: "minor", name: t("myTickets.severity.minor"), color: "#22c55e" },
    ];

    const reqStatusText: Record<string, string> = {
        new: t("myTickets.status.new"),
        developing: t("myTickets.status.developing"),
        testing: t("myTickets.status.testing"),
        done: t("myTickets.status.done"),
        closed: t("myTickets.status.closed"),
    };
    const bugStatusText: Record<string, string> = {
        new: t("myTickets.status.new"),
        processing: t("myTickets.status.processing"),
        verified: t("myTickets.status.verified"),
        closed: t("myTickets.status.closed"),
        reopened: t("myTickets.status.reopened"),
    };
    const taskStatusText: Record<string, string> = {
        todo: t("myTickets.status.todo"),
        doing: t("myTickets.status.doing"),
        done: t("myTickets.status.done"),
        closed: t("myTickets.status.closed"),
    };
    const priorityText: Record<string, string> = {
        urgent: t("myTickets.priority.urgent"),
        high: t("myTickets.priority.high"),
        medium: t("myTickets.priority.medium"),
        low: t("myTickets.priority.low"),
    };
    const severityText: Record<string, string> = {
        fatal: t("myTickets.severity.fatal"),
        serious: t("myTickets.severity.serious"),
        normal: t("myTickets.severity.normal"),
        minor: t("myTickets.severity.minor"),
    };

    useEffect(() => {
        if (editMode && detail) {
            const orgId = (detail.item as any).organizationId;
            if (orgId) {
                RdAPI.getOrgMembers(orgId)
                    .then((members) => {
                        setMemberOptions(
                            members.map((m) => ({ id: m.userId, name: m.name, color: "#6c757d", avatar: m.avatar || "" })),
                        );
                    })
                    .catch(() => setMemberOptions([]));
            }
        }
    }, [editMode, detail]);

    const typeParam = activeTab === "req" ? "requirement" : activeTab === "bug" ? "bug" : "task";

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await RdAPI.getMyTickets({
                type: typeParam,
                page,
                pageSize: PAGE_SIZE,
                search: search || undefined,
                status: status || undefined,
                orgId: selectedOrgId || undefined,
            });
            setData(res.data);
            setTotal(res.total);
            setTotalMap((prev) => ({ ...prev, [activeTab]: res.total }));
        } catch (err) {
            message.error(err instanceof Error ? err.message : t("myTickets.message.fetchFailed"));
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
            setInitialLoaded(true);
        }
    }, [typeParam, page, search, status, selectedOrgId, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchTotalMap = useCallback(async () => {
        const types: { type: "requirement" | "bug" | "task"; key: TabKey }[] = [
            { type: "requirement", key: "req" },
            { type: "bug", key: "bug" },
            { type: "task", key: "task" },
        ];
        const results = await Promise.all(
            types.map(async ({ type, key }) => {
                try {
                    const res = await RdAPI.getMyTickets({ type, pageSize: 1, orgId: selectedOrgId || undefined });
                    return [key, res.total] as const;
                } catch {
                    return [key, 0] as const;
                }
            }),
        );
        setTotalMap(Object.fromEntries(results) as Record<TabKey, number>);
    }, [selectedOrgId]);

    useEffect(() => {
        fetchTotalMap();
    }, [fetchTotalMap, activeTab]);
    useEffect(() => {
        setPage(1);
        setData([]);
    }, [activeTab, search, status, selectedOrgId]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const s = Math.max(1, page - 2),
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

    const openDetail = (type: TabKey, item: TabData) => {
        setDetail({ type, item });
        setEditMode(false);
        setModalVisible(true);
    };
    const openEdit = (type: TabKey, item: TabData) => {
        const f: Record<string, string> = {};
        if (type === "req") {
            const r = item as Requirement;
            f.title = r.title;
            f.status = r.status;
            f.priority = r.priority;
            f.assignee = r.assignee || "";
            f.iteration = r.iteration || "";
            f.category = r.category || "";
            f.source = r.source || "";
            f.description = r.description || "";
        } else if (type === "bug") {
            const b = item as Bug;
            f.title = b.title;
            f.status = b.status;
            f.severity = b.severity;
            f.priority = b.priority;
            f.assignee = b.assignee || "";
            f.module = b.module || "";
            f.environment = b.environment || "";
            f.description = b.description || "";
        } else {
            const task = item as Task;
            f.title = task.title;
            f.status = task.status;
            f.priority = task.priority;
            f.assignee = task.assignee || "";
            f.deadline = task.deadline || "";
            f.estimatedHours = String(task.estimatedHours || 0);
            f.description = task.description || "";
        }
        setEditForm(f);
        setDetail({ type, item });
        setEditMode(true);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!detail) {
            return;
        }
        setSaving(true);
        try {
            if (detail.type === "req") {
                await RdAPI.updateRequirement(detail.item.id, {
                    title: editForm.title,
                    status: editForm.status as Requirement["status"],
                    priority: editForm.priority as Requirement["priority"],
                    assignee: editForm.assignee,
                    organizationId: (detail.item as Requirement).organizationId,
                    iteration: editForm.iteration,
                    category: editForm.category,
                    source: editForm.source,
                    description: editForm.description,
                });
            } else if (detail.type === "bug") {
                await RdAPI.updateBug(detail.item.id, {
                    title: editForm.title,
                    status: editForm.status as Bug["status"],
                    severity: editForm.severity as Bug["severity"],
                    priority: editForm.priority as Bug["priority"],
                    assignee: editForm.assignee,
                    organizationId: (detail.item as Bug).organizationId,
                    module: editForm.module,
                    environment: editForm.environment,
                    description: editForm.description,
                });
            } else {
                await RdAPI.updateTask(detail.item.id, {
                    title: editForm.title,
                    status: editForm.status as Task["status"],
                    priority: editForm.priority as Task["priority"],
                    assignee: editForm.assignee,
                    organizationId: (detail.item as Task).organizationId,
                    deadline: editForm.deadline,
                    estimatedHours: Number(editForm.estimatedHours) || 0,
                    description: editForm.description,
                });
            }
            message.success(t("myTickets.message.saveSuccess"));
            setEditMode(false);
            setModalVisible(false);
            fetchData();
        } catch (err: any) {
            message.error(err?.message || t("myTickets.message.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const renderField = (label: string, value: React.ReactNode) => (
        <div className={myStyles.detailField}>
            <span className={myStyles.detailFieldLabel}>{label}</span>
            <span className={myStyles.detailFieldValue}>{value || "-"}</span>
        </div>
    );

    const formLabel = (label: string, required?: boolean) => (
        <label className={myStyles.formLabel}>
            {label} {required && <span className={myStyles.formLabelRequired}>*</span>}
        </label>
    );

    const renderEditForm = () => {
        if (!detail) {
            return null;
        }
        return (
            <div className={myStyles.formContainer}>
                <div>
                    {formLabel(t("myTickets.form.title"), true)}
                    <Input value={editForm.title || ""} onChange={(v) => setEditForm((p) => ({ ...p, title: v }))} size="large" />
                </div>

                <div className={myStyles.formRow}>
                    <div className={myStyles.formField}>
                        {formLabel(t("myTickets.form.status"))}
                        <CustomSelect
                            name={t("myTickets.form.statusName")}
                            options={(detail.type === "req"
                                ? reqStatusOptions
                                : detail.type === "bug"
                                  ? bugStatusOptions
                                  : taskStatusOptions
                            ).filter((o) => o.id !== "")}
                            value={
                                (detail.type === "req"
                                    ? reqStatusOptions
                                    : detail.type === "bug"
                                      ? bugStatusOptions
                                      : taskStatusOptions
                                ).find((o) => o.id === editForm.status) || null
                            }
                            onChange={(o) => setEditForm((p) => ({ ...p, status: (o?.id as string) || "" }))}
                            hideBadge
                        />
                    </div>

                    {detail.type === "req" && (
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.priority"))}
                            <CustomSelect
                                name={t("myTickets.form.priorityName")}
                                options={reqPriorityOptions}
                                value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                                onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "medium" }))}
                                hideBadge
                            />
                        </div>
                    )}
                    {detail.type === "bug" && (
                        <>
                            <div className={myStyles.formField}>
                                {formLabel(t("myTickets.form.severity"))}
                                <CustomSelect
                                    name={t("myTickets.form.severityName")}
                                    options={bugSeverityOptions}
                                    value={bugSeverityOptions.find((o) => o.id === editForm.severity) || null}
                                    onChange={(o) => setEditForm((p) => ({ ...p, severity: (o?.id as string) || "normal" }))}
                                    hideBadge
                                />
                            </div>
                            <div className={myStyles.formField}>
                                {formLabel(t("myTickets.form.priority"))}
                                <CustomSelect
                                    name={t("myTickets.form.priorityName")}
                                    options={reqPriorityOptions}
                                    value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                                    onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "high" }))}
                                    hideBadge
                                />
                            </div>
                        </>
                    )}
                    {detail.type === "task" && (
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.priority"))}
                            <CustomSelect
                                name={t("myTickets.form.priorityName")}
                                options={reqPriorityOptions}
                                value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                                onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "medium" }))}
                                hideBadge
                            />
                        </div>
                    )}

                    <div className={myStyles.formField}>
                        {formLabel(t("myTickets.form.assignee"))}
                        <CustomSelect
                            name={t("myTickets.form.assigneeName")}
                            options={memberOptions}
                            value={
                                memberOptions.find((o) => o.id === editForm.assignee) ||
                                (editForm.assignee ? { id: editForm.assignee, name: editForm.assignee, color: "#6c757d" } : null)
                            }
                            onChange={(o) => setEditForm((p) => ({ ...p, assignee: (o?.id as string) || "" }))}
                            hideBadge
                        />
                    </div>
                </div>

                {/* type-specific fields */}
                {detail.type === "req" && (
                    <div className={myStyles.formRow}>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.iteration"))}
                            <Input
                                value={editForm.iteration || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, iteration: v }))}
                                size="large"
                            />
                        </div>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.category"))}
                            <Input
                                value={editForm.category || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, category: v }))}
                                size="large"
                            />
                        </div>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.source"))}
                            <Input
                                value={editForm.source || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, source: v }))}
                                size="large"
                            />
                        </div>
                    </div>
                )}
                {detail.type === "bug" && (
                    <div className={myStyles.formRow}>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.module"))}
                            <Input
                                value={editForm.module || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, module: v }))}
                                size="large"
                            />
                        </div>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.environment"))}
                            <Input
                                value={editForm.environment || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, environment: v }))}
                                size="large"
                            />
                        </div>
                    </div>
                )}
                {detail.type === "task" && (
                    <div className={myStyles.formRow}>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.deadline"))}
                            <DatePicker
                                placeholder={t("myTickets.form.deadlinePlaceholder")}
                                value={editForm.deadline ? new Date(editForm.deadline) : undefined}
                                onChange={(date) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        deadline: date
                                            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                            : "",
                                    }))
                                }
                                size="large"
                            />
                        </div>
                        <div className={myStyles.formField}>
                            {formLabel(t("myTickets.form.estimatedHours"))}
                            <Input
                                value={editForm.estimatedHours || ""}
                                onChange={(v) => setEditForm((p) => ({ ...p, estimatedHours: v }))}
                                size="large"
                            />
                        </div>
                    </div>
                )}

                <div>
                    {formLabel(t("myTickets.form.description"))}
                    <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        rows={5}
                        className={myStyles.formTextarea}
                    />
                </div>
            </div>
        );
    };

    const renderField_ = renderField;

    const tabBtn = (key: TabKey, icon: React.ReactNode, label: string, count: number) => (
        <button onClick={() => setActiveTab(key)} className={`${myStyles.tabBtn} ${activeTab === key ? myStyles.tabBtnActive : ""}`}>
            {icon} {label} ({count})
        </button>
    );
    const renderPriorityBadge = (p: string) => (
        <span className={`${styles.badge} ${styles[`priority_${p}`]}`}>{priorityText[p] || p}</span>
    );
    const renderStatusBadge = (s: string, map: Record<string, string>) => (
        <span className={`${styles.badge} ${styles[`status_${s}`]}`}>{map[s] || s}</span>
    );
    const filterBar = (
        <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>{t("myTickets.filters.title")}</h3>
                <button
                    className={styles.clearBtn}
                    onClick={() => {
                        setSearch("");
                        setStatus("");
                    }}
                >
                    {t("myTickets.filters.clear")}
                </button>
            </div>
            <div className={styles.filterForm}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>{t("myTickets.filters.searchLabel")}</label>
                    <Input
                        placeholder={t("myTickets.filters.searchPlaceholder")}
                        value={search}
                        onChange={setSearch}
                        allowClear
                        size="large"
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>{t("myTickets.filters.statusLabel")}</label>
                    <CustomSelect
                        name={t("myTickets.filters.statusSelectName")}
                        options={activeTab === "req" ? reqStatusOptions : activeTab === "bug" ? bugStatusOptions : taskStatusOptions}
                        value={
                            (activeTab === "req" ? reqStatusOptions : activeTab === "bug" ? bugStatusOptions : taskStatusOptions).find(
                                (o) => o.id === status,
                            ) || null
                        }
                        onChange={(o) => setStatus((o?.id as string) || "")}
                        hideBadge
                    />
                </div>
            </div>
        </div>
    );

    const paginationBar = (
        <div className={styles.pagination}>
            <span className={styles.paginationInfo}>{t("myTickets.pagination.total", { total })}</span>
            <div className={styles.paginationControls}>
                <button disabled={page === 1} onClick={() => setPage(1)}>
                    <FaAngleDoubleLeft />
                </button>
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <FaChevronLeft />
                </button>
                {getPageNumbers().map((pg, i) =>
                    pg === "..." ? (
                        <span key={`d-${i}`} className={styles.paginationEllipsis}>
                            ...
                        </span>
                    ) : (
                        <button key={pg} className={page === pg ? styles.activePage : ""} onClick={() => setPage(pg as number)}>
                            {pg}
                        </button>
                    ),
                )}
                <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <FaChevronRight />
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                    <FaAngleDoubleRight />
                </button>
            </div>
        </div>
    );

    if (loading && !initialLoaded) {
        return <Loading />;
    }

    const renderLoadingRow = (colSpan: number) => (
        <tr>
            <td colSpan={colSpan} className={styles.emptyCell}>
                <Loading size="small" text={t("myTickets.loading")} />
            </td>
        </tr>
    );

    return (
        <div className={styles.listPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("myTickets.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("myTickets.pageDescription")}</p>
                </div>
            </div>
            <div className={myStyles.tabBar}>
                {tabBtn("req", <FaClipboardList className={myStyles.tabBtnIcon} />, t("myTickets.tabs.req"), totalMap.req)}
                {tabBtn("bug", <FaBug className={myStyles.tabBtnIcon} />, t("myTickets.tabs.bug"), totalMap.bug)}
                {tabBtn("task", <FaTasks className={myStyles.tabBtnIcon} />, t("myTickets.tabs.task"), totalMap.task)}
            </div>
            {filterBar}

            {/* ---- requirements table ---- */}
            {activeTab === "req" && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t("myTickets.columns.title")}</th>
                                    <th>{t("myTickets.columns.priority")}</th>
                                    <th>{t("myTickets.columns.status")}</th>
                                    <th>{t("myTickets.columns.assignee")}</th>
                                    <th>{t("myTickets.columns.creator")}</th>
                                    <th>{t("myTickets.columns.createdAt")}</th>
                                    <th>{t("myTickets.columns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && renderLoadingRow(7)}
                                {!loading &&
                                    data.map((item) => {
                                        const r = item as Requirement;
                                        return (
                                            <tr key={r.id}>
                                                <td
                                                    className={styles.titleCell}
                                                    data-label={t("myTickets.columns.title")}
                                                    onClick={() => navigate(`/rd/requirements/${encodeId(r.id, "requirement")}`)}
                                                >
                                                    {r.title}
                                                </td>
                                                <td data-label={t("myTickets.columns.priority")}>{renderPriorityBadge(r.priority)}</td>
                                                <td data-label={t("myTickets.columns.status")}>
                                                    {renderStatusBadge(r.status, reqStatusText)}
                                                </td>
                                                <td data-label={t("myTickets.columns.assignee")}>
                                                    <AssigneeDisplay name={r.assignee} avatar={r.assigneeAvatar} />
                                                </td>
                                                <td data-label={t("myTickets.columns.creator")}>{r.creator}</td>
                                                <td data-label={t("myTickets.columns.createdAt")}>{formatDateTime(r.createdAt)}</td>
                                                <td data-label={t("myTickets.columns.actions")}>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.view}`}
                                                            title={t("myTickets.actions.view")}
                                                            onClick={() => openDetail("req", r)}
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.edit}`}
                                                            title={t("myTickets.actions.edit")}
                                                            onClick={() => openEdit("req", r)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyCell}>
                                            <div className={styles.emptyCellIcon}>
                                                <FaClipboardList />
                                            </div>
                                            <div className={styles.emptyCellText}>{t("myTickets.empty.req")}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {paginationBar}
                </>
            )}

            {/* ---- bugs table ---- */}
            {activeTab === "bug" && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t("myTickets.columns.title")}</th>
                                    <th>{t("myTickets.columns.severity")}</th>
                                    <th>{t("myTickets.columns.priority")}</th>
                                    <th>{t("myTickets.columns.status")}</th>
                                    <th>{t("myTickets.columns.assignee")}</th>
                                    <th>{t("myTickets.columns.creator")}</th>
                                    <th>{t("myTickets.columns.createdAt")}</th>
                                    <th>{t("myTickets.columns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && renderLoadingRow(8)}
                                {!loading &&
                                    data.map((item) => {
                                        const b = item as Bug;
                                        return (
                                            <tr key={b.id}>
                                                <td
                                                    className={styles.titleCell}
                                                    data-label={t("myTickets.columns.title")}
                                                    onClick={() => navigate(`/rd/bugs/${encodeId(b.id, "bug")}`)}
                                                >
                                                    {b.title}
                                                </td>
                                                <td data-label={t("myTickets.columns.severity")}>
                                                    <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>
                                                        {severityText[b.severity]}
                                                    </span>
                                                </td>
                                                <td data-label={t("myTickets.columns.priority")}>{renderPriorityBadge(b.priority)}</td>
                                                <td data-label={t("myTickets.columns.status")}>
                                                    {renderStatusBadge(b.status, bugStatusText)}
                                                </td>
                                                <td data-label={t("myTickets.columns.assignee")}>
                                                    <AssigneeDisplay name={b.assignee} avatar={b.assigneeAvatar} />
                                                </td>
                                                <td data-label={t("myTickets.columns.creator")}>{b.creator}</td>
                                                <td data-label={t("myTickets.columns.createdAt")}>{formatDateTime(b.createdAt)}</td>
                                                <td data-label={t("myTickets.columns.actions")}>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.view}`}
                                                            title={t("myTickets.actions.view")}
                                                            onClick={() => openDetail("bug", b)}
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.edit}`}
                                                            title={t("myTickets.actions.edit")}
                                                            onClick={() => openEdit("bug", b)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className={styles.emptyCell}>
                                            <div className={styles.emptyCellIcon}>
                                                <FaBug />
                                            </div>
                                            <div className={styles.emptyCellText}>{t("myTickets.empty.bug")}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {paginationBar}
                </>
            )}

            {/* ---- tasks table ---- */}
            {activeTab === "task" && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t("myTickets.columns.title")}</th>
                                    <th>{t("myTickets.columns.priority")}</th>
                                    <th>{t("myTickets.columns.status")}</th>
                                    <th>{t("myTickets.columns.assignee")}</th>
                                    <th>{t("myTickets.columns.creator")}</th>
                                    <th>{t("myTickets.columns.deadline")}</th>
                                    <th>{t("myTickets.columns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && renderLoadingRow(7)}
                                {!loading &&
                                    data.map((item) => {
                                        const task = item as Task;
                                        return (
                                            <tr key={task.id}>
                                                <td
                                                    className={styles.titleCell}
                                                    data-label={t("myTickets.columns.title")}
                                                    onClick={() => navigate(`/rd/tasks/${encodeId(task.id, "task")}`)}
                                                >
                                                    {task.title}
                                                </td>
                                                <td data-label={t("myTickets.columns.priority")}>
                                                    {renderPriorityBadge(task.priority)}
                                                </td>
                                                <td data-label={t("myTickets.columns.status")}>
                                                    {renderStatusBadge(task.status, taskStatusText)}
                                                </td>
                                                <td data-label={t("myTickets.columns.assignee")}>
                                                    <AssigneeDisplay name={task.assignee} avatar={task.assigneeAvatar} />
                                                </td>
                                                <td data-label={t("myTickets.columns.creator")}>{task.creator}</td>
                                                <td data-label={t("myTickets.columns.deadline")}>
                                                    {task.deadline ? formatDateTime(task.deadline) : "-"}
                                                </td>
                                                <td data-label={t("myTickets.columns.actions")}>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.view}`}
                                                            title={t("myTickets.actions.view")}
                                                            onClick={() => openDetail("task", task)}
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.edit}`}
                                                            title={t("myTickets.actions.edit")}
                                                            onClick={() => openEdit("task", task)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyCell}>
                                            <div className={styles.emptyCellIcon}>
                                                <FaTasks />
                                            </div>
                                            <div className={styles.emptyCellText}>{t("myTickets.empty.task")}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {paginationBar}
                </>
            )}

            {/* ============ MODAL ============ */}
            <Modal
                visible={modalVisible}
                title={
                    detail
                        ? editMode
                            ? t(
                                  activeTab === "req"
                                      ? "myTickets.modal.editReq"
                                      : activeTab === "bug"
                                        ? "myTickets.modal.editBug"
                                        : "myTickets.modal.editTask",
                              )
                            : (detail.item as any).title
                        : t("myTickets.modal.detailTitle")
                }
                onClose={() => {
                    setModalVisible(false);
                    setDetail(null);
                    setEditMode(false);
                }}
                width={720}
                footer={
                    editMode ? (
                        <div className={myStyles.modalFooter}>
                            <button onClick={() => setEditMode(false)} className={myStyles.modalCancelBtn}>
                                {t("myTickets.modal.cancel")}
                            </button>
                            <button onClick={handleSave} disabled={saving} className={myStyles.modalSubmitBtn}>
                                {saving ? t("myTickets.modal.saving") : t("myTickets.modal.save")}
                            </button>
                        </div>
                    ) : null
                }
            >
                {detail && !editMode && (
                    <div data-allow-copy="true">
                        {/* Requirement detail */}
                        {detail.type === "req" &&
                            (() => {
                                const r = detail.item as Requirement;
                                return (
                                    <div>
                                        <div className={myStyles.detailBadges}>
                                            {renderPriorityBadge(r.priority)}
                                            {renderStatusBadge(r.status, reqStatusText)}
                                        </div>
                                        <div className={myStyles.detailGrid}>
                                            {renderField_(
                                                t("myTickets.detail.assignee"),
                                                <AssigneeDisplay name={r.assignee} avatar={r.assigneeAvatar} />,
                                            )}
                                            {renderField_(t("myTickets.detail.creator"), r.creator)}
                                            {renderField_(
                                                t("myTickets.detail.organization"),
                                                orgNameMap[r.organizationId] || r.organizationId,
                                            )}
                                            {renderField_(t("myTickets.detail.iteration"), r.iteration)}
                                            {renderField_(t("myTickets.detail.category"), r.category)}
                                            {renderField_(t("myTickets.detail.source"), r.source)}
                                            {renderField_(
                                                t("myTickets.detail.createdAt"),
                                                r.createdAt ? formatDateTime(r.createdAt) : "-",
                                            )}
                                            {renderField_(
                                                t("myTickets.detail.updatedAt"),
                                                r.updatedAt ? formatDateTime(r.updatedAt) : "-",
                                            )}
                                        </div>
                                        <div>
                                            <h4 className={myStyles.detailSectionTitle}>{t("myTickets.detail.description")}</h4>
                                            <div className={myStyles.detailDescription}>
                                                {r.description || t("myTickets.detail.noDescription")}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        {/* Bug detail */}
                        {detail.type === "bug" &&
                            (() => {
                                const b = detail.item as Bug;
                                return (
                                    <div>
                                        <div className={myStyles.detailBadges}>
                                            <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>
                                                {severityText[b.severity]}
                                            </span>
                                            {renderPriorityBadge(b.priority)}
                                            {renderStatusBadge(b.status, bugStatusText)}
                                        </div>
                                        <div className={myStyles.detailGrid}>
                                            {renderField_(
                                                t("myTickets.detail.assignee"),
                                                <AssigneeDisplay name={b.assignee} avatar={b.assigneeAvatar} />,
                                            )}
                                            {renderField_(t("myTickets.detail.creator"), b.creator)}
                                            {renderField_(
                                                t("myTickets.detail.organization"),
                                                orgNameMap[b.organizationId] || b.organizationId,
                                            )}
                                            {renderField_(t("myTickets.detail.module"), b.module)}
                                            {renderField_(t("myTickets.detail.relatedRequirement"), b.relatedRequirementId)}
                                            {renderField_(t("myTickets.detail.environment"), b.environment)}
                                            {renderField_(
                                                t("myTickets.detail.createdAt"),
                                                b.createdAt ? formatDateTime(b.createdAt) : "-",
                                            )}
                                            {renderField_(
                                                t("myTickets.detail.updatedAt"),
                                                b.updatedAt ? formatDateTime(b.updatedAt) : "-",
                                            )}
                                        </div>
                                        <div className={b.stepsToReproduce ? myStyles.detailSection : myStyles.detailSectionLast}>
                                            <h4 className={myStyles.detailSectionTitle}>{t("myTickets.detail.description")}</h4>
                                            <div className={myStyles.detailDescription}>
                                                {b.description || t("myTickets.detail.noDescription")}
                                            </div>
                                        </div>
                                        {b.stepsToReproduce && (
                                            <div>
                                                <h4 className={myStyles.detailSectionTitle}>
                                                    {t("myTickets.detail.stepsToReproduce")}
                                                </h4>
                                                <div className={myStyles.detailDescription}>{b.stepsToReproduce}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        {/* Task detail */}
                        {detail.type === "task" &&
                            (() => {
                                const task = detail.item as Task;
                                return (
                                    <div>
                                        <div className={myStyles.detailBadges}>
                                            {renderPriorityBadge(task.priority)}
                                            {renderStatusBadge(task.status, taskStatusText)}
                                        </div>
                                        <div className={myStyles.detailGrid}>className={myStyles.statusGridWithBorder}</div>
                                        <div>
                                            <h4 className={myStyles.detailSectionTitle}>{t("myTickets.detail.description")}</h4>
                                            <div className={myStyles.detailDescription}>
                                                {task.description || t("myTickets.detail.noDescription")}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                    </div>
                )}
                {detail && editMode && renderEditForm()}
            </Modal>
        </div>
    );
};
export default MyTickets;

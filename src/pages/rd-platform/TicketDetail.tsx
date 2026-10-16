import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router-dom";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { formatDateTime } from "@/utils/Utils.ts";
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaClipboardList, FaBug, FaTasks } from "react-icons/fa";
import styles from "./TicketDetail.module.css";
import Loading from "@/components/loading/Loading";
import Input from "@/components/input/Input";
import DatePicker from "@/components/datePicker/DatePicker";
import CustomSelect from "@/components/customSelect/CustomSelect";
import message from "@/components/message/Message";
import { useRdOrg } from "@/contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "@/services/RdPlatformService.ts";
import AssigneeDisplay from "@/components/assigneeDisplay/AssigneeDisplay";
import { decodeId } from "@/utils/HashId.ts";
import type { SelectOption } from "../../types";
import type { Requirement, Bug, Task } from "@/types/RdPlatform.ts";

type EntityType = "requirement" | "bug" | "task";

function getTypeFromPath(pathname: string): EntityType {
    if (pathname.includes("/requirements/")) {
        return "requirement";
    }
    if (pathname.includes("/bugs/")) {
        return "bug";
    }
    return "task";
}

function getTypeIcon(type: EntityType) {
    if (type === "requirement") {
        return <FaClipboardList />;
    }
    if (type === "bug") {
        return <FaBug />;
    }
    return <FaTasks />;
}

function getListPath(type: EntityType): string {
    if (type === "requirement") {
        return "/rd/requirements";
    }
    if (type === "bug") {
        return "/rd/bugs";
    }
    return "/rd/tasks";
}

type DetailItem = Requirement | Bug | Task;

const TicketDetail: React.FC = () => {
    const { id: encodedId } = useParams<{ id: string }>();
    const navigate = useRdNavigate();
    const location = useLocation();
    const { orgNameMap } = useRdOrg();
    const { t } = useTranslation("rd");

    const entityType = getTypeFromPath(location.pathname);
    const id = encodedId ? String(decodeId(encodedId, entityType) ?? "") : "";

    const [item, setItem] = useState<DetailItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Record<string, string>>({});
    const [memberOptions, setMemberOptions] = useState<SelectOption[]>([]);

    // ---- Option lists ----

    const reqStatusOptions: SelectOption[] = [
        { id: "new", name: t("ticketDetail.option.status.new"), color: "#3b82f6" },
        { id: "developing", name: t("ticketDetail.option.status.developing"), color: "#eab308" },
        { id: "testing", name: t("ticketDetail.option.status.testing"), color: "#a855f7" },
        { id: "done", name: t("ticketDetail.option.status.done"), color: "#22c55e" },
        { id: "closed", name: t("ticketDetail.option.status.closed"), color: "#6b7280" },
    ];

    const bugStatusOptions: SelectOption[] = [
        { id: "new", name: t("ticketDetail.option.status.new"), color: "#3b82f6" },
        { id: "processing", name: t("ticketDetail.option.status.processing"), color: "#a855f7" },
        { id: "verified", name: t("ticketDetail.option.status.verified"), color: "#22c55e" },
        { id: "closed", name: t("ticketDetail.option.status.closed"), color: "#6b7280" },
        { id: "reopened", name: t("ticketDetail.option.status.reopened"), color: "#ef4444" },
    ];

    const taskStatusOptions: SelectOption[] = [
        { id: "todo", name: t("ticketDetail.option.status.todo"), color: "#6b7280" },
        { id: "doing", name: t("ticketDetail.option.status.doing"), color: "#3b82f6" },
        { id: "done", name: t("ticketDetail.option.status.done"), color: "#22c55e" },
        { id: "closed", name: t("ticketDetail.option.status.closed"), color: "#6b7280" },
    ];

    const priorityOptions: SelectOption[] = [
        { id: "high", name: t("ticketDetail.option.priority.high"), color: "#ef4444" },
        { id: "medium", name: t("ticketDetail.option.priority.medium"), color: "#f59e0b" },
        { id: "low", name: t("ticketDetail.option.priority.low"), color: "#22c55e" },
    ];

    const bugPriorityOptions: SelectOption[] = [
        { id: "urgent", name: t("ticketDetail.option.priority.urgent"), color: "#dc2626" },
        ...priorityOptions,
    ];

    const severityOptions: SelectOption[] = [
        { id: "fatal", name: t("ticketDetail.option.severity.fatal"), color: "#dc2626" },
        { id: "serious", name: t("ticketDetail.option.severity.serious"), color: "#ea580c" },
        { id: "normal", name: t("ticketDetail.option.severity.normal"), color: "#f59e0b" },
        { id: "minor", name: t("ticketDetail.option.severity.minor"), color: "#22c55e" },
    ];

    const getTypeLabel = (type: EntityType): string => {
        if (type === "requirement") {
            return t("ticketDetail.type.requirement");
        }
        if (type === "bug") {
            return t("ticketDetail.type.bug");
        }
        return t("ticketDetail.type.task");
    };

    const reqStatusText: Record<string, string> = {
        new: t("ticketDetail.option.status.new"),
        developing: t("ticketDetail.option.status.developing"),
        testing: t("ticketDetail.option.status.testing"),
        done: t("ticketDetail.option.status.done"),
        closed: t("ticketDetail.option.status.closed"),
    };
    const bugStatusText: Record<string, string> = {
        new: t("ticketDetail.option.status.new"),
        processing: t("ticketDetail.option.status.processing"),
        verified: t("ticketDetail.option.status.verified"),
        closed: t("ticketDetail.option.status.closed"),
        reopened: t("ticketDetail.option.status.reopened"),
    };
    const taskStatusText: Record<string, string> = {
        todo: t("ticketDetail.option.status.todo"),
        doing: t("ticketDetail.option.status.doing"),
        done: t("ticketDetail.option.status.done"),
        closed: t("ticketDetail.option.status.closed"),
    };
    const priorityText: Record<string, string> = {
        urgent: t("ticketDetail.option.priority.urgent"),
        high: t("ticketDetail.option.priority.high"),
        medium: t("ticketDetail.option.priority.medium"),
        low: t("ticketDetail.option.priority.low"),
    };
    const severityText: Record<string, string> = {
        fatal: t("ticketDetail.option.severity.fatal"),
        serious: t("ticketDetail.option.severity.serious"),
        normal: t("ticketDetail.option.severity.normal"),
        minor: t("ticketDetail.option.severity.minor"),
    };

    // fetch org members when entering edit mode
    useEffect(() => {
        if (editing && item) {
            const orgId = (item as any).organizationId;
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
    }, [editing, item]);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetcher =
            entityType === "requirement"
                ? RdAPI.getRequirementById(id)
                : entityType === "bug"
                  ? RdAPI.getBugById(id)
                  : RdAPI.getTaskById(id);
        fetcher
            .then((data) => {
                setItem(data as DetailItem);
                if (data) {
                    initForm(data);
                }
            })
            .catch(() => setItem(null))
            .finally(() => setLoading(false));
    }, [id, entityType]);

    const initForm = (data: DetailItem) => {
        const f: Record<string, string> = {};
        f.title = (data as any).title || "";
        f.status = (data as any).status || "";
        f.priority = (data as any).priority || "";
        f.assignee = (data as any).assignee || "";
        f.description = (data as any).description || "";

        if (entityType === "requirement") {
            const r = data as Requirement;
            f.iteration = r.iteration || "";
            f.category = r.category || "";
            f.source = r.source || "";
        } else if (entityType === "bug") {
            const b = data as Bug;
            f.severity = b.severity || "normal";
            f.module = b.module || "";
            f.environment = b.environment || "";
            f.stepsToReproduce = b.stepsToReproduce || "";
        } else {
            const t = data as Task;
            f.deadline = t.deadline || "";
            f.estimatedHours = String(t.estimatedHours || 0);
        }
        setForm(f);
    };

    const handleSave = async () => {
        if (!item || !id) {
            return;
        }
        setSaving(true);
        try {
            if (entityType === "requirement") {
                await RdAPI.updateRequirement(id, {
                    title: form.title,
                    status: form.status as Requirement["status"],
                    priority: form.priority as Requirement["priority"],
                    assignee: form.assignee,
                    organizationId: (item as Requirement).organizationId,
                    iteration: form.iteration,
                    category: form.category,
                    source: form.source,
                    description: form.description,
                });
            } else if (entityType === "bug") {
                await RdAPI.updateBug(id, {
                    title: form.title,
                    status: form.status as Bug["status"],
                    severity: form.severity as Bug["severity"],
                    priority: form.priority as Bug["priority"],
                    assignee: form.assignee,
                    organizationId: (item as Bug).organizationId,
                    module: form.module,
                    environment: form.environment,
                    stepsToReproduce: form.stepsToReproduce,
                    description: form.description,
                });
            } else {
                await RdAPI.updateTask(id, {
                    title: form.title,
                    status: form.status as Task["status"],
                    priority: form.priority as Task["priority"],
                    assignee: form.assignee,
                    organizationId: (item as Task).organizationId,
                    deadline: form.deadline,
                    estimatedHours: Number(form.estimatedHours) || 0,
                    description: form.description,
                });
            }
            const data = await (entityType === "requirement"
                ? RdAPI.getRequirementById(id)
                : entityType === "bug"
                  ? RdAPI.getBugById(id)
                  : RdAPI.getTaskById(id));
            setItem(data as DetailItem);
            setEditing(false);
            message.success(t("ticketDetail.message.saveSuccess"));
        } catch (err: any) {
            message.error(err?.message || t("ticketDetail.message.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    // ---- render helpers ----

    const fieldLabel = (label: string, required?: boolean) => (
        <label className={styles.formLabel}>
            {label} {required && <span className={styles.formLabelRequired}>*</span>}
        </label>
    );

    const metaField = (label: string, value: React.ReactNode) => (
        <div className={styles.metaCard}>
            <div className={styles.metaCardLabel}>{label}</div>
            <div className={styles.metaCardValue}>{value || "-"}</div>
        </div>
    );

    // ---- loading ----

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingWrap}>
                    <Loading />
                </div>
            </div>
        );
    }

    // ---- not found ----

    if (!item) {
        return (
            <div className={styles.container}>
                <div className={styles.detailCard}>
                    <div className={styles.notFound}>
                        <div className={styles.notFoundIcon}>404</div>
                        <p className={styles.notFoundText}>{t("ticketDetail.notFound.text", { type: getTypeLabel(entityType) })}</p>
                        <button className={styles.btnPrimary} onClick={() => navigate(getListPath(entityType))}>
                            {t("ticketDetail.notFound.back")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const typeLabel = getTypeLabel(entityType);

    return (
        <div className={styles.container}>
            <div className={styles.detailCard}>
                {/* ======== Card Header ======== */}
                <div className={styles.cardHeader}>
                    <button className={styles.backBtn} onClick={() => navigate(getListPath(entityType))}>
                        <FaArrowLeft /> {t("ticketDetail.header.backToList", { type: typeLabel })}
                    </button>

                    <div className={styles.headerContent}>
                        <div className={styles.titleGroup}>
                            <div className={styles.titleRow}>
                                <span className={styles.typeBadge}>
                                    {getTypeIcon(entityType)}
                                    {typeLabel}
                                </span>
                                {editing && (
                                    <span style={{ fontSize: "12px", color: "var(--warning)", fontWeight: 500 }}>
                                        {t("ticketDetail.header.editing")}
                                    </span>
                                )}
                            </div>
                            <h1 className={styles.pageTitle}>{item.title}</h1>
                        </div>

                        <div className={styles.headerRight}>
                            {!editing ? (
                                <button className={styles.btnPrimary} onClick={() => setEditing(true)}>
                                    <FaEdit /> {t("ticketDetail.header.edit")}
                                </button>
                            ) : (
                                <div className={styles.formActions} style={{ marginTop: 0 }}>
                                    <button
                                        className={styles.btnSecondary}
                                        onClick={() => {
                                            setEditing(false);
                                            initForm(item);
                                        }}
                                    >
                                        <FaTimes /> {t("ticketDetail.header.cancel")}
                                    </button>
                                    <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                                        <FaSave /> {saving ? t("ticketDetail.header.saving") : t("ticketDetail.header.save")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ======== Edit Mode ======== */}
                {editing ? (
                    <div className={styles.editForm}>
                        <div>
                            {fieldLabel(t("ticketDetail.form.title"), true)}
                            <Input value={form.title || ""} onChange={(v) => setForm((p) => ({ ...p, title: v }))} size="large" />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                {fieldLabel(t("ticketDetail.form.status"))}
                                <CustomSelect
                                    name={t("ticketDetail.form.status")}
                                    options={
                                        entityType === "requirement"
                                            ? reqStatusOptions
                                            : entityType === "bug"
                                              ? bugStatusOptions
                                              : taskStatusOptions
                                    }
                                    value={
                                        (entityType === "requirement"
                                            ? reqStatusOptions
                                            : entityType === "bug"
                                              ? bugStatusOptions
                                              : taskStatusOptions
                                        ).find((o) => o.id === form.status) || null
                                    }
                                    onChange={(o) => setForm((p) => ({ ...p, status: (o?.id as string) || "" }))}
                                    hideBadge
                                />
                            </div>

                            {entityType === "bug" && (
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.severity"))}
                                    <CustomSelect
                                        name={t("ticketDetail.form.severity")}
                                        options={severityOptions}
                                        value={severityOptions.find((o) => o.id === form.severity) || null}
                                        onChange={(o) => setForm((p) => ({ ...p, severity: (o?.id as string) || "normal" }))}
                                        hideBadge
                                    />
                                </div>
                            )}

                            <div className={styles.formField}>
                                {fieldLabel(t("ticketDetail.form.priority"))}
                                <CustomSelect
                                    name={t("ticketDetail.form.priority")}
                                    options={entityType === "bug" ? bugPriorityOptions : priorityOptions}
                                    value={
                                        (entityType === "bug" ? bugPriorityOptions : priorityOptions).find(
                                            (o) => o.id === form.priority,
                                        ) || null
                                    }
                                    onChange={(o) => setForm((p) => ({ ...p, priority: (o?.id as string) || "" }))}
                                    hideBadge
                                />
                            </div>

                            <div className={styles.formField}>
                                {fieldLabel(t("ticketDetail.form.assignee"))}
                                <CustomSelect
                                    name={t("ticketDetail.form.assignee")}
                                    options={memberOptions}
                                    value={
                                        memberOptions.find((o) => o.id === form.assignee) ||
                                        (form.assignee ? { id: form.assignee, name: form.assignee, color: "#6c757d" } : null)
                                    }
                                    onChange={(o) => setForm((p) => ({ ...p, assignee: (o?.id as string) || "" }))}
                                    hideBadge
                                />
                            </div>
                        </div>

                        {entityType === "requirement" && (
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.iteration"))}
                                    <Input
                                        value={form.iteration || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, iteration: v }))}
                                        size="large"
                                    />
                                </div>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.category"))}
                                    <Input
                                        value={form.category || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                                        size="large"
                                    />
                                </div>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.source"))}
                                    <Input
                                        value={form.source || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, source: v }))}
                                        size="large"
                                    />
                                </div>
                            </div>
                        )}
                        {entityType === "bug" && (
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.module"))}
                                    <Input
                                        value={form.module || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, module: v }))}
                                        size="large"
                                    />
                                </div>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.environment"))}
                                    <Input
                                        value={form.environment || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, environment: v }))}
                                        size="large"
                                    />
                                </div>
                            </div>
                        )}
                        {entityType === "task" && (
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.deadline"))}
                                    <DatePicker
                                        placeholder={t("ticketDetail.form.deadlinePlaceholder")}
                                        value={form.deadline ? new Date(form.deadline) : undefined}
                                        onChange={(date) =>
                                            setForm((p) => ({
                                                ...p,
                                                deadline: date
                                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                                    : "",
                                            }))
                                        }
                                        size="large"
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div className={styles.formField}>
                                    {fieldLabel(t("ticketDetail.form.estimatedHours"))}
                                    <Input
                                        value={form.estimatedHours || ""}
                                        onChange={(v) => setForm((p) => ({ ...p, estimatedHours: v }))}
                                        size="large"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            {fieldLabel(t("ticketDetail.form.description"))}
                            <textarea
                                className={styles.formTextarea}
                                value={form.description || ""}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                rows={6}
                            />
                        </div>

                        {entityType === "bug" && (
                            <div>
                                {fieldLabel(t("ticketDetail.form.stepsToReproduce"))}
                                <textarea
                                    className={styles.formTextarea}
                                    value={form.stepsToReproduce || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, stepsToReproduce: e.target.value }))}
                                    rows={4}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* ======== View Mode ======== */
                    <div data-allow-copy="true">
                        {/* Status / Priority / Severity badges */}
                        <div className={styles.badgeStrip}>
                            {entityType === "requirement" && (
                                <>
                                    <span className={`${styles.badge} ${styles[`priority_${(item as Requirement).priority}`]}`}>
                                        {priorityText[(item as Requirement).priority]}
                                    </span>
                                    <span className={`${styles.badge} ${styles[`status_${(item as Requirement).status}`]}`}>
                                        {reqStatusText[(item as Requirement).status]}
                                    </span>
                                </>
                            )}
                            {entityType === "bug" && (
                                <>
                                    <span className={`${styles.badge} ${styles[`severity_${(item as Bug).severity}`]}`}>
                                        {severityText[(item as Bug).severity]}
                                    </span>
                                    <span className={`${styles.badge} ${styles[`priority_${(item as Bug).priority}`]}`}>
                                        {priorityText[(item as Bug).priority]}
                                    </span>
                                    <span className={`${styles.badge} ${styles[`status_${(item as Bug).status}`]}`}>
                                        {bugStatusText[(item as Bug).status]}
                                    </span>
                                </>
                            )}
                            {entityType === "task" && (
                                <>
                                    <span className={`${styles.badge} ${styles[`priority_${(item as Task).priority}`]}`}>
                                        {priorityText[(item as Task).priority]}
                                    </span>
                                    <span className={`${styles.badge} ${styles[`status_${(item as Task).status}`]}`}>
                                        {taskStatusText[(item as Task).status]}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Meta info cards */}
                        <div className={styles.metaGrid}>
                            {metaField(
                                t("ticketDetail.meta.assignee"),
                                <AssigneeDisplay name={item.assignee} avatar={(item as any).assigneeAvatar} />,
                            )}
                            {metaField(t("ticketDetail.meta.creator"), (item as any).creator)}
                            {metaField(
                                t("ticketDetail.meta.organization"),
                                orgNameMap[(item as any).organizationId] || (item as any).organizationId,
                            )}

                            {entityType === "requirement" && (
                                <>
                                    {metaField(t("ticketDetail.meta.iteration"), (item as Requirement).iteration)}
                                    {metaField(t("ticketDetail.meta.category"), (item as Requirement).category)}
                                    {metaField(t("ticketDetail.meta.source"), (item as Requirement).source)}
                                </>
                            )}
                            {entityType === "bug" && (
                                <>
                                    {metaField(t("ticketDetail.meta.module"), (item as Bug).module)}
                                    {metaField(t("ticketDetail.meta.relatedRequirement"), (item as Bug).relatedRequirementId)}
                                    {metaField(t("ticketDetail.meta.environment"), (item as Bug).environment)}
                                </>
                            )}
                            {entityType === "task" && (
                                <>
                                    {metaField(t("ticketDetail.meta.relatedRequirement"), (item as Task).requirementId)}
                                    {metaField(
                                        t("ticketDetail.meta.deadline"),
                                        (item as Task).deadline ? formatDateTime((item as Task).deadline) : "-",
                                    )}
                                    {metaField(t("ticketDetail.meta.estimatedHours"), `${(item as Task).estimatedHours}h`)}
                                </>
                            )}

                            {metaField(t("ticketDetail.meta.createdAt"), item.createdAt ? formatDateTime(item.createdAt) : "-")}
                            {metaField(t("ticketDetail.meta.updatedAt"), item.updatedAt ? formatDateTime(item.updatedAt) : "-")}
                        </div>

                        {/* Description */}
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionTitle}>{t("ticketDetail.section.description")}</div>
                            <div className={styles.sectionBody}>{item.description || t("ticketDetail.section.noDescription")}</div>
                        </div>

                        {/* Steps to reproduce (bug only) */}
                        {entityType === "bug" && (item as Bug).stepsToReproduce && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionTitle}>{t("ticketDetail.section.stepsToReproduce")}</div>
                                <div className={styles.sectionBody}>{(item as Bug).stepsToReproduce}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetail;

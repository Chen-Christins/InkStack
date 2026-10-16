import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FaPlus,
    FaTrash,
    FaQuestionCircle,
    FaEye,
    FaBug,
    FaEdit,
    FaLightbulb,
    FaSyncAlt,
    FaFilter,
    FaClipboardList,
    FaSearch,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
    FaBook,
} from "react-icons/fa";
import styles from "./FeedbackManagement.module.css";
import Input from "@/components/input/Input";
import Modal from "@/components/modal/Modal";
import CustomSelect from "@/components/customSelect/CustomSelect";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types";
import { formatDateTime } from "@/utils/Utils.ts";
import { HelpService, type FeedbackItem, type HelpFaq } from "@/services/HelpService.ts";
import { OrganizationService } from "@/services/OrganizationService.ts";

const PAGE_SIZE = 10;

const FeedbackManagement: React.FC = () => {
    const { t } = useTranslation("admin");

    const typeLabels: Record<string, string> = {
        bug: t("feedbacks.types.bug"),
        feature: t("feedbacks.types.feature"),
        other: t("feedbacks.types.other"),
        "": t("feedbacks.types.all"),
    };

    const faqCategoryOptions: SelectOption[] = [
        { id: "入门", name: t("feedbacks.categories.gettingStarted"), color: "#3b82f6" },
        { id: "账户安全", name: t("feedbacks.categories.accountSecurity"), color: "#ef4444" },
        { id: "组织协作", name: t("feedbacks.categories.organization"), color: "#22c55e" },
        { id: "研发平台", name: t("feedbacks.categories.devPlatform"), color: "#a855f7" },
    ];

    const typeOptions: SelectOption[] = [
        { id: "", name: t("feedbacks.types.allTypes"), color: "#6b7280" },
        { id: "bug", name: t("feedbacks.types.bug"), color: "#dc2626" },
        { id: "feature", name: t("feedbacks.types.feature"), color: "#2563eb" },
        { id: "other", name: t("feedbacks.types.other"), color: "#6b7280" },
    ];

    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);

    const [convertModal, setConvertModal] = useState<{ feedback: FeedbackItem; target: "faq" | "requirement" | "bug" } | null>(null);
    const [convertForm, setConvertForm] = useState({ title: "", content: "", cat: "", orgId: "", orgName: "" });
    const [converting, setConverting] = useState(false);
    const [orgOptions, setOrgOptions] = useState<SelectOption[]>([]);

    // 加载组织列表（供转换弹窗下拉选择）
    useEffect(() => {
        OrganizationService.getOrganizationLists({})
            .then((res) => {
                const colors = ["#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899"];
                setOrgOptions(
                    (res.list || []).map((org, i) => ({
                        id: String(org.id),
                        name: org.name,
                        color: colors[i % colors.length],
                    })),
                );
            })
            .catch(() => {
                // 组织列表加载失败不阻塞页面
            });
    }, []);

    // --- FAQ 列表 ---
    const [faqs, setFaqs] = useState<HelpFaq[]>([]);
    const [faqLoading, setFaqLoading] = useState(false);
    const [faqSearch, setFaqSearch] = useState("");
    const [faqEditModal, setFaqEditModal] = useState<HelpFaq | null>(null);
    const [faqEditForm, setFaqEditForm] = useState({ q: "", a: "", cat: "" });
    const [faqSaving, setFaqSaving] = useState(false);
    const [faqPreview, setFaqPreview] = useState<HelpFaq | null>(null);

    const fetchFaqs = useCallback(async () => {
        setFaqLoading(true);
        try {
            const res = await HelpService.getFaqs();
            setFaqs(Array.isArray(res.data) ? res.data : []);
        } catch {
            // 加载失败不阻塞页面
        } finally {
            setFaqLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    const filteredFaqs = useMemo(() => {
        if (!faqSearch) {
            return faqs;
        }
        const kw = faqSearch.toLowerCase();
        return faqs.filter((f) => f.q.toLowerCase().includes(kw) || f.a.toLowerCase().includes(kw) || f.cat.includes(kw));
    }, [faqs, faqSearch]);

    const handleDeleteFaq = (id: string) => {
        confirm({
            title: t("feedbacks.confirm.deleteFaqTitle"),
            content: t("feedbacks.confirm.deleteFaqContent"),
            onConfirm: async () => {
                try {
                    await HelpService.deleteFaq(id);
                    message.success(t("feedbacks.messages.deleteSuccess"));
                    setFaqs((prev) => prev.filter((f) => f.id !== id));
                } catch (err: any) {
                    message.error(err?.message || t("feedbacks.messages.deleteFailed"));
                }
            },
        });
    };

    const openFaqEdit = (faq: HelpFaq) => {
        setFaqEditForm({ q: faq.q, a: faq.a, cat: faq.cat });
        setFaqEditModal(faq);
    };

    const handleFaqEdit = async () => {
        if (!faqEditModal) {
            return;
        }
        if (!faqEditForm.q.trim() || !faqEditForm.a.trim()) {
            message.error(t("feedbacks.messages.qaRequired"));
            return;
        }
        setFaqSaving(true);
        try {
            await HelpService.updateFaq(faqEditModal.id, {
                q: faqEditForm.q.trim(),
                a: faqEditForm.a.trim(),
                cat: faqEditForm.cat,
            });
            message.success(t("feedbacks.messages.saveSuccess"));
            setFaqEditModal(null);
            fetchFaqs();
        } catch (err: any) {
            message.error(err?.message || t("feedbacks.messages.saveFailed"));
        } finally {
            setFaqSaving(false);
        }
    };

    // 加载反馈列表
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: { page: number; page_size: number; type?: string } = {
                page,
                page_size: PAGE_SIZE,
            };
            if (typeFilter) {
                params.type = typeFilter;
            }
            const res = await HelpService.getFeedbacks(params);
            setFeedbacks(res.data.list || []);
            setTotal(res.data.total || 0);
        } catch (err: any) {
            message.error(err?.message || t("feedbacks.messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 类型筛选变化时重置页码
    const handleTypeFilterChange = (option: SelectOption | null) => {
        setTypeFilter((option?.id as string) || "");
        setPage(1);
    };

    // 客户端搜索过滤（在当前页内过滤）
    const filtered = useMemo(() => {
        if (!search) {
            return feedbacks;
        }
        const kw = search.toLowerCase();
        return feedbacks.filter((f) => f.content.toLowerCase().includes(kw) || f.contact?.toLowerCase().includes(kw));
    }, [feedbacks, search]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const start = Math.max(1, page - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);
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

    const openConvert = (feedback: FeedbackItem, target: "faq" | "requirement" | "bug") => {
        setConvertForm({
            title: feedback.content.slice(0, 40),
            content: feedback.content,
            cat: target === "faq" ? "入门" : "",
            orgId: "",
            orgName: "",
        });
        setConvertModal({ feedback, target });
    };

    const handleConvert = async () => {
        if (!convertModal) {
            return;
        }
        if (!convertForm.title.trim()) {
            message.error(t("feedbacks.messages.titleRequired"));
            return;
        }
        setConverting(true);
        try {
            const payload: { title: string; content: string; cat?: string; org_id?: string } = {
                title: convertForm.title.trim(),
                content: convertForm.content.trim(),
            };
            if (convertModal.target === "faq" && convertForm.cat) {
                payload.cat = convertForm.cat.trim();
            }
            if ((convertModal.target === "requirement" || convertModal.target === "bug") && convertForm.orgId) {
                payload.org_id = convertForm.orgId;
            }
            await HelpService.convertFeedback(convertModal.feedback.id, convertModal.target, payload);
            message.success(
                convertModal.target === "faq"
                    ? t("feedbacks.convert.successFaq")
                    : convertModal.target === "requirement"
                      ? t("feedbacks.convert.successRequirement")
                      : t("feedbacks.convert.successBug"),
            );
            setConvertModal(null);
            fetchData();
            if (convertModal.target === "faq") {
                fetchFaqs();
            }
        } catch (err: any) {
            message.error(err?.message || t("feedbacks.messages.convertFailed"));
        } finally {
            setConverting(false);
        }
    };

    const handleDelete = (id: string) => {
        confirm({
            title: t("feedbacks.confirm.deleteFeedbackTitle"),
            content: t("feedbacks.confirm.deleteFeedbackContent"),
            onConfirm: async () => {
                try {
                    await HelpService.deleteFeedback(id);
                    message.success(t("feedbacks.messages.deleteSuccess"));
                    // 如果当前页只剩一条且不是第一页，回到上一页
                    if (feedbacks.length === 1 && page > 1) {
                        setPage((p) => p - 1);
                    } else {
                        fetchData();
                    }
                } catch (err: any) {
                    message.error(err?.message || t("feedbacks.messages.deleteFailed"));
                }
            },
        });
    };

    const handleRefresh = async () => {
        setPage(1);
        setSearch("");
        setTypeFilter("");
        // 直接请求第一页、无筛选条件的数据
        setLoading(true);
        try {
            const res = await HelpService.getFeedbacks({ page: 1, page_size: PAGE_SIZE });
            setFeedbacks(res.data.list || []);
            setTotal(res.data.total || 0);
        } catch (err: any) {
            message.error(err?.message || t("feedbacks.messages.loadFailed"));
        } finally {
            setLoading(false);
        }
        fetchFaqs();
    };

    const convertTitle =
        convertModal?.target === "faq"
            ? t("feedbacks.convert.titleFaq")
            : convertModal?.target === "requirement"
              ? t("feedbacks.convert.titleRequirement")
              : t("feedbacks.convert.titleBug");

    return (
        <div className={styles.feedbackManagement}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("feedbacks.pageTitle")}</h1>
                    <p className={styles.pageDescription}>{t("feedbacks.pageDescription")}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRefresh}>
                        <FaSyncAlt /> {t("feedbacks.refresh")}
                    </button>
                </div>
            </div>

            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaClipboardList />
                    </div>
                    <div className={styles.statValue}>{loading ? "..." : total}</div>
                    <div className={styles.statLabel}>{t("feedbacks.stats.all")}</div>
                </div>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter /> {t("feedbacks.filter.title")}
                    </h3>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("feedbacks.filter.searchLabel")}</label>
                        <Input
                            placeholder={t("feedbacks.filter.searchPlaceholder")}
                            value={search}
                            onChange={setSearch}
                            prefix={<FaSearch />}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("feedbacks.filter.typeLabel")}</label>
                        <CustomSelect
                            name={t("feedbacks.types.label")}
                            options={typeOptions}
                            value={typeOptions.find((o) => o.id === typeFilter) || typeOptions[0]}
                            onChange={handleTypeFilterChange}
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>
                        <FaClipboardList /> {t("feedbacks.list.title")}
                    </h3>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                        {t("feedbacks.list.total", { total })}
                        {typeFilter ? t("feedbacks.list.filtered") : ""}
                    </span>
                </div>

                {loading ? (
                    <div className={styles.empty}>{t("feedbacks.list.loading")}</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>{t("feedbacks.list.empty")}</div>
                ) : (
                    <>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>{t("feedbacks.list.columns.content")}</th>
                                    <th>{t("feedbacks.types.label")}</th>
                                    <th>{t("feedbacks.list.columns.contact")}</th>
                                    <th>{t("feedbacks.list.columns.time")}</th>
                                    <th>{t("feedbacks.list.columns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((fb) => (
                                    <tr key={fb.id}>
                                        <td className={styles.contentCell} data-label={t("feedbacks.list.columns.content")}>
                                            {fb.content}
                                        </td>
                                        <td data-label={t("feedbacks.types.label")}>
                                            <span
                                                className={`${styles.typeBadge} ${styles[`type${fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}` as keyof typeof styles] || ""}`}
                                            >
                                                {typeLabels[fb.type]}
                                            </span>
                                        </td>
                                        <td className={styles.contactCell} data-label={t("feedbacks.list.columns.contact")}>
                                            {fb.contact || "-"}
                                        </td>
                                        <td className={styles.timeCell} data-label={t("feedbacks.list.columns.time")}>
                                            {formatDateTime(fb.created_at)}
                                        </td>
                                        <td data-label={t("feedbacks.list.columns.actions")}>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openConvert(fb, "faq")}
                                                    title={t("feedbacks.list.actions.convertFaq")}
                                                >
                                                    <FaQuestionCircle />
                                                </button>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openConvert(fb, "requirement")}
                                                    title={t("feedbacks.list.actions.convertRequirement")}
                                                >
                                                    <FaLightbulb />
                                                </button>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openConvert(fb, "bug")}
                                                    title={t("feedbacks.list.actions.convertBug")}
                                                >
                                                    <FaBug />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.delete}`}
                                                    onClick={() => handleDelete(fb.id)}
                                                    title={t("feedbacks.list.actions.delete")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages >= 1 && (
                            <div className={styles.pagination}>
                                <span className={styles.pageInfo}>
                                    {t("feedbacks.list.pagination.info", {
                                        start: (page - 1) * PAGE_SIZE + 1,
                                        end: Math.min(page * PAGE_SIZE, total),
                                        total,
                                    })}
                                </span>
                                <div className={styles.pageButtons}>
                                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>
                                        <FaAngleDoubleLeft />
                                    </button>
                                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                        <FaChevronLeft />
                                    </button>
                                    {getPageNumbers().map((p, index) => (
                                        <React.Fragment key={index}>
                                            {p === "..." ? (
                                                <span className={styles.paginationEllipsis}>...</span>
                                            ) : (
                                                <button
                                                    className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}
                                                    onClick={() => setPage(p as number)}
                                                >
                                                    {p}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page === totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page === totalPages}
                                        onClick={() => setPage(totalPages)}
                                    >
                                        <FaAngleDoubleRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FAQ 常见问题列表 */}
            <div className={styles.tableContainer} style={{ marginTop: 24 }}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>
                        <FaBook /> {t("feedbacks.faq.title")}
                    </h3>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                        {t("feedbacks.faq.total", { total: filteredFaqs.length })}
                    </span>
                </div>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                    <Input
                        placeholder={t("feedbacks.faq.searchPlaceholder")}
                        value={faqSearch}
                        onChange={setFaqSearch}
                        prefix={<FaSearch />}
                        size="large"
                        style={{ maxWidth: 360, minHeight: "42px", height: "46px" }}
                    />
                </div>

                {faqLoading ? (
                    <div className={styles.empty}>{t("feedbacks.faq.loading")}</div>
                ) : filteredFaqs.length === 0 ? (
                    <div className={styles.empty}>{faqSearch ? t("feedbacks.faq.noMatch") : t("feedbacks.faq.empty")}</div>
                ) : (
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>{t("feedbacks.faq.columns.question")}</th>
                                <th>{t("feedbacks.faq.columns.answer")}</th>
                                <th>{t("feedbacks.faq.columns.category")}</th>
                                <th>{t("feedbacks.faq.columns.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaqs.map((faq) => (
                                <tr key={faq.id}>
                                    <td className={styles.contentCell} data-label={t("feedbacks.faq.columns.question")}>
                                        {faq.q}
                                    </td>
                                    <td className={styles.contentCell} data-label={t("feedbacks.faq.columns.answer")}>
                                        {faq.a.length > 60 ? faq.a.slice(0, 60) + "..." : faq.a}
                                    </td>
                                    <td data-label={t("feedbacks.faq.columns.category")}>
                                        <span className={styles.typeBadge} style={{ background: "#dbeafe", color: "#2563eb" }}>
                                            {faq.cat}
                                        </span>
                                    </td>
                                    <td data-label={t("feedbacks.faq.columns.actions")}>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => setFaqPreview(faq)}
                                                title={t("feedbacks.faq.actions.preview")}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => openFaqEdit(faq)}
                                                title={t("feedbacks.faq.actions.edit")}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.delete}`}
                                                onClick={() => handleDeleteFaq(faq.id)}
                                                title={t("feedbacks.faq.actions.delete")}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {convertModal && (
                <Modal visible onClose={() => setConvertModal(null)} title={convertTitle}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("feedbacks.convert.form.title")}</label>
                        <Input
                            className={styles.formInput}
                            value={convertForm.title}
                            onChange={(v) => setConvertForm((f) => ({ ...f, title: v }))}
                        />
                    </div>
                    {convertModal.target === "faq" && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("feedbacks.convert.form.category")}</label>
                            <CustomSelect
                                name={t("feedbacks.convert.form.category")}
                                options={faqCategoryOptions}
                                value={faqCategoryOptions.find((o) => o.id === convertForm.cat) ?? null}
                                onChange={(option) => setConvertForm((f) => ({ ...f, cat: String(option?.id ?? "") }))}
                                placeholder={t("feedbacks.convert.form.categoryPlaceholder")}
                                hideBadge={true}
                            />
                        </div>
                    )}
                    {(convertModal.target === "requirement" || convertModal.target === "bug") && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("feedbacks.convert.form.org")}</label>
                            <CustomSelect
                                name="org"
                                options={orgOptions}
                                value={orgOptions.find((o) => o.id === convertForm.orgId) ?? null}
                                onChange={(option) =>
                                    setConvertForm((f) => ({
                                        ...f,
                                        orgId: String(option?.id ?? ""),
                                        orgName: option?.name ?? "",
                                    }))
                                }
                                placeholder={t("feedbacks.convert.form.orgPlaceholder")}
                                hideBadge={true}
                            />
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("feedbacks.convert.form.content")}</label>
                        <textarea
                            className={styles.formTextarea}
                            value={convertForm.content}
                            onChange={(e) => setConvertForm((f) => ({ ...f, content: e.target.value }))}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConvertModal(null)}>
                            {t("feedbacks.convert.cancel")}
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConvert} disabled={converting}>
                            {converting ? (
                                t("feedbacks.convert.processing")
                            ) : (
                                <>
                                    <FaPlus /> {t("feedbacks.convert.confirm", { title: convertTitle })}
                                </>
                            )}
                        </button>
                    </div>
                </Modal>
            )}

            {faqEditModal && (
                <Modal visible onClose={() => setFaqEditModal(null)} title={t("feedbacks.faq.edit.title")}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("feedbacks.faq.edit.question")}</label>
                        <Input
                            className={styles.formInput}
                            value={faqEditForm.q}
                            onChange={(v) => setFaqEditForm((f) => ({ ...f, q: v }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("feedbacks.faq.edit.answer")}</label>
                        <textarea
                            className={styles.formTextarea}
                            value={faqEditForm.a}
                            onChange={(e) => setFaqEditForm((f) => ({ ...f, a: e.target.value }))}
                            style={{ minHeight: 150 }}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("feedbacks.faq.edit.category")}</label>
                        <CustomSelect
                            name={t("feedbacks.faq.edit.category")}
                            options={faqCategoryOptions}
                            value={faqCategoryOptions.find((o) => o.id === faqEditForm.cat) ?? null}
                            onChange={(option) => setFaqEditForm((f) => ({ ...f, cat: String(option?.id ?? "") }))}
                            placeholder={t("feedbacks.faq.edit.categoryPlaceholder")}
                            hideBadge={true}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setFaqEditModal(null)}>
                            {t("feedbacks.faq.edit.cancel")}
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleFaqEdit} disabled={faqSaving}>
                            {faqSaving ? t("feedbacks.faq.edit.saving") : t("feedbacks.faq.edit.save")}
                        </button>
                    </div>
                </Modal>
            )}

            {faqPreview && (
                <Modal visible onClose={() => setFaqPreview(null)} title={t("feedbacks.faq.preview.title")} size="large">
                    <div style={{ marginBottom: 16 }}>
                        <span
                            className={styles.typeBadge}
                            style={{ background: "#dbeafe", color: "#2563eb", fontSize: 13, padding: "4px 12px" }}
                        >
                            {faqPreview.cat}
                        </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px" }}>{faqPreview.q}</h3>
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.8,
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            padding: "16px",
                            background: "var(--bg-secondary)",
                            borderRadius: 8,
                            border: "1px solid var(--border-primary)",
                        }}
                    >
                        {faqPreview.a}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FeedbackManagement;

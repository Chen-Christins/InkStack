import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FaFilter,
    FaReply,
    FaTrash,
    FaBan,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaFileAlt,
    FaClock,
    FaExclamationTriangle,
    FaStar,
    FaFlag,
} from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Loading from "@/components/loading/Loading";
import Avatar from "@/components/avatar/Avatar";
import { confirm } from "@/components/confirm/Confirm";
import CommentService from "@/services/CommentService.ts";
import type { AdminComment } from "@/types/Comment.ts";
import type { SelectOption } from "@/types";
import type { CommentStatus } from "@/types/Enums.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { useInitialLoaded } from "@/hooks/UseInitialLoaded";
import styles from "./CommentManagement.module.css";

interface FilterOptions {
    search: string;
    status: string;
    articleId: string;
    dateRange: string;
    isReported: string;
}

const PAGE_SIZE = 10;

const CommentManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const enums = useEnumLabels();
    const [comments, setComments] = useState<AdminComment[]>([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        status: "",
        articleId: "",
        dateRange: "",
        isReported: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const initialLoaded = useInitialLoaded(loading);
    const [selectedComments, setSelectedComments] = useState<string[]>([]);
    const [showReplies, setShowReplies] = useState<string[]>([]);

    // 加载数据
    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const params: {
                page_num: number;
                page_size: number;
                status?: string;
                keyword?: string;
                article_id?: string;
                is_reported?: number;
            } = {
                page_num: currentPage,
                page_size: PAGE_SIZE,
            };
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.search) {
                params.keyword = filters.search;
            }
            if (filters.articleId) {
                params.article_id = filters.articleId;
            }
            if (filters.isReported) {
                params.is_reported = filters.isReported === "true" ? 1 : 0;
            }

            const data = await CommentService.getAdminList(params);
            setComments(data.list);
            setTotal(data.total);
        } catch {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // 筛选时重置页码
    const updateFilter = useCallback((field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    }, []);

    // 分页计算
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(currentPage * PAGE_SIZE, total);

    // 筛选选项数据
    const statusOptions: SelectOption[] = [
        { id: "", name: t("comments.filter.statusOptions.all"), color: "#6c757d" },
        { id: "approved", name: t("comments.filter.statusOptions.approved"), color: "#28a745" },
        { id: "pending", name: t("comments.filter.statusOptions.pending"), color: "#ffc107" },
        { id: "rejected", name: t("comments.filter.statusOptions.rejected"), color: "#dc3545" },
        { id: "spam", name: t("comments.filter.statusOptions.spam"), color: "#dc3545" },
    ];

    const reportedOptions: SelectOption[] = [
        { id: "", name: t("comments.filter.reportedOptions.all"), color: "#6c757d" },
        { id: "true", name: t("comments.filter.reportedOptions.reported"), color: "#dc3545" },
        { id: "false", name: t("comments.filter.reportedOptions.normal"), color: "#28a745" },
    ];

    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            updateFilter(field, selectedOption?.id?.toString() || "");
        };
    };

    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        updateFilter(field, value);
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            articleId: "",
            dateRange: "",
            isReported: "",
        });
        setCurrentPage(1);
    };

    // 批量操作

    const handleSelectComment = (commentId: string, checked: boolean) => {
        if (checked) {
            setSelectedComments((prev) => [...prev, commentId]);
        } else {
            setSelectedComments((prev) => prev.filter((id) => id !== commentId));
        }
    };

    // 批准评论
    const approveComments = async (commentIds: string[]) => {
        await confirm({
            title: t("comments.confirm.approveTitle"),
            content: t("comments.confirm.approveContent", { total: commentIds.length }),
            confirmText: t("comments.confirm.approveConfirm"),
            cancelText: t("comments.confirm.cancel"),
            onConfirm: async () => {
                await CommentService.approve(commentIds);
                setSelectedComments([]);
                fetchComments();
            },
        });
    };

    // 拒绝评论
    const rejectComments = async (commentIds: string[]) => {
        await confirm({
            title: t("comments.confirm.rejectTitle"),
            content: t("comments.confirm.rejectContent", { total: commentIds.length }),
            confirmText: t("comments.confirm.rejectConfirm"),
            cancelText: t("comments.confirm.cancel"),
            onConfirm: async () => {
                await CommentService.reject(commentIds);
                setSelectedComments([]);
                fetchComments();
            },
        });
    };

    // 标记为垃圾评论
    const markAsSpam = async (commentIds: string[]) => {
        await confirm({
            title: t("comments.confirm.spamTitle"),
            content: t("comments.confirm.spamContent", { total: commentIds.length }),
            confirmText: t("comments.confirm.spamConfirm"),
            cancelText: t("comments.confirm.cancel"),
            onConfirm: async () => {
                await CommentService.markSpam(commentIds);
                setSelectedComments([]);
                fetchComments();
            },
        });
    };

    // 删除评论
    const deleteComments = async (commentIds: string[]) => {
        await confirm({
            title: t("comments.confirm.deleteTitle"),
            content: t("comments.confirm.deleteContent", { total: commentIds.length }),
            confirmText: t("comments.confirm.deleteConfirm"),
            cancelText: t("comments.confirm.cancel"),
            onConfirm: async () => {
                await CommentService.batchDelete(commentIds);
                setSelectedComments([]);
                fetchComments();
            },
        });
    };

    // 切换回复显示
    const toggleReplies = (commentId: string) => {
        setShowReplies((prev) => (prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId]));
    };

    // 格式化日期（Unix 时间戳）
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // 获取回复评论
    const getReplies = (parentId: string) => {
        return comments.filter((comment) => comment.parent_id === parentId);
    };

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

    if (loading && !initialLoaded) {
        return (
            <div className={styles.commentManagement}>
                <Loading text={t("comments.loading")} size="large" />
            </div>
        );
    }

    return (
        <div className={styles.commentManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("comments.title")}</h1>
                    <p className={styles.pageDescription}>{t("comments.description")}</p>
                </div>
                <div className={styles.headerActions}>
                    <span
                        style={{
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                            marginRight: "12px",
                        }}
                    >
                        {t("comments.totalComments", { total })}
                    </span>
                </div>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        {t("comments.filter.title")}
                    </h3>
                    <div className={styles.filterActions}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                            {t("comments.filter.clear")}
                        </button>
                    </div>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("comments.filter.searchLabel")}</label>
                        <Input
                            placeholder={t("comments.filter.searchPlaceholder")}
                            value={filters.search}
                            onChange={(value) => handleFilterChange("search", value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("comments.filter.statusLabel")}</label>
                        <CustomSelect
                            name={t("comments.filter.statusLabel")}
                            options={statusOptions}
                            value={statusOptions.find((option) => option.id === filters.status) || null}
                            onChange={handleSelectChange("status")}
                            placeholder={t("comments.filter.statusPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("comments.filter.reportedLabel")}</label>
                        <CustomSelect
                            name={t("comments.filter.reportedLabel")}
                            options={reportedOptions}
                            value={reportedOptions.find((option) => option.id === filters.isReported) || null}
                            onChange={handleSelectChange("isReported")}
                            placeholder={t("comments.filter.reportedPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 批量操作栏 */}
            {selectedComments.length > 0 && (
                <div className={styles.batchActions}>
                    <div className={styles.batchInfo}>{t("comments.batch.selected", { total: selectedComments.length })}</div>
                    <div className={styles.batchButtons}>
                        <button
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                            onClick={() => approveComments(selectedComments)}
                        >
                            <FaCheck />
                            {t("comments.batch.approve")}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnWarning} ${styles.btnSm}`}
                            onClick={() => rejectComments(selectedComments)}
                        >
                            <FaBan />
                            {t("comments.batch.reject")}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                            onClick={() => markAsSpam(selectedComments)}
                        >
                            <FaExclamationTriangle />
                            {t("comments.batch.markSpam")}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            onClick={() => deleteComments(selectedComments)}
                        >
                            <FaTrash />
                            {t("comments.batch.delete")}
                        </button>
                    </div>
                </div>
            )}

            {/* 评论列表 */}
            <div className={styles.commentsContainer}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <Loading size="small" />
                    </div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => {
                        const replies = getReplies(comment.id);
                        const hasReplies = replies.length > 0;
                        const showReplyList = showReplies.includes(comment.id);

                        return (
                            <div key={comment.id} className={styles.commentCard}>
                                <div className={styles.commentHeader}>
                                    <div className={styles.commentMeta}>
                                        <input
                                            type="checkbox"
                                            checked={selectedComments.includes(comment.id)}
                                            onChange={(e) => handleSelectComment(comment.id, e.target.checked)}
                                            className={styles.commentCheckbox}
                                        />
                                        <div className={styles.authorInfo}>
                                            <Avatar src={comment.author.avatar} name={comment.author.name} size={40} />
                                            <div className={styles.authorDetails}>
                                                <div className={styles.authorName}>{comment.author.name}</div>
                                                <div className={styles.authorEmail}>{comment.author.email}</div>
                                            </div>
                                        </div>
                                        <div className={styles.commentInfo}>
                                            <span className={`${styles.statusBadge} ${styles[comment.status]}`}>
                                                {enums.commentStatus[comment.status as CommentStatus] || comment.status}
                                            </span>
                                            {comment.is_reported && (
                                                <span className={styles.reportedBadge}>
                                                    <FaFlag />
                                                    {t("comments.card.report", { value: comment.report_count })}
                                                </span>
                                            )}
                                            <span className={styles.commentTime}>
                                                <FaClock />
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.commentActions}>
                                        {comment.status === "pending" && (
                                            <>
                                                <button
                                                    className={`${styles.actionButton} ${styles.approve}`}
                                                    title={t("comments.actions.approve")}
                                                    onClick={() => approveComments([comment.id])}
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.reject}`}
                                                    title={t("comments.actions.reject")}
                                                    onClick={() => rejectComments([comment.id])}
                                                >
                                                    <FaBan />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className={`${styles.actionButton} ${styles.spam}`}
                                            title={t("comments.actions.markSpam")}
                                            onClick={() => markAsSpam([comment.id])}
                                        >
                                            <FaExclamationTriangle />
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.delete}`}
                                            title={t("comments.actions.delete")}
                                            onClick={() => deleteComments([comment.id])}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.commentContent}>
                                    <div className={styles.articleLink}>
                                        <FaFileAlt />
                                        {t("comments.card.article", { value: comment.article.title })}
                                    </div>
                                    <div className={styles.contentText}>{comment.content}</div>
                                    <div className={styles.commentStats}>
                                        <span className={styles.statItem}>
                                            <FaStar />
                                            {t("comments.card.likes", { value: comment.likes })}
                                        </span>
                                        {hasReplies && (
                                            <button className={styles.statItem} onClick={() => toggleReplies(comment.id)}>
                                                <FaReply />
                                                {t("comments.card.replies", { value: replies.length })}
                                                {showReplyList ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 回复列表 */}
                                {hasReplies && showReplyList && (
                                    <div className={styles.repliesList}>
                                        {replies.map((reply) => (
                                            <div key={reply.id} className={styles.replyItem}>
                                                <div className={styles.replyHeader}>
                                                    <div className={styles.replyAuthor}>
                                                        <Avatar src={reply.author.avatar} name={reply.author.name} size={32} />
                                                        <div className={styles.replyInfo}>
                                                            <span className={styles.replyName}>{reply.author.name}</span>
                                                            <span className={styles.replyTime}>{formatDate(reply.created_at)}</span>
                                                            <span
                                                                className={`${styles.statusBadge} ${styles[reply.status]} ${styles.small}`}
                                                            >
                                                                {enums.commentStatus[reply.status as CommentStatus] || reply.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.replyActions}>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.small}`}
                                                            title={t("comments.actions.delete")}
                                                            onClick={() => deleteComments([reply.id])}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className={styles.replyContent}>{reply.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        {t("comments.empty")}
                    </div>
                )}
            </div>

            {/* 分页 */}
            {totalPages >= 1 && (
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        {t("comments.pagination.info", { start: startIndex, end: endIndex, total })}
                    </div>
                    <div className={styles.paginationControls}>
                        <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            <FaAngleDoubleLeft />
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <FaChevronLeft />
                        </button>

                        {getPageNumbers().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === "..." ? (
                                    <span className={styles.paginationEllipsis}>...</span>
                                ) : (
                                    <button
                                        className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                                        onClick={() => setCurrentPage(page as number)}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}

                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <FaAngleDoubleRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentManagement;

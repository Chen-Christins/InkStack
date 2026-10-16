import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaPlus, FaEye, FaSearch, FaCalendarAlt, FaThumbsUp, FaComment, FaArrowDown, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { encodeId } from "@/utils/HashId.ts";
import CustomSelect from "@/components/customSelect/CustomSelect";
import { confirm } from "@/components/confirm/Confirm";
import { message } from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import type { SelectOption } from "@/types";
import ArticleService from "@/services/ArticleService.ts";
import { formatToChinaTime } from "@/utils/Utils.ts";
import type { ArticleListItem } from "@/types";
import { ArticleState } from "@/types/Enums.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import styles from "../PersonalCenter.module.css";

const STATE_MAP: Record<number, string> = {
    1: "reviewing",
    2: "published",
    3: "unallowed",
    4: "private",
};

const STATE_VALUE_MAP: Record<string, ArticleState> = {
    reviewing: ArticleState.REVIEWING,
    published: ArticleState.PUBLISHED,
    unallowed: ArticleState.UNALLOWED,
    private: ArticleState.PRIVATE,
};

const MyArticlesTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const enums = useEnumLabels();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [totalArticles, setTotalArticles] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "private" | "unallowed" | "reviewing">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 状态筛选选项
    const statusOptions: SelectOption[] = [
        { id: "all", name: t("articles.status.all"), color: "#6c757d" },
        { id: "published", name: enums.articleState[ArticleState.PUBLISHED], color: "#28a745" },
        { id: "private", name: enums.articleState[ArticleState.PRIVATE], color: "#dc3545" },
        { id: "unallowed", name: enums.articleState[ArticleState.UNALLOWED], color: "#1474e2ff" },
        { id: "reviewing", name: enums.articleState[ArticleState.REVIEWING], color: "#17a2b8" },
    ];

    // 获取状态对应的数值
    const getStatusValue = (statusId: string): number | undefined => {
        switch (statusId) {
            case "published":
                return 2;
            case "private":
                return 4;
            case "unallowed":
                return 3;
            case "reviewing":
                return 1;
            default:
                return undefined; // 'all'
        }
    };

    // 当前选中的状态选项
    const [selectedStatus, setSelectedStatus] = useState<SelectOption | null>(statusOptions[0]);

    // 文章搜索和筛选逻辑改为渲染时处理，避免 setState 触发多次请求

    useEffect(() => {
        const fetchArticleIds = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const stateValue = getStatusValue(statusFilter);
                const response = await ArticleService.listArticlesByUserIdPages({
                    user_id: user.id,
                    page_from: currentPage,
                    page_size: itemsPerPage,
                    state: stateValue,
                });
                setTotalArticles(typeof response.total === "number" ? response.total : response.list.length);
                if (response.list && response.list.length > 0) {
                    setArticles(
                        response.list.map((article) => ({
                            id: article.id,
                            title: article.title,
                            author: article.author,
                            summary: article.summary,
                            state: STATE_MAP[article.state],
                            type: article.type === 1 ? t("articles.type.original") : t("articles.type.reprint"),
                            publish_time: article.publish_time ? formatToChinaTime(article.publish_time) : t("articles.notPublished"),
                            views: article.views ?? 0,
                            praise: article.praise ?? 0,
                            favorites: article.favorites ?? 0,
                            category: article.categories?.map((c: any) => c.name).join("、") || t("articles.uncategorized"),
                            tags: [],
                            categories: article.categories || [],
                            comment_count: article.comment_count ?? 0,
                        })),
                    );
                } else {
                    setArticles([]);
                }
            } catch (err) {
                console.error("获取文章ID列表失败:", err);
                setTotalArticles(0);
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };
        fetchArticleIds();
    }, [user?.id, statusFilter, currentPage, t]);

    // 处理状态筛选变化
    const handleStatusChange = (selectedOption: SelectOption | null) => {
        setSelectedStatus(selectedOption);
        const newStatus = selectedOption ? (selectedOption.id as "all" | "published" | "private" | "unallowed" | "reviewing") : "all";
        setStatusFilter(newStatus);
        setCurrentPage(1);
        // 不再 setArticles([])，避免多次请求
    };

    // 分页计算
    const totalPages = Math.ceil(totalArticles / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + articles.length;
    // 渲染时本地筛选
    const currentArticles = articles.filter((article) => {
        if (!searchTerm) {
            return true;
        }
        return (
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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

    // 删除文章
    const handleDeleteArticle = async (id: string | number) => {
        const isConfirmed = await confirm({
            title: t("articles.delete.title"),
            content: t("articles.delete.content"),
            confirmText: t("articles.delete.confirm"),
            cancelText: t("articles.delete.cancel"),
        });

        if (isConfirmed) {
            try {
                await ArticleService.deleteArticle({ ids: String(id) });
                message.success(t("articles.delete.success"));
                // 删除成功后从本地状态移除
                const newAllIds = articles.filter((aid) => aid.id !== id);
                setArticles(newAllIds);
                setTotalArticles((prev) => prev - 1);

                // 如果当前页为空且不是第一页，则跳转到上一页
                if (newAllIds.length === 0 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } catch (err) {
                console.error("删除文章失败:", err);
                message.error(t("articles.delete.failed"));
            }
        }
    };

    // 切换文章状态
    const handleToggleStatus = async (
        id: string | number,
        newStatus: "published" | "private" | "unallowed" | "reviewing",
        title?: string,
    ) => {
        try {
            if (newStatus === "reviewing") {
                await ArticleService.publishArticle({
                    id: id,
                    publish_time: Math.floor(Date.now() / 1000),
                });
                message.success(
                    <span>
                        {t("articles.message.publishSuccessPrefix")}
                        <strong>{title || t("articles.untitled")}</strong>
                        {t("articles.message.publishSuccessSuffix")}
                    </span>,
                );
                setArticles(articles.map((article) => (article.id === id ? { ...article, state: newStatus } : article)));
            }
            if (newStatus === "private") {
                await ArticleService.switchArticleState({
                    id: id,
                    state: 4,
                });
                message.success(t("articles.message.setPrivateSuccess"));
                setArticles(articles.map((article) => (article.id === id ? { ...article, state: newStatus } : article)));
            }
        } catch (err) {
            console.error("切换文章状态失败:", err);
            message.error(t("articles.message.toggleFailed"));
        }
    };

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("articles.title")}</h2>
                <button onClick={() => navigate("/article/create")} className={styles.addButton}>
                    <FaPlus />
                    {t("articles.newArticle")}
                </button>
            </div>

            {/* 搜索和筛选 */}
            <div className={styles.searchFilterBar}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t("articles.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CustomSelect
                    name={t("articles.status.label")}
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    className={styles.statusSelect}
                    hideBadge={true}
                />
            </div>

            {/* 文章列表 */}
            <div className={styles.articlesList}>
                <div className={styles.listHeader}>
                    <div>{t("articles.table.headers.title")}</div>
                    <div>{t("articles.table.headers.category")}</div>
                    <div>{t("articles.table.headers.status")}</div>
                    <div>{t("articles.table.headers.data")}</div>
                    <div>{t("articles.table.headers.publishTime")}</div>
                    <div>{t("articles.table.headers.actions")}</div>
                </div>
                {loading ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        {t("articles.loading")}
                    </div>
                ) : currentArticles.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        {t("articles.empty")}
                    </div>
                ) : (
                    currentArticles.map((article) => (
                        <div key={article.id} className={styles.listItem}>
                            <div className={styles.articleTitle}>
                                <div>{article.title}</div>
                                <div className={styles.articleSummary}>{article.summary.replace(/�/g, "")}...</div>
                            </div>
                            <div className={styles.articleCategory}>
                                {article.categories && article.categories.length > 0
                                    ? article.categories.map((cat) => (
                                          <span key={cat.id} className={styles.categoryBadge}>
                                              {cat.name}
                                          </span>
                                      ))
                                    : article.category}
                            </div>
                            <div className={styles.statusCell}>
                                <span className={`${styles.statusBadge} ${styles[article.state]}`}>
                                    {enums.articleState[STATE_VALUE_MAP[article.state]]}
                                </span>
                            </div>
                            <div className={styles.dataCell}>
                                <div className={styles.dataItem}>
                                    <FaEye /> {article.views}
                                </div>
                                <div className={styles.dataItem}>
                                    <FaThumbsUp /> {article.praise}
                                </div>
                                <div className={styles.dataItem}>
                                    <FaComment /> {article.comment_count}
                                </div>
                            </div>
                            <div className={styles.dateCell}>
                                <FaCalendarAlt />
                                {article.publish_time ? article.publish_time : "-"}
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.actionButton}
                                    title={t("articles.action.view")}
                                    onClick={() => navigate(`/article/${encodeId(article.id, "article")}`)}
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className={styles.actionButton}
                                    title={t("articles.action.edit")}
                                    onClick={() => navigate(`/article/edit/${encodeId(article.id, "article")}`)}
                                >
                                    <FaEdit />
                                </button>
                                {article.state === "reviewing" && (
                                    <button
                                        className={styles.actionButton}
                                        title={t("articles.action.withdrawReview")}
                                        onClick={() => handleToggleStatus(article.id, "private", article.title)}
                                    >
                                        <FaArrowDown />
                                    </button>
                                )}
                                {article.state === "published" && (
                                    <button
                                        className={styles.actionButton}
                                        title={t("articles.action.setPrivate")}
                                        onClick={() => handleToggleStatus(article.id, "private", article.title)}
                                    >
                                        <FaLock />
                                    </button>
                                )}
                                {article.state === "private" && (
                                    <button
                                        className={styles.actionButton}
                                        title={t("articles.action.publish")}
                                        onClick={() => handleToggleStatus(article.id, "reviewing", article.title)}
                                    >
                                        <FaPlus />
                                    </button>
                                )}
                                {article.state === "unallowed" && (
                                    <button
                                        className={styles.actionButton}
                                        title={t("articles.action.resubmit")}
                                        onClick={() => handleToggleStatus(article.id, "reviewing", article.title)}
                                    >
                                        <FaPlus />
                                    </button>
                                )}
                                <button
                                    className={styles.actionButton}
                                    title={t("articles.action.delete")}
                                    onClick={() => handleDeleteArticle(article.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 分页 */}
            {totalPages >= 1 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        {t("articles.pagination.info", {
                            start: startIndex + 1,
                            end: Math.min(endIndex, totalArticles),
                            total: totalArticles,
                        })}
                    </div>
                    <div className={styles.paginationControls}>
                        <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            {t("articles.pagination.first")}
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            {t("articles.pagination.prev")}
                        </button>
                        {getPageNumbers().map((page, index) => (
                            <button
                                key={index}
                                className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                                onClick={() => page !== "..." && setCurrentPage(page as number)}
                                disabled={page === "..."}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t("articles.pagination.next")}
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            {t("articles.pagination.last")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyArticlesTab;

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { encodeId } from "@/utils/HashId.ts";
import {
    FaFileAlt,
    FaPlus,
    FaFilter,
    FaEdit,
    FaTrash,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaThumbsUp,
    FaThumbsDown,
    FaBan,
    FaHourglassHalf,
    FaTimes,
    FaStar,
    FaFlag,
    FaTags,
    FaUser,
    FaCalendar,
    FaClock,
    FaHeart,
    FaComment,
    FaClipboardCheck,
} from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import type { SelectOption } from "@/types";
import { PlatformRoleByKey, type PlatformRole } from "@/types/Roles.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { useInitialLoaded } from "@/hooks/UseInitialLoaded";
import styles from "./ArticleManagement.module.css";
import ArticleService, { type ListAdminArticlesResponse, type ArticleStatsResponse } from "@/services/ArticleService.ts";
import { CategoryService } from "@/services/CategoryService.ts";
import { formatToChinaTime } from "@/utils/Utils.ts";
import message from "@/components/message/Message";

// 文章接口定义
interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    author: string;
    authorEmail: string;
    authorRole: string;
    category: string;
    tags: string[];
    status: "pending" | "published" | "rejected" | "private";
    featured: boolean;
    views: number;
    likes: number;
    comments: number;
    readTime: number;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
    reportCount: number;
    isReported: boolean;
}

// 统计数据接口
interface ArticleStats {
    totalArticles: number;
    pendingArticles: number;
    publishedArticles: number;
    rejectedArticles: number;
    reportedArticles: number;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    status: string;
    category: string;
    authorRole: string;
    dateRange: string;
}

// 状态映射
const STATE_MAP: Record<number, Article["status"]> = {
    1: "pending",
    2: "published",
    3: "rejected",
    4: "private",
};

const REVERSE_STATE_MAP: Record<string, number> = {
    pending: 1,
    published: 2,
    rejected: 3,
    private: 4,
};

const ArticleManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation("admin");
    const enums = useEnumLabels();
    // 状态管理
    const [articles, setArticles] = useState<Article[]>([]);
    const [stats, setStats] = useState<ArticleStats>({
        totalArticles: 0,
        pendingArticles: 0,
        publishedArticles: 0,
        rejectedArticles: 0,
        reportedArticles: 0,
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        status: "",
        category: "",
        authorRole: "",
        dateRange: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const initialLoaded = useInitialLoaded(loading);
    const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([
        { id: "", name: t("articles.filter.allCategories"), color: "#6c757d" },
    ]);

    const [totalArticles, setTotalArticles] = useState(0);
    const articlesPerPage = 15; // 每页显示15条数据

    // 加载分类数据
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await CategoryService.queryCategory();
                if (res) {
                    const options = res.list.map((cat) => ({
                        id: cat.id,
                        name: cat.name,
                        color: cat.color || "#007bff",
                    }));
                    setCategoryOptions([{ id: "", name: t("articles.filter.allCategories"), color: "#6c757d" }, ...options]);
                }
            } catch (error) {
                console.error("获取分类失败:", error);
            }
        };
        fetchCategories();
    }, []);

    // 加载统计数据
    const fetchStats = async () => {
        try {
            const days =
                filters.dateRange === "7days"
                    ? 7
                    : filters.dateRange === "30days"
                      ? 30
                      : filters.dateRange === "90days"
                        ? 90
                        : undefined;

            const res: ArticleStatsResponse = await ArticleService.getAdminArticleStats({
                category_id: filters.category || undefined,
                role: filters.authorRole ? PlatformRoleByKey[filters.authorRole] : undefined,
                days,
                keyword: filters.search || undefined,
            });
            setStats({
                totalArticles: res.total_articles,
                pendingArticles: res.pending_articles,
                publishedArticles: res.published_articles,
                rejectedArticles: res.rejected_articles,
                reportedArticles: res.reported_articles,
            });
        } catch (error) {
            console.error("获取统计数据失败:", error);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // 加载文章数据
    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const stateValue = filters.status ? REVERSE_STATE_MAP[filters.status] : 0;

                // 处理日期筛选
                let days: number | undefined;
                if (filters.dateRange === "7days") {
                    days = 7;
                } else if (filters.dateRange === "30days") days = 30;
                else if (filters.dateRange === "90days") days = 90;

                const res: ListAdminArticlesResponse = await ArticleService.listAdminArticlesByPages({
                    page_num: currentPage,
                    page_size: articlesPerPage,
                    state: stateValue || 0, // 获取所有状态的文章
                    keyword: filters.search,
                    category_id: filters.category,
                    role: filters.authorRole ? PlatformRoleByKey[filters.authorRole] : -1,
                    days: days,
                });

                setTotalArticles(res.total);
                setArticles(
                    (res.list || []).map((article) => ({
                        id: String(article.id),
                        title: article.title,
                        slug: "asdasdsad", // 占位符，API未提供
                        summary: article.summary.substring(0, 45) + "...",
                        author: article.author,
                        authorEmail: article.email,
                        authorRole: enums.platformRole[article.author_role as PlatformRole] || t("articles.common.user"), // 使用API提供的author_role字段
                        category: t("articles.common.defaultCategory"), // 占位符，API未提供
                        tags: [], // 占位符，API未提供
                        status: STATE_MAP[article.state] || "draft",
                        featured: false, // 占位符，API未提供
                        views: article.views ?? 0,
                        likes: article.praise ?? 0,
                        comments: article.comment_count ?? 0,
                        readTime: 0, // 占位符，API未提供
                        publishedAt: article.publish_time
                            ? formatToChinaTime(Number(article.publish_time))
                            : t("articles.common.notPublished"),
                        createdAt: formatToChinaTime(Number(article.publish_time)),
                        updatedAt: formatToChinaTime(Number(article.update_time)),
                        reviewedAt: undefined,
                        reviewedBy: undefined,
                        rejectionReason: undefined,
                        reportCount: 0,
                        isReported: false,
                    })),
                );
            } catch (error) {
                console.error("获取文章列表失败:", error);
                setTotalArticles(0);
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [currentPage, filters]);

    // 筛选文章数据
    const filteredArticles = useMemo(() => {
        return articles;
    }, [articles]);

    // 分页计算
    const totalPages = Math.ceil(totalArticles / articlesPerPage);
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articles.length;
    const currentArticles = filteredArticles;

    // 筛选选项数据
    const statusOptions: SelectOption[] = [
        { id: "", name: t("articles.status.all"), color: "#6c757d" },
        { id: "pending", name: t("articles.status.pending"), color: "#ffc107" },
        { id: "published", name: t("articles.status.published"), color: "#007bff" },
        { id: "rejected", name: t("articles.status.rejected"), color: "#dc3545" },
        { id: "private", name: t("articles.status.private"), color: "#9129e7ff" },
    ];

    const authorRoleOptions: SelectOption[] = [
        { id: "", name: t("articles.authorRole.all"), color: "#6c757d" },
        { id: "admin", name: t("articles.authorRole.admin"), color: "#dc3545" },
        { id: "editor", name: t("articles.authorRole.editor"), color: "#28a745" },
        { id: "checker", name: t("articles.authorRole.checker"), color: "#007bff" },
        { id: "user", name: t("articles.authorRole.user"), color: "#6c757d" },
    ];

    const dateRangeOptions: SelectOption[] = [
        { id: "", name: t("articles.dateRange.all"), color: "#6c757d" },
        { id: "7days", name: t("articles.dateRange.days7"), color: "#17a2b8" },
        { id: "30days", name: t("articles.dateRange.days30"), color: "#17a2b8" },
        { id: "90days", name: t("articles.dateRange.days90"), color: "#17a2b8" },
    ];

    // 处理CustomSelect选择
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters((prev) => ({
                ...prev,
                [field]: selectedOption?.id || "",
            }));
            setCurrentPage(1); // 任何筛选条件变化都重置页码
        };
    };

    // 处理筛选条件变化（用于搜索框）
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
        setCurrentPage(1); // 搜索条件变化重置页码
    };

    // 清除筛选条件
    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            category: "",
            authorRole: "",
            dateRange: "",
        });
    };

    // 审批文章 - 通过
    const approveArticle = async (article: Article) => {
        await confirm({
            title: t("articles.approve.title"),
            content: (
                <div>
                    <p>
                        {t("articles.approve.contentPrefix")}
                        <strong>{article.title}</strong>
                        {t("articles.approve.contentSuffix")}
                    </p>
                    <p>{t("articles.approve.note")}</p>
                </div>
            ),
            confirmText: t("articles.approve.confirm"),
            cancelText: t("articles.common.cancel"),
            onConfirm: async () => {
                try {
                    await ArticleService.verifyArticle({
                        id: article.id,
                        state: REVERSE_STATE_MAP["published"],
                    });

                    message.success(
                        <span>
                            {t("articles.approve.successPrefix")}
                            <strong>{article.title}</strong>
                            {t("articles.approve.successSuffix")}
                        </span>,
                    );

                    setArticles((prev) =>
                        prev.map((a) =>
                            a.id === article.id
                                ? {
                                      ...a,
                                      status: "published",
                                      reviewedAt: new Date().toISOString().split("T")[0],
                                      reviewedBy: t("articles.common.currentAdmin"),
                                      updatedAt: new Date().toISOString().split("T")[0],
                                  }
                                : a,
                        ),
                    );
                    fetchStats();
                } catch (error) {
                    console.error("审核失败:", error);
                    message.error(t("articles.common.actionFailed"));
                }
            },
        });
    };

    // 审批文章 - 拒绝
    const rejectArticle = async (article: Article, reason: string) => {
        await confirm({
            title: t("articles.reject.title"),
            content: (
                <div>
                    <p>
                        {t("articles.reject.contentPrefix")}
                        <strong>{article.title}</strong>
                        {t("articles.reject.contentSuffix")}
                    </p>
                    <p>
                        {t("articles.reject.reasonPrefix")}
                        <strong>{reason}</strong>
                    </p>
                    <p style={{ color: "var(--warning-color)" }}>{t("articles.reject.note")}</p>
                </div>
            ),
            confirmText: t("articles.reject.confirm"),
            cancelText: t("articles.common.cancel"),
            onConfirm: async () => {
                try {
                    await ArticleService.verifyArticle({
                        id: article.id,
                        state: REVERSE_STATE_MAP["rejected"],
                    });

                    message.success(
                        <span>
                            {t("articles.reject.successPrefix")}
                            <strong>{article.title}</strong>
                            {t("articles.reject.successSuffix")}
                        </span>,
                    );

                    setArticles((prev) =>
                        prev.map((a) =>
                            a.id === article.id
                                ? {
                                      ...a,
                                      status: "rejected",
                                      rejectionReason: reason,
                                      reviewedAt: new Date().toISOString().split("T")[0],
                                      reviewedBy: t("articles.common.currentAdmin"),
                                      updatedAt: new Date().toISOString().split("T")[0],
                                  }
                                : a,
                        ),
                    );
                    fetchStats();
                } catch (error) {
                    console.error("拒绝失败:", error);
                    message.error(t("articles.common.actionFailed"));
                }
            },
        });
    };

    // 下架文章
    const unpublishArticle = async (article: Article) => {
        await confirm({
            title: t("articles.unpublish.title"),
            content: (
                <div>
                    <p>
                        {t("articles.unpublish.contentPrefix")}
                        <strong>{article.title}</strong>
                        {t("articles.unpublish.contentSuffix")}
                    </p>
                    <p style={{ color: "var(--warning-color)" }}>{t("articles.unpublish.note")}</p>
                </div>
            ),
            confirmText: t("articles.unpublish.confirm"),
            cancelText: t("articles.common.cancel"),
            onConfirm: async () => {
                try {
                    // 下架转为私密状态
                    await ArticleService.switchArticleState({
                        id: article.id,
                        state: REVERSE_STATE_MAP["rejected"],
                    });

                    message.success(
                        <span>
                            {t("articles.unpublish.successPrefix")}
                            <strong>{article.title}</strong>
                            {t("articles.unpublish.successSuffix")}
                        </span>,
                    );

                    setArticles((prev) =>
                        prev.map((a) =>
                            a.id === article.id
                                ? {
                                      ...a,
                                      status: "rejected",
                                      updatedAt: new Date().toISOString().split("T")[0],
                                  }
                                : a,
                        ),
                    );
                    fetchStats();
                } catch (error) {
                    console.error("下架失败:", error);
                    message.error(t("articles.common.actionFailed"));
                }
            },
        });
    };

    // 查看文章详情
    const handleViewArticle = (id: string) => {
        navigate(`/article/${encodeId(id, "article")}`);
    };

    // 编辑文章
    const handleEditArticle = (id: string) => {
        navigate(`/article/edit/${encodeId(id, "article")}`);
    };

    // 删除文章
    const deleteArticle = async (articleId: string, articleTitle: string) => {
        await confirm({
            title: t("articles.delete.title"),
            content: (
                <div>
                    <p>
                        {t("articles.delete.contentPrefix")}
                        <strong>{articleTitle}</strong>
                        {t("articles.delete.contentSuffix")}
                    </p>
                    <p style={{ color: "var(--error)" }}>{t("articles.delete.note")}</p>
                </div>
            ),
            confirmText: t("articles.delete.confirm"),
            cancelText: t("articles.common.cancel"),
            onConfirm: async () => {
                try {
                    await ArticleService.deleteArticle({ ids: articleId });
                    setArticles((prev) => prev.filter((article) => article.id !== articleId));
                    setTotalArticles((prev) => Math.max(0, prev - 1));
                    fetchStats();

                    if (articles.length === 1 && currentPage > 1) {
                        setCurrentPage((prev) => prev - 1);
                    }
                } catch (error) {
                    console.error("删除失败:", error);
                    message.error(t("articles.delete.failed"));
                }
            },
        });
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        if (!dateString) {
            return "-";
        }
        const date = new Date(dateString);
        return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
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
            <div className={styles.articleManagement}>
                <Loading text={t("articles.loading")} size="large" />
            </div>
        );
    }

    return (
        <div className={styles.articleManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("articles.title")}</h1>
                    <p className={styles.pageDescription}>{t("articles.description")}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        <FaPlus />
                        {t("articles.addArticle")}
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaFileAlt />
                    </div>
                    <div className={styles.statValue}>{stats.totalArticles}</div>
                    <div className={styles.statLabel}>{t("articles.stats.total")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaHourglassHalf />
                    </div>
                    <div className={styles.statValue}>{stats.pendingArticles}</div>
                    <div className={styles.statLabel}>{t("articles.stats.pending")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaEye />
                    </div>
                    <div className={styles.statValue}>{stats.publishedArticles}</div>
                    <div className={styles.statLabel}>{t("articles.stats.published")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTimes />
                    </div>
                    <div className={styles.statValue}>{stats.rejectedArticles}</div>
                    <div className={styles.statLabel}>{t("articles.stats.rejected")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.reported}`}>
                        <FaFlag />
                    </div>
                    <div className={styles.statValue}>{stats.reportedArticles}</div>
                    <div className={styles.statLabel}>{t("articles.stats.reported")}</div>
                </div>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        {t("articles.filter.title")}
                    </h3>
                    <div className={styles.filterActions}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                            {t("articles.filter.clear")}
                        </button>
                    </div>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("articles.filter.searchLabel")}</label>
                        <Input
                            placeholder={t("articles.filter.searchPlaceholder")}
                            value={filters.search}
                            onChange={(value) => handleFilterChange("search", value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("articles.filter.statusLabel")}</label>
                        <CustomSelect
                            name={t("articles.filter.statusLabel")}
                            options={statusOptions}
                            value={statusOptions.find((option) => option.id === filters.status) || null}
                            onChange={handleSelectChange("status")}
                            placeholder={t("articles.filter.statusPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("articles.filter.categoryLabel")}</label>
                        <CustomSelect
                            name={t("articles.filter.categoryLabel")}
                            options={categoryOptions}
                            value={categoryOptions.find((option) => option.id === filters.category) || null}
                            onChange={handleSelectChange("category")}
                            placeholder={t("articles.filter.categoryPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("articles.filter.authorRoleLabel")}</label>
                        <CustomSelect
                            name={t("articles.filter.authorRoleLabel")}
                            options={authorRoleOptions}
                            value={authorRoleOptions.find((option) => option.id === filters.authorRole) || null}
                            onChange={handleSelectChange("authorRole")}
                            placeholder={t("articles.filter.authorRolePlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("articles.filter.dateRangeLabel")}</label>
                        <CustomSelect
                            name={t("articles.filter.dateRangeLabel")}
                            options={dateRangeOptions}
                            value={dateRangeOptions.find((option) => option.id === filters.dateRange) || null}
                            onChange={handleSelectChange("dateRange")}
                            placeholder={t("articles.filter.dateRangePlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 文章表格 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>{t("articles.table.title")}</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                            {t("articles.table.total", { total: totalArticles })}
                        </span>
                    </div>
                </div>
                <table className={styles.articlesTable}>
                    <thead>
                        <tr>
                            <th>{t("articles.table.headers.info")}</th>
                            <th>{t("articles.table.headers.author")}</th>
                            <th>{t("articles.table.headers.category")}</th>
                            <th>{t("articles.table.headers.status")}</th>
                            <th>{t("articles.table.headers.stats")}</th>
                            <th>{t("articles.table.headers.publishedAt")}</th>
                            <th>{t("articles.table.headers.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                                    <Loading size="small" />
                                </td>
                            </tr>
                        ) : currentArticles.length > 0 ? (
                            currentArticles.map((article) => (
                                <tr key={article.id} className={`${article.featured ? styles.featured : ""}`}>
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
                                                <FaFileAlt />
                                            </div>
                                            <div className={styles.userDetails}>
                                                <div className={styles.userName}>{article.title}</div>
                                                <div className={styles.userEmail}>
                                                    {article.featured && (
                                                        <span className={styles.featuredTag}>
                                                            <FaStar /> {t("articles.table.featured")}
                                                        </span>
                                                    )}
                                                    {article.summary && (
                                                        <span
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "var(--text-secondary)",
                                                                lineHeight: "1.4",
                                                            }}
                                                        >
                                                            {article.summary.replace(/�/g, "")}
                                                        </span>
                                                    )}
                                                    {article.isReported && (
                                                        <span className={styles.reportedTag} style={{ marginLeft: "8px" }}>
                                                            <FaFlag /> {t("articles.table.reported", { value: article.reportCount })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.authorInfo}>
                                            <div className={styles.authorName}>
                                                <FaUser /> {article.author}
                                                <span className={styles.authorRole}>({article.authorRole})</span>
                                            </div>
                                            <div className={styles.authorEmail}>{article.authorEmail}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.categoryTag}>
                                            <FaTags /> {article.category}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[article.status]}`}>
                                            <span className={styles.statusIndicator}></span>
                                            {article.status === "pending" && (
                                                <>
                                                    <FaHourglassHalf /> {t("articles.status.pending")}
                                                </>
                                            )}
                                            {article.status === "published" && (
                                                <>
                                                    <FaEye /> {t("articles.status.published")}
                                                </>
                                            )}
                                            {article.status === "rejected" && (
                                                <>
                                                    <FaTimes /> {t("articles.status.rejected")}
                                                </>
                                            )}
                                            {article.status === "private" && (
                                                <>
                                                    <FaClipboardCheck /> {t("articles.status.private")}
                                                </>
                                            )}
                                        </span>
                                        {(article.status === "pending" ||
                                            article.status === "rejected" ||
                                            article.status === "published") && (
                                            <div className={styles.reviewInfo}>
                                                {article.reviewedBy && (
                                                    <div className={styles.reviewedBy}>
                                                        {t("articles.table.reviewedBy", { name: article.reviewedBy })}
                                                    </div>
                                                )}
                                                {article.reviewedAt && <div className={styles.reviewedAt}>{article.reviewedAt}</div>}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.statsInfo}>
                                            <div>
                                                <FaEye /> {article.views.toLocaleString()}
                                            </div>
                                            <div>
                                                <FaHeart /> {article.likes}
                                            </div>
                                            <div>
                                                <FaComment /> {article.comments}
                                            </div>
                                            <div>
                                                <FaClock /> {t("articles.table.readTime", { value: article.readTime })}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.dateInfo}>
                                            <div>
                                                {article.publishedAt ? (
                                                    <>
                                                        <FaCalendar /> {article.publishedAt}
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaClock /> {formatDate(article.createdAt)}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            {/* 管理员审批操作 */}
                                            {article.status === "pending" && (
                                                <>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.approve}`}
                                                        title={t("articles.action.approve")}
                                                        onClick={() => approveArticle(article)}
                                                    >
                                                        <FaThumbsUp />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.reject}`}
                                                        title={t("articles.action.reject")}
                                                        onClick={() => rejectArticle(article, t("articles.action.rejectReason"))}
                                                    >
                                                        <FaThumbsDown />
                                                    </button>
                                                </>
                                            )}

                                            {/* 已发布文章可以下架 */}
                                            {article.status === "published" && (
                                                <button
                                                    className={`${styles.actionButton} ${styles.unpublish}`}
                                                    title={t("articles.action.unpublish")}
                                                    onClick={() => unpublishArticle(article)}
                                                >
                                                    <FaBan />
                                                </button>
                                            )}

                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={t("articles.action.edit")}
                                                onClick={() => handleEditArticle(article.id)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={t("articles.action.view")}
                                                onClick={() => handleViewArticle(article.id)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.delete}`}
                                                title={t("articles.action.delete")}
                                                onClick={() => deleteArticle(article.id, article.title)}
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
                                    colSpan={7}
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {t("articles.table.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* 分页 */}
                {totalPages >= 1 && (
                    <div className={styles.paginationContainer}>
                        <div className={styles.paginationInfo}>
                            {t("articles.pagination.info", {
                                start: totalArticles > 0 ? startIndex + 1 : 0,
                                end: Math.min(endIndex, totalArticles),
                                total: totalArticles,
                            })}
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
        </div>
    );
};

export default ArticleManagement;

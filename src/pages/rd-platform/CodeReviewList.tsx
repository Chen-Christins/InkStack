import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { encodeId, decodeId } from "@/utils/HashId.ts";
import { formatDateTime, formatRelativeTime } from "@/utils/Utils.ts";
import {
    FaSync,
    FaEye,
    FaTrash,
    FaFilter,
    FaGithub,
    FaExternalLinkAlt,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ListPage.module.css";
import crStyles from "./CodeReviewList.module.css";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import message from "@/components/message/Message";
import { confirm } from "@/components/confirm/Confirm";
import { useRdOrg } from "@/contexts/RdOrgContext";
import OrganizationService from "@/services/OrganizationService.ts";
import type { SelectOption } from "../../types";

// ---- PR 数据映射 ----
interface PR {
    id: string;
    repoId: string;
    title: string;
    description: string;
    state: "open" | "closed" | "merged";
    priority: string;
    author: string;
    headBranch: string;
    baseBranch: string;
    commitSha: string;
    githubPrId: number | null;
    changedFiles: number | null;
    additions: number | null;
    deletions: number | null;
    reviewers: string;
    reviewStatus: string;
    createdAt: string;
    updatedAt: string;
}

interface RepoItem {
    id: string;
    name: string;
    url: string;
    prSyncStatus: string;
}

const PAGE_SIZE = 10;

// ---- component ----
const CodeReviewList: React.FC = () => {
    const { t } = useTranslation("rd");
    const { selectedOrgId } = useRdOrg();
    const stateOptions: SelectOption[] = [
        { id: "", name: t("reviews.state.all"), color: "#6c757d" },
        { id: "open", name: t("reviews.state.open"), color: "#22c55e" },
        { id: "closed", name: t("reviews.state.closed"), color: "#6b7280" },
        { id: "merged", name: t("reviews.state.merged"), color: "#a855f7" },
    ];
    const stateText: Record<string, string> = {
        open: t("reviews.state.open"),
        closed: t("reviews.state.closed"),
        merged: t("reviews.state.merged"),
    };
    const reviewStatusText: Record<string, string> = {
        pending: t("reviews.review.pending"),
        reviewing: t("reviews.review.reviewing"),
        approved: t("reviews.review.approved"),
        rejected: t("reviews.review.rejected"),
        changes_requested: t("reviews.review.changesRequested"),
    };
    const priorityText: Record<string, string> = {
        critical: t("reviews.priority.critical"),
        high: t("reviews.priority.high"),
        medium: t("reviews.priority.medium"),
        low: t("reviews.priority.low"),
    };
    const repoStatusText: Record<string, string> = {
        success: t("reviews.repo.synced"),
        failed: t("reviews.repo.failed"),
        syncing: t("reviews.repo.syncing"),
        idle: t("reviews.repo.idle"),
    };
    const [prs, setPrs] = useState<PR[]>([]);
    const [total, setTotal] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", state: "" });

    // 仓库列表
    const [repos, setRepos] = useState<RepoItem[]>([]);
    const [syncingRepos, setSyncingRepos] = useState<Set<string>>(new Set());

    // 正在同步的单条 PR
    const [syncingPrs, setSyncingPrs] = useState<Set<string>>(new Set());

    // 当前选中的仓库（与 URL search param 同步，ID 经 hashid 编码）
    const [searchParams, setSearchParams] = useSearchParams();
    const repoHash = searchParams.get("repo");
    const selectedRepoId = repoHash ? String(decodeId(repoHash, "repo") ?? "") : null;
    const selectedRepoIdRef = useRef<string | null>(selectedRepoId);
    const prRequestIdRef = useRef(0);
    const prevRepoIdRef = useRef<string | null>(selectedRepoId);

    useEffect(() => {
        selectedRepoIdRef.current = selectedRepoId;
    }, [selectedRepoId]);

    const setSelectedRepoId = useCallback(
        (repoId: string | null) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (repoId) {
                        next.set("repo", encodeId(repoId, "repo"));
                    } else {
                        next.delete("repo");
                    }
                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    // view modal
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PR | null>(null);

    // ---- 获取仓库列表 ----
    const fetchRepos = async () => {
        if (!selectedOrgId) {
            return [];
        }
        try {
            const res = await OrganizationService.getRepos({ org_id: selectedOrgId });
            return (res.list || []).map((r: any) => ({
                id: String(r.id),
                name: r.name || "",
                url: r.url || "",
                prSyncStatus: r.pr_sync_status || "idle",
            }));
        } catch {
            return [];
        }
    };

    // ---- 获取 PR 列表 ----
    const fetchPrs = async (repoId = selectedRepoId) => {
        if (!repoId) {
            prRequestIdRef.current += 1;
            setPrs([]);
            setTotal(0);
            return;
        }

        const requestId = ++prRequestIdRef.current;
        const params: any = { page: currentPage, page_size: PAGE_SIZE };
        if (selectedOrgId) {
            params.org_id = selectedOrgId;
        }
        params.repo_id = repoId;
        if (filters.state) {
            params.state = filters.state;
        }
        const res = await OrganizationService.getPrs(params);
        if (requestId !== prRequestIdRef.current) {
            return;
        }
        setPrs(
            (res.list || []).map((item: any) => ({
                id: String(item.id),
                repoId: String(item.repo_id),
                title: item.title || "",
                description: item.description || "",
                state: item.state || "open",
                priority: item.priority || "",
                author: item.author || "",
                headBranch: item.head_branch || "",
                baseBranch: item.base_branch || "",
                commitSha: item.commit_sha || "",
                githubPrId: item.github_pr_id ?? null,
                changedFiles: item.changed_files,
                additions: item.additions,
                deletions: item.deletions,
                reviewers: item.reviewers || "[]",
                reviewStatus: item.review_status || "pending",
                createdAt: item.created_at ?? "",
                updatedAt: item.updated_at ?? "",
            })),
        );
        setTotal(res.total ?? 0);
    };

    // ---- 组织变化时加载仓库列表（避免切换仓库时重复拉取仓库） ----
    useEffect(() => {
        let cancelled = false;
        const loadRepos = async () => {
            if (!selectedOrgId) {
                setRepos([]);
                setPrs([]);
                setTotal(0);
                setInitialLoading(false);
                return;
            }
            const repoList = await fetchRepos();
            if (cancelled) {
                return;
            }
            setRepos(repoList);
            if (repoList.length === 0) {
                setPrs([]);
                setTotal(0);
                setInitialLoading(false);
                return;
            }
            const currentRepoId = selectedRepoIdRef.current;
            const hasSelected = currentRepoId != null && repoList.some((repo) => repo.id === currentRepoId);
            if (!hasSelected) {
                setSelectedRepoId(repoList[0].id);
                setCurrentPage(1);
            }
        };
        loadRepos();
        return () => {
            cancelled = true;
        };
    }, [selectedOrgId]);

    // ---- 加载 PR 列表（切换仓库 / 翻页 / 筛选时立即触发） ----
    useEffect(() => {
        if (!selectedOrgId || !selectedRepoId) {
            prevRepoIdRef.current = selectedRepoId;
            setPrs([]);
            setTotal(0);
            if (!selectedOrgId) {
                setInitialLoading(false);
            }
            return;
        }
        // 切换仓库时重置到第 1 页，避免带着上一个仓库的页码请求
        if (prevRepoIdRef.current !== selectedRepoId) {
            prevRepoIdRef.current = selectedRepoId;
            if (currentPage !== 1) {
                setTableLoading(true);
                setCurrentPage(1);
                return;
            }
        }
        let cancelled = false;
        setTableLoading(true);
        (async () => {
            try {
                await fetchPrs(selectedRepoId);
            } catch {
                if (!cancelled) {
                    message.error(t("reviews.message.fetchFailed"));
                }
            } finally {
                if (!cancelled) {
                    setTableLoading(false);
                    setInitialLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedRepoId, currentPage, filters, selectedOrgId]);

    const handleFilterChange = (field: string, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    // ---- 轮询 PR 同步状态 ----
    useEffect(() => {
        const hasSyncing = repos.some((r) => r.prSyncStatus === "syncing");
        if (!hasSyncing || !selectedOrgId) {
            return;
        }
        const timer = setInterval(async () => {
            const repoList = await fetchRepos();
            const stillSyncing = repoList.some((r) => r.prSyncStatus === "syncing");
            setRepos(repoList);
            fetchPrs();
            if (!stillSyncing) {
                clearInterval(timer);
            }
        }, 3000);
        return () => clearInterval(timer);
    }, [selectedOrgId, repos]);

    // ---- 同步单个仓库 PR ----
    const handleSyncRepo = async (repo: RepoItem) => {
        setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, prSyncStatus: "syncing" } : r)));
        setSyncingRepos((prev) => new Set(prev).add(repo.id));
        try {
            await OrganizationService.syncPrs({ repo_id: repo.id });
        } catch (err: any) {
            setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, prSyncStatus: "failed" } : r)));
            message.error(t("reviews.message.syncRepoFailed", { name: repo.name }));
        } finally {
            setSyncingRepos((prev) => {
                const next = new Set(prev);
                next.delete(repo.id);
                return next;
            });
        }
    };

    // ---- 同步单条 PR ----
    const handleSyncPr = async (pr: PR) => {
        if (syncingPrs.has(pr.id)) {
            return;
        }
        setSyncingPrs((prev) => new Set(prev).add(pr.id));
        try {
            await OrganizationService.syncPr({ id: pr.id });
            message.success(t("reviews.message.syncPrSuccess"));
            fetchPrs();
        } catch (err: any) {
            message.error(err?.message || t("reviews.message.syncFailed"));
        } finally {
            setSyncingPrs((prev) => {
                const next = new Set(prev);
                next.delete(pr.id);
                return next;
            });
        }
    };

    // ---- 删除 PR ----
    const handleDeletePr = async (pr: PR) => {
        await confirm({
            title: t("reviews.confirm.deleteTitle"),
            content: (
                <div>
                    {t("reviews.confirm.deleteContentPrefix")}
                    <strong>{pr.title}</strong>
                    {t("reviews.confirm.deleteContentSuffix")}
                </div>
            ),
            confirmText: t("reviews.confirm.delete"),
            cancelText: t("reviews.confirm.cancel"),
            onConfirm: async () => {
                try {
                    await OrganizationService.deletePr({ id: pr.id });
                    message.success(t("reviews.message.deleteSuccess"));
                    fetchPrs();
                } catch (err: any) {
                    message.error(err?.message || t("reviews.message.deleteFailed"));
                }
            },
        });
    };

    const getPrUrl = (pr: PR): string | null => {
        if (!pr.githubPrId) {
            return null;
        }
        const repo = repos.find((r) => r.id === pr.repoId);
        if (!repo?.url) {
            return null;
        }
        return `${repo.url.replace(/\.git$/, "")}/pull/${pr.githubPrId}`;
    };

    const getRepoName = (repoId: string) => repos.find((repo) => repo.id === repoId)?.name || "-";

    const formatCommit = (commitSha: string) => (commitSha ? commitSha.slice(0, 8) : "-");

    const formatReviewers = (reviewers: string) => {
        if (!reviewers) {
            return "-";
        }
        try {
            const parsed = JSON.parse(reviewers);
            if (Array.isArray(parsed)) {
                return (
                    parsed
                        .map((item) => (typeof item === "string" ? item : item?.name || item?.login || item?.username || ""))
                        .filter(Boolean)
                        .join(t("reviews.reviewersSeparator")) || "-"
                );
            }
        } catch {
            return reviewers;
        }
        return reviewers;
    };

    const getDescriptionSummary = (description: string) => {
        const text = description
            .replace(/[#>*_`[\]()\-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!text) {
            return "-";
        }
        return text.length > 80 ? `${text.slice(0, 80)}...` : text;
    };

    const openView = (pr: PR) => {
        setSelectedPR(pr);
        setViewModalVisible(true);
    };
    const closeView = () => {
        setViewModalVisible(false);
        setSelectedPR(null);
    };

    const renderField = (label: string, value: React.ReactNode) => (
        <div className={crStyles.detailField}>
            <span className={crStyles.detailFieldLabel}>{label}</span>
            <span className={crStyles.detailFieldValue}>{value || "-"}</span>
        </div>
    );

    const renderChangeStats = (pr: PR) =>
        pr.changedFiles != null ? (
            <span className={crStyles.changeFiles}>
                {t("reviews.detail.files", { value: pr.changedFiles })}
                {pr.additions != null && pr.additions > 0 && <span className={crStyles.changeAdditions}>+{pr.additions}</span>}
                {pr.deletions != null && pr.deletions > 0 && <span className={crStyles.changeDeletions}>-{pr.deletions}</span>}
            </span>
        ) : (
            <span className={crStyles.changeNone}>-</span>
        );

    const renderPrActions = (pr: PR) => (
        <>
            <button className={`${styles.actionBtn} ${styles.view}`} title={t("reviews.action.view")} onClick={() => openView(pr)}>
                <FaEye />
            </button>
            <button
                className={`${styles.actionBtn} ${styles.sync}`}
                title={t("reviews.action.syncPr")}
                disabled={syncingPrs.has(pr.id)}
                onClick={(e) => {
                    e.stopPropagation();
                    handleSyncPr(pr);
                }}
            >
                <FaSync className={syncingPrs.has(pr.id) ? styles.repoSpin : ""} />
            </button>
            {getPrUrl(pr) && (
                <button
                    className={`${styles.actionBtn} ${styles.ghBtn}`}
                    title={t("reviews.action.viewOnGithub")}
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(getPrUrl(pr)!, "_blank", "noopener,noreferrer");
                    }}
                >
                    <FaGithub />
                </button>
            )}
            <button
                className={`${styles.actionBtn} ${styles.delete}`}
                title={t("reviews.action.delete")}
                onClick={() => handleDeletePr(pr)}
            >
                <FaTrash />
            </button>
        </>
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

    if (initialLoading) {
        return <Loading />;
    }

    return (
        <div className={styles.listPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("reviews.page.title")}</h1>
                    <p className={styles.pageDescription}>{t("reviews.page.description")}</p>
                </div>
            </div>

            {/* 仓库列表 + 同步按钮 */}
            {repos.length > 0 && (
                <div className={styles.repoBar}>
                    <div className={styles.repoBarList}>
                        {repos.map((repo) => (
                            <div
                                key={repo.id}
                                className={`${styles.repoBarItem} ${styles.repoBarClickable} ${selectedRepoId === repo.id ? styles.repoBarActive : ""}`}
                                onClick={() => {
                                    if (repo.id !== selectedRepoId) {
                                        setSelectedRepoId(repo.id);
                                        setCurrentPage(1);
                                    }
                                }}
                            >
                                <FaGithub size={14} className={crStyles.iconNoShrink} />
                                <span className={styles.repoBarName}>{repo.name}</span>
                                <span
                                    className={`${styles.repoBarStatus} ${
                                        repo.prSyncStatus === "success"
                                            ? styles.repoBarSuccess
                                            : repo.prSyncStatus === "failed"
                                              ? styles.repoBarFailed
                                              : repo.prSyncStatus === "syncing"
                                                ? styles.repoBarSyncing
                                                : ""
                                    }`}
                                >
                                    {repoStatusText[repo.prSyncStatus] || repoStatusText.idle}
                                </span>
                                <button
                                    className={styles.repoBarSyncBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSyncRepo(repo);
                                    }}
                                    disabled={syncingRepos.has(repo.id)}
                                >
                                    <FaSync className={syncingRepos.has(repo.id) ? styles.repoSpin : ""} size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter /> {t("reviews.filters.title")}
                    </h3>
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setFilters({ search: "", state: "" });
                            setCurrentPage(1);
                        }}
                    >
                        {t("reviews.filters.clear")}
                    </button>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("reviews.filters.searchLabel")}</label>
                        <Input
                            placeholder={t("reviews.filters.searchPlaceholder")}
                            value={filters.search}
                            onChange={(val) => handleFilterChange("search", val)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("reviews.filters.stateLabel")}</label>
                        <CustomSelect
                            name={t("reviews.filters.stateLabel")}
                            options={stateOptions}
                            value={stateOptions.find((o) => o.id === filters.state) || null}
                            onChange={(o) => handleFilterChange("state", (o?.id as string) || "")}
                            hideBadge
                        />
                    </div>
                </div>
            </div>

            <div className={`${styles.tableWrapper} ${crStyles.desktopPrTable}`}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t("reviews.table.title")}</th>
                            <th>{t("reviews.table.state")}</th>
                            <th>{t("reviews.table.author")}</th>
                            <th>{t("reviews.table.branch")}</th>
                            <th>{t("reviews.table.change")}</th>
                            <th>{t("reviews.table.createdAt")}</th>
                            <th>{t("reviews.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableLoading ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    <Loading size="small" text={t("reviews.loading")} />
                                </td>
                            </tr>
                        ) : prs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    <div className={styles.emptyCellIcon}>
                                        <FaGithub />
                                    </div>
                                    <div className={styles.emptyCellText}>
                                        {selectedRepoId ? t("reviews.empty.noPr") : t("reviews.empty.selectRepo")}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            prs.map((pr) => {
                                return (
                                    <tr key={pr.id}>
                                        <td
                                            className={styles.titleCell}
                                            data-label={t("reviews.table.title")}
                                            onClick={() => openView(pr)}
                                        >
                                            {pr.title}
                                        </td>
                                        <td data-label={t("reviews.table.state")}>
                                            <span
                                                className={`${styles.badge} ${pr.state === "closed" ? styles.pr_closed : styles[`status_${pr.state}`]}`}
                                            >
                                                {stateText[pr.state]}
                                            </span>
                                        </td>
                                        <td className={crStyles.cellCenter} data-label={t("reviews.table.author")}>
                                            {pr.author}
                                        </td>
                                        <td className={crStyles.branchCell} data-label={t("reviews.table.branch")}>
                                            <span className={crStyles.branchRoute}>
                                                <span className={crStyles.branchHead}>{pr.headBranch}</span>
                                                <span className={crStyles.branchArrow}>→</span>
                                                <span className={crStyles.branchBase}>{pr.baseBranch}</span>
                                            </span>
                                        </td>
                                        <td className={crStyles.changeCell} data-label={t("reviews.table.change")}>
                                            {renderChangeStats(pr)}
                                        </td>
                                        <td data-label={t("reviews.table.createdAt")}>{formatRelativeTime(pr.createdAt)}</td>
                                        <td data-label={t("reviews.table.actions")}>
                                            <div className={styles.actionButtons}>{renderPrActions(pr)}</div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className={crStyles.mobilePrList}>
                {tableLoading ? (
                    <div className={crStyles.mobileEmpty}>
                        <Loading size="small" text={t("reviews.loading")} />
                    </div>
                ) : prs.length === 0 ? (
                    <div className={crStyles.mobileEmpty}>
                        <div className={styles.emptyCellIcon}>
                            <FaGithub />
                        </div>
                        <div className={styles.emptyCellText}>
                            {selectedRepoId ? t("reviews.empty.noPr") : t("reviews.empty.selectRepo")}
                        </div>
                    </div>
                ) : (
                    prs.map((pr) => (
                        <article key={pr.id} className={crStyles.mobilePrCard}>
                            <button className={crStyles.mobileCardMain} type="button" onClick={() => openView(pr)}>
                                <div className={crStyles.mobileCardHeader}>
                                    <div className={crStyles.mobileTitleBlock}>
                                        <div className={crStyles.mobileTitle}>{pr.title || "-"}</div>
                                        <div className={crStyles.mobileSubtitle}>
                                            <span>{getRepoName(pr.repoId)}</span>
                                            <span>{pr.githubPrId ? `#${pr.githubPrId}` : t("reviews.action.noPrId")}</span>
                                        </div>
                                    </div>
                                    <span
                                        className={`${styles.badge} ${pr.state === "closed" ? styles.pr_closed : styles[`status_${pr.state}`]}`}
                                    >
                                        {stateText[pr.state]}
                                    </span>
                                </div>

                                <div className={crStyles.mobileMetaGrid}>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.author")}</span>
                                        <span className={crStyles.mobileMetaValue}>{pr.author || "-"}</span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.reviewStatus")}</span>
                                        <span className={crStyles.mobileMetaValue}>
                                            {reviewStatusText[pr.reviewStatus] || pr.reviewStatus || "-"}
                                        </span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.priority")}</span>
                                        <span className={crStyles.mobileMetaValue}>
                                            {priorityText[pr.priority] || pr.priority || "-"}
                                        </span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.change")}</span>
                                        <span className={crStyles.mobileMetaValue}>{renderChangeStats(pr)}</span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.reviewers")}</span>
                                        <span className={crStyles.mobileMetaValue}>{formatReviewers(pr.reviewers)}</span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.commit")}</span>
                                        <span className={crStyles.mobileMetaValue}>{formatCommit(pr.commitSha)}</span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.createdAt")}</span>
                                        <span className={crStyles.mobileMetaValue}>{formatRelativeTime(pr.createdAt)}</span>
                                    </div>
                                    <div className={crStyles.mobileMetaItem}>
                                        <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.syncedAt")}</span>
                                        <span className={crStyles.mobileMetaValue}>{formatRelativeTime(pr.updatedAt)}</span>
                                    </div>
                                </div>

                                <div className={crStyles.mobileBranchBlock}>
                                    <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.branch")}</span>
                                    <span className={crStyles.branchRoute}>
                                        <span className={crStyles.branchHead}>{pr.headBranch || "-"}</span>
                                        <span className={crStyles.branchArrow}>→</span>
                                        <span className={crStyles.branchBase}>{pr.baseBranch || "-"}</span>
                                    </span>
                                </div>

                                <div className={crStyles.mobileDescription}>
                                    <span className={crStyles.mobileMetaLabel}>{t("reviews.mobile.description")}</span>
                                    <span>{getDescriptionSummary(pr.description)}</span>
                                </div>
                            </button>

                            <div className={crStyles.mobileActions}>{renderPrActions(pr)}</div>
                        </article>
                    ))
                )}
            </div>

            {total > 0 && (
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>{t("reviews.pagination.total", { total })}</span>
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
            )}

            {/* ============ VIEW MODAL ============ */}
            <Modal
                visible={viewModalVisible}
                title={selectedPR?.title || t("reviews.detail.prDetail")}
                onClose={closeView}
                width={800}
                footer={null}
            >
                {selectedPR && (
                    <div data-allow-copy="true">
                        <div className={crStyles.detailBadges}>
                            <span
                                className={`${styles.badge} ${selectedPR.state === "closed" ? styles.pr_closed : styles[`status_${selectedPR.state}`]}`}
                            >
                                {stateText[selectedPR.state]}
                            </span>
                            {selectedPR.priority && (
                                <span className={`${styles.badge} ${styles[`priority_${selectedPR.priority}`]}`}>
                                    {priorityText[selectedPR.priority] || selectedPR.priority}
                                </span>
                            )}
                            {getPrUrl(selectedPR) && (
                                <a
                                    className={crStyles.githubLink}
                                    href={getPrUrl(selectedPR)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={t("reviews.action.viewPrOnGithub")}
                                >
                                    <FaGithub size={14} />
                                    <span>{t("reviews.action.goToGithub")}</span>
                                    <FaExternalLinkAlt size={10} />
                                </a>
                            )}
                            <button
                                className={crStyles.syncLink}
                                type="button"
                                title={t("reviews.action.syncPr")}
                                disabled={syncingPrs.has(selectedPR.id)}
                                onClick={() => handleSyncPr(selectedPR)}
                            >
                                <FaSync className={syncingPrs.has(selectedPR.id) ? styles.repoSpin : ""} size={12} />
                                <span>{t("reviews.action.syncPr")}</span>
                            </button>
                        </div>
                        <div className={crStyles.detailGrid}>
                            {renderField(t("reviews.detail.repo"), getRepoName(selectedPR.repoId))}
                            {renderField(t("reviews.detail.prNumber"), selectedPR.githubPrId ? `#${selectedPR.githubPrId}` : "-")}
                            {renderField(t("reviews.detail.author"), selectedPR.author)}
                            {renderField(t("reviews.detail.reviewers"), formatReviewers(selectedPR.reviewers))}
                            {renderField(
                                t("reviews.detail.reviewStatus"),
                                reviewStatusText[selectedPR.reviewStatus] || selectedPR.reviewStatus,
                            )}
                            {renderField(t("reviews.detail.sourceBranch"), selectedPR.headBranch)}
                            {renderField(t("reviews.detail.targetBranch"), selectedPR.baseBranch)}
                            {renderField(t("reviews.detail.commit"), selectedPR.commitSha)}
                            {renderField(
                                t("reviews.detail.changeStats"),
                                selectedPR.changedFiles != null ? (
                                    <span>
                                        {t("reviews.detail.files", { value: selectedPR.changedFiles })}
                                        {selectedPR.additions != null && selectedPR.additions > 0 && (
                                            <span className={crStyles.changeAdditions}>+{selectedPR.additions}</span>
                                        )}
                                        {selectedPR.deletions != null && selectedPR.deletions > 0 && (
                                            <span className={crStyles.changeDeletions}>-{selectedPR.deletions}</span>
                                        )}
                                    </span>
                                ) : (
                                    "-"
                                ),
                            )}
                            {renderField(t("reviews.detail.createdAt"), formatDateTime(selectedPR.createdAt))}
                            {renderField(t("reviews.detail.syncedAt"), formatDateTime(selectedPR.updatedAt))}
                        </div>
                        <div>
                            <h4 className={crStyles.detailSectionTitle}>{t("reviews.detail.description")}</h4>
                            <div className={styles.markdownPreview}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedPR.description || t("reviews.detail.noDescription")}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CodeReviewList;

import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { encodeId } from "@/utils/HashId.ts";
import { FaUserMinus, FaUserSlash } from "react-icons/fa";
import FollowService from "@/services/FollowService.ts";
import type { FollowUser } from "@/types/Follow.ts";
import Avatar from "@/components/avatar/Avatar";
import styles from "../PersonalCenter.module.css";

const PAGE_SIZE = 20;

function formatDate(timestamp: number): string {
    if (!timestamp) {
        return "";
    }
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
    const pages: (number | string)[] = [];
    if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        const start = Math.max(1, current - 2);
        const end = Math.min(total, start + 4);
        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push("...");
            }
        }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < total) {
            if (end < total - 1) {
                pages.push("...");
            }
            pages.push(total);
        }
    }
    return pages;
}

const FollowingTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const navigate = useNavigate();
    const [list, setList] = useState<FollowUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [unfollowLoading, setUnfollowLoading] = useState<Set<number>>(new Set());

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * PAGE_SIZE;
            const data = await FollowService.getFollowingList({ offset, size: PAGE_SIZE });
            setList(data.list);
            setTotal(data.total);
        } catch {
            // 静默处理
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleUnfollow = async (user: FollowUser) => {
        setUnfollowLoading((prev) => new Set(prev).add(user.id));
        try {
            await FollowService.unfollow(user.id);
            setList((prev) => prev.filter((u) => u.id !== user.id));
            setTotal((t) => t - 1);
        } catch {
            // 静默处理
        } finally {
            setUnfollowLoading((prev) => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("following.title")}</h2>
                {total > 0 && <span className={styles.unreadBadge}>{t("following.peopleCount", { value: total })}</span>}
            </div>

            {loading ? (
                <div className={styles.notifEmpty}>
                    <span>{t("following.loading")}</span>
                </div>
            ) : list.length === 0 ? (
                <div className={styles.notifEmpty}>
                    <FaUserSlash className={styles.notifEmptyIcon} />
                    <span>{t("following.empty")}</span>
                </div>
            ) : (
                <div className={styles.followList}>
                    {list.map((user) => (
                        <div key={user.id} className={styles.followItem}>
                            <div
                                className={styles.followItemLeft}
                                onClick={() => navigate(`/profile/${encodeId(user.id, "user")}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <Avatar src={user.avatar} name={user.name} size={48} className={styles.followAvatar} />
                                <div className={styles.followItemInfo}>
                                    <div className={styles.followItemName}>{user.name}</div>
                                    {user.bio && <div className={styles.followItemBio}>{user.bio}</div>}
                                    <div className={styles.followItemTime}>
                                        {t("following.joinedAt", { account: user.account, date: formatDate(user.create_time) })}
                                    </div>
                                    <div className={styles.followItemStats}>
                                        <span>{t("following.followingCount", { value: user.following_count ?? 0 })}</span>
                                        <span>{t("following.followerCount", { value: user.follower_count ?? 0 })}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className={styles.unfollowButton}
                                onClick={() => handleUnfollow(user)}
                                disabled={unfollowLoading.has(user.id)}
                            >
                                <FaUserMinus size={12} />
                                {unfollowLoading.has(user.id) ? "..." : t("following.unfollow")}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        {t("following.paginationInfo", {
                            start: startIndex + 1,
                            end: Math.min(startIndex + PAGE_SIZE, total),
                            total,
                        })}
                    </div>
                    <div className={styles.paginationControls}>
                        <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            {t("following.firstPage")}
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            {t("following.prevPage")}
                        </button>
                        {getPageNumbers(currentPage, totalPages).map((page, i) => (
                            <button
                                key={i}
                                className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                                onClick={() => page !== "..." && setCurrentPage(page as number)}
                                disabled={page === "..."}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t("following.nextPage")}
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            {t("following.lastPage")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FollowingTab;

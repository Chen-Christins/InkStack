import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import { encodeId, decodeId } from "@/utils/HashId.ts";
import BackToTop from "@/components/backToTop/BackToTop";
import { useAuth } from "@/contexts/AuthContext";
import AuthService from "@/services/AuthService.ts";
import ArticleService from "@/services/ArticleService.ts";
import LabelService from "@/services/LabelService.ts";
import {
    MapPin,
    Mail,
    Link2,
    Users,
    Heart,
    MessageSquare,
    Eye,
    Clock,
    Hash,
    BookOpen,
    Star,
    UserPlus,
    UserCheck,
    Loader2,
    Edit,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import type { Article, UserProfile } from "@/types";
import type { UserStats } from "@/services/AuthService.ts";
import FollowService from "@/services/FollowService.ts";
import message from "@/components/message/Message";
import AchievementsTab from "@/pages/user/AchievementsTab";
import i18n from "@/i18n";

function formatDate(timestamp: number | string): string {
    if (!timestamp) {
        return "";
    }
    const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts) || ts === 0) {
        return "";
    }
    const date = new Date(ts * 1000);
    return i18n.t("profile:yearMonth", { year: date.getFullYear(), month: date.getMonth() + 1 });
}

function toGithubHref(value: string): string {
    return /^https?:\/\//i.test(value) ? value : `https://github.com/${value.replace(/^@/, "")}`;
}

function toGithubLabel(value: string): string {
    return value
        .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
        .replace(/^@/, "")
        .replace(/^https?:\/\//i, "");
}

function formatPublishTime(timestamp: number | string): string {
    if (!timestamp) {
        return "";
    }
    const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts) || ts === 0) {
        return "";
    }
    const date = new Date(ts * 1000);
    return date.toISOString().split("T")[0];
}

const TABS = [
    { key: "overview", labelKey: "tabs.overview" },
    { key: "articles", labelKey: "tabs.articles" },
    { key: "achievements", labelKey: "tabs.achievements" },
    { key: "tags", labelKey: "tabs.tags" },
] as const;

const PAGE_SIZE = 15;

type TabKey = (typeof TABS)[number]["key"];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation("profile");
    const { id: encodedId } = useParams<{ id: string }>();
    const id = encodedId ? decodeId(encodedId, "user") : null;
    const { user: currentUser, isAuthenticated } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [tags, setTags] = useState<{ name: string; count: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [articleTotal, setArticleTotal] = useState(0);
    const [articlePage, setArticlePage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const isOwnProfile = isAuthenticated && String(currentUser?.id) === String(id);
    const visibleTabs = isOwnProfile ? TABS : TABS.filter((tab) => tab.key !== "achievements");

    const [activeTab, setActiveTab] = useState<TabKey>(() => {
        const tab = searchParams.get("tab") as TabKey | null;
        if (tab && visibleTabs.some((tabItem) => tabItem.key === tab)) {
            return tab;
        }
        return "overview";
    });

    useEffect(() => {
        if (!isOwnProfile && activeTab === "achievements") {
            setActiveTab("overview");
            setSearchParams({ tab: "overview" }, { replace: true });
        }
    }, [isOwnProfile, activeTab, setSearchParams]);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchProfileData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userResponse, articlesResponse, labelsData, statsData] = await Promise.all([
                    AuthService.getUserInfo(id).catch(() => null),
                    ArticleService.listArticlesByUserIdPages({
                        user_id: id,
                        page_from: 1,
                        page_size: PAGE_SIZE,
                        state: 2,
                    }).catch(() => null),
                    LabelService.queryLabel({ user_id: id }).catch(() => []),
                    AuthService.getUserStats(id).catch(() => null),
                ]);

                const userData = userResponse?.data ?? (userResponse as any);
                const mappedProfile: UserProfile = {
                    id: Number(id),
                    name: userData?.name || t("unknownUser"),
                    avatar: userData?.avatar || `https://picsum.photos/id/${(Number(id) % 100) + 1}/150`,
                    bio: userData?.bio || userData?.signature || "",
                    account: userData?.account || "",
                    email: userData?.email || "",
                    role: userData?.role || "user",
                    location: userData?.location || "",
                    website: userData?.website || "",
                    github: userData?.github || "",
                    joinDate: formatDate(userData?.create_time),
                    stats: {
                        articles: articlesResponse?.total ?? 0,
                        followers: userData?.follower_count ?? 0,
                        following: userData?.following_count ?? 0,
                    },
                };
                setProfile(mappedProfile);
                setFollowersCount(mappedProfile.stats.followers);

                if (articlesResponse?.list) {
                    const mappedArticles: Article[] = articlesResponse.list.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        content: item.summary || "",
                        author: item.author || mappedProfile.name,
                        user_id: item.user_id || id,
                        type: item.type ?? 1,
                        state: item.state ?? 2,
                        is_deleted: false,
                        publish_time: formatPublishTime(item.publish_time),
                        update_time: formatPublishTime(item.update_time || item.publish_time),
                        views: item.views ?? 0,
                        praise: item.praise ?? 0,
                        favorites: item.favorites ?? 0,
                        comments: item.comment_count ?? 0,
                        labels: item.labels || [],
                        categorys: item.categories || item.categorys || [],
                    }));
                    setArticles(mappedArticles);
                    setArticleTotal(articlesResponse.total);
                }

                if (Array.isArray(labelsData) && labelsData.length > 0) {
                    const tagColors = ["#61DAFB", "#3178C6", "#339933", "#4FC08D", "#7B68EE", "#FF6B6B"];
                    const mappedTags = labelsData.slice(0, 12).map((label: any, i: number) => ({
                        name: label.name || t("tagFallback", { value: i + 1 }),
                        count: label.article_count ?? 0,
                        color: label.color || tagColors[i % tagColors.length],
                    }));
                    setTags(mappedTags);
                }

                if (statsData) {
                    setUserStats(statsData);
                }
            } catch (err: any) {
                setError(err.message || t("loadFailed"));
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id, t]);

    // 独立检查关注状态（等 auth 就绪后再查）
    useEffect(() => {
        if (!id || !isAuthenticated || isOwnProfile) {
            return;
        }
        FollowService.isFollowing(id)
            .then(setIsFollowing)
            .catch(() => {});
    }, [id, isAuthenticated, isOwnProfile]);

    const handleLoadMore = async () => {
        if (!id || loadingMore) {
            return;
        }
        const nextPage = articlePage + 1;
        setLoadingMore(true);
        try {
            const response = await ArticleService.listArticlesByUserIdPages({
                user_id: id,
                page_from: nextPage,
                page_size: PAGE_SIZE,
                state: 2,
            });
            if (response?.list) {
                const newArticles: Article[] = response.list.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    content: item.summary || "",
                    author: item.author || profile?.name || "",
                    user_id: item.user_id || id,
                    type: item.type ?? 1,
                    state: item.state ?? 2,
                    is_deleted: false,
                    publish_time: formatPublishTime(item.publish_time),
                    update_time: formatPublishTime(item.update_time || item.publish_time),
                    views: item.views ?? 0,
                    praise: item.praise ?? 0,
                    favorites: item.favorites ?? 0,
                    comments: item.comment_count ?? 0,
                    labels: item.labels || [],
                    categorys: item.categories || item.categorys || [],
                }));
                setArticles((prev) => [...prev, ...newArticles]);
                setArticlePage(nextPage);
            }
        } catch (err: any) {
            message.error(err?.message || t("loadFailed"));
        } finally {
            setLoadingMore(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            message.info(t("pleaseLogin"));
            navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }
        if (!id) {
            return;
        }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await FollowService.unfollow(id);
                setIsFollowing(false);
                setFollowersCount((c) => Math.max(0, c - 1));
                message.success(t("unfollowed"));
            } else {
                await FollowService.follow(id);
                setIsFollowing(true);
                setFollowersCount((c) => c + 1);
                message.success(t("followSuccess"));
            }
        } catch (err: any) {
            message.error(err?.response?.data?.msg || err?.message || t("operationFailed"));
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.profile}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span>{t("loading")}</span>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={styles.profile}>
                <div className={styles.loadingContainer}>
                    <span>{error || t("userNotExist")}</span>
                </div>
            </div>
        );
    }

    const renderOverview = () => (
        <div className={styles.overviewContent}>
            {userStats && (
                <div className={styles.statsCards}>
                    <div className={styles.statsCard}>
                        <BookOpen size={20} />
                        <span className={styles.statsCardNumber}>{userStats.published_articles}</span>
                        <span className={styles.statsCardLabel}>{t("stats.publishedArticles")}</span>
                    </div>
                    <div className={styles.statsCard}>
                        <Eye size={20} />
                        <span className={styles.statsCardNumber}>{userStats.total_views}</span>
                        <span className={styles.statsCardLabel}>{t("stats.totalViews")}</span>
                    </div>
                    <div className={styles.statsCard}>
                        <Heart size={20} />
                        <span className={styles.statsCardNumber}>{userStats.total_likes}</span>
                        <span className={styles.statsCardLabel}>{t("stats.totalLikes")}</span>
                    </div>
                    <div className={styles.statsCard}>
                        <MessageSquare size={20} />
                        <span className={styles.statsCardNumber}>{userStats.total_comments}</span>
                        <span className={styles.statsCardLabel}>{t("stats.totalComments")}</span>
                    </div>
                </div>
            )}

            {articles.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{t("featuredArticles")}</h2>
                    </div>
                    <div className={styles.featuredGrid}>
                        {(() => {
                            const featured = articles.slice(0, 6);
                            return (
                                <>
                                    {featured.map((article) => (
                                        <article
                                            key={article.id}
                                            className={styles.featuredCard}
                                            onClick={() => navigate(`/article/${encodeId(article.id, "article")}`)}
                                        >
                                            <div className={styles.featuredCardHeader}>
                                                <span className={styles.articleCategoryBadge}>
                                                    {Array.isArray(article.categorys) && article.categorys.length > 0
                                                        ? typeof article.categorys[0] === "object"
                                                            ? (article.categorys[0] as any).name
                                                            : article.categorys[0]
                                                        : t("uncategorized")}
                                                </span>
                                            </div>
                                            <h3 className={styles.featuredCardTitle}>{article.title}</h3>
                                            <p className={styles.featuredCardExcerpt}>
                                                {(article.content || "").replace(/�/g, "").substring(0, 120)}
                                                {(article.content || "").length > 120 ? "..." : ""}
                                            </p>
                                            <div className={styles.featuredCardFooter}>
                                                <span className={styles.featuredCardDate}>{article.publish_time}</span>
                                                <div className={styles.featuredCardStats}>
                                                    <span>
                                                        <Eye size={13} /> {article.views}
                                                    </span>
                                                    <span>
                                                        <Heart size={13} /> {article.praise}
                                                    </span>
                                                    <span>
                                                        <MessageSquare size={13} /> {article.comments}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                    {featured.length % 2 !== 0 && <div className={styles.featuredCardFiller} aria-hidden="true" />}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {articles.length === 0 && (
                <div className={styles.emptyState}>
                    <BookOpen size={48} className={styles.emptyIcon} />
                    <h3>{t("noArticles")}</h3>
                    <p>{t("noArticlesDesc")}</p>
                </div>
            )}
        </div>
    );

    const renderArticles = () => (
        <div className={styles.articlesContent}>
            <div className={styles.articlesToolbar}>
                <span className={styles.articlesCount}>{t("articlesCount", { total: articleTotal })}</span>
                <div className={styles.viewToggle}>
                    <button
                        className={viewMode === "list" ? styles.activeView : styles.inactiveView}
                        onClick={() => setViewMode("list")}
                    >
                        {t("listView")}
                    </button>
                    <button
                        className={viewMode === "grid" ? styles.activeView : styles.inactiveView}
                        onClick={() => setViewMode("grid")}
                    >
                        {t("gridView")}
                    </button>
                </div>
            </div>

            {articles.length === 0 ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} className={styles.emptyIcon} />
                    <h3>{t("noArticles")}</h3>
                    <p>{t("noArticlesDisplay")}</p>
                </div>
            ) : (
                <div className={`${styles.articlesList} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
                    {articles.map((article) => (
                        <article
                            key={article.id}
                            className={`${styles.articleCard} ${viewMode === "grid" ? styles.gridCard : styles.listCard}`}
                            onClick={() => navigate(`/article/${encodeId(article.id, "article")}`)}
                        >
                            <div className={styles.articleHeader}>
                                <span className={styles.articleCategoryBadge}>
                                    {Array.isArray(article.categorys) && article.categorys.length > 0
                                        ? typeof article.categorys[0] === "object"
                                            ? (article.categorys[0] as any).name
                                            : article.categorys[0]
                                        : t("uncategorized")}
                                </span>
                                <span className={styles.articleDate}>{article.publish_time}</span>
                            </div>
                            <h3 className={styles.articleTitle}>{article.title}</h3>
                            <p className={styles.articleExcerpt}>
                                {(article.content || "").replace(/�/g, "").substring(0, 100)}
                                {(article.content || "").length > 100 ? "..." : ""}
                            </p>
                            <div className={styles.articleFooter}>
                                <div className={styles.tags}>
                                    {(article.labels || []).slice(0, 3).map((label: any) => (
                                        <span key={typeof label === "object" ? label.id : label} className={styles.tag}>
                                            <Hash size={12} />
                                            {typeof label === "object" ? label.name : label}
                                        </span>
                                    ))}
                                    {(article.labels?.length || 0) > 3 && (
                                        <span className={styles.moreTags}>+{(article.labels?.length || 0) - 3}</span>
                                    )}
                                </div>
                                <div className={styles.articleStats}>
                                    <span>
                                        <Eye size={14} /> {article.views}
                                    </span>
                                    <span>
                                        <Heart size={14} /> {article.praise}
                                    </span>
                                    <span>
                                        <MessageSquare size={14} /> {article.comments}
                                    </span>
                                    <span>
                                        <Clock size={14} /> {t("readTime")}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {articles.length < articleTotal && (
                <button className={styles.loadMoreButton} onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? (
                        <>
                            <Loader2 size={14} className={styles.loadingSpin} />
                            {t("loading")}
                        </>
                    ) : (
                        t("loadMoreArticles")
                    )}
                </button>
            )}
        </div>
    );

    const renderTags = () => (
        <div className={styles.tagsContent}>
            {tags.length === 0 ? (
                <div className={styles.emptyState}>
                    <Hash size={48} className={styles.emptyIcon} />
                    <h3>{t("noTags")}</h3>
                    <p>{t("noTagsDesc")}</p>
                </div>
            ) : (
                <div className={styles.tagsGrid}>
                    {tags.map((tag) => (
                        <div key={tag.name} className={styles.tagCard} style={{ borderLeftColor: tag.color }}>
                            <div className={styles.tagCardHeader}>
                                <span className={styles.tagCardName} style={{ color: tag.color }}>
                                    <Hash size={14} />
                                    {tag.name}
                                </span>
                                <span className={styles.tagCardCount}>{t("articlesCount", { total: tag.count })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAchievements = () => <AchievementsTab />;

    const renderMainContent = () => {
        switch (activeTab) {
            case "overview":
                return renderOverview();
            case "articles":
                return renderArticles();
            case "achievements":
                return renderAchievements();
            case "tags":
                return renderTags();
            default:
                return null;
        }
    };

    return (
        <div className={styles.profile}>
            {/* Main layout */}
            <div className={styles.mainContent}>
                {/* Left sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarInner}>
                        <img src={profile.avatar} alt={profile.name} className={styles.avatar} />

                        <div className={styles.sidebarNameBlock}>
                            <h1 className={styles.fullName}>{profile.name}</h1>
                            <span className={styles.username}>@{profile.account || `user_${profile.id}`}</span>
                        </div>

                        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

                        <div className={styles.sidebarActions}>
                            {isOwnProfile ? (
                                <button className={styles.editButton} onClick={() => navigate("/personal?tab=edit")}>
                                    <Edit size={14} />
                                    {t("editProfile")}
                                </button>
                            ) : (
                                <button
                                    className={`${styles.followButton} ${isFollowing ? styles.followingButton : ""}`}
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                >
                                    {followLoading ? (
                                        <Loader2 size={14} className={styles.loadingSpin} />
                                    ) : isFollowing ? (
                                        <>
                                            <UserCheck size={14} />
                                            {t("followingButton")}
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={14} />
                                            {t("followButton")}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className={styles.sidebarStats}>
                            <button
                                className={styles.sidebarStat}
                                onClick={() => isOwnProfile && navigate("/personal?tab=followers")}
                                disabled={!isOwnProfile}
                            >
                                <Users size={14} />
                                <strong>{followersCount}</strong> {t("followers")}
                            </button>
                            <button
                                className={styles.sidebarStat}
                                onClick={() => isOwnProfile && navigate("/personal?tab=following")}
                                disabled={!isOwnProfile}
                            >
                                <Heart size={14} />
                                <strong>{profile.stats.following}</strong> {t("following")}
                            </button>
                        </div>

                        <div className={styles.sidebarMeta}>
                            {profile.location && (
                                <div className={styles.sidebarMetaItem}>
                                    <MapPin size={14} />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            {profile.email && (
                                <div className={styles.sidebarMetaItem}>
                                    <Mail size={14} />
                                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                                </div>
                            )}
                            {profile.website && (
                                <div className={styles.sidebarMetaItem}>
                                    <Link2 size={14} />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                        {profile.website.replace(/^https?:\/\//, "")}
                                    </a>
                                </div>
                            )}
                            {profile.github && (
                                <div className={styles.sidebarMetaItem}>
                                    <FaGithub size={14} />
                                    <a
                                        href={toGithubHref(profile.github)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={toGithubLabel(profile.github)}
                                    >
                                        {toGithubLabel(profile.github)}
                                    </a>
                                </div>
                            )}
                            {profile.joinDate && (
                                <div className={styles.sidebarMetaItem}>
                                    <Clock size={14} />
                                    <span>{t("joinedAt", { value: profile.joinDate })}</span>
                                </div>
                            )}
                        </div>

                        {userStats && (
                            <div className={styles.sidebarAchievements}>
                                <h3 className={styles.achievementsTitle}>{t("achievements")}</h3>
                                <div className={styles.achievementsGrid}>
                                    <div className={styles.achievement}>
                                        <BookOpen size={16} />
                                        <span>{t("articlesCount", { total: userStats.published_articles })}</span>
                                    </div>
                                    <div className={styles.achievement}>
                                        <Eye size={16} />
                                        <span>{t("viewsCount", { total: userStats.total_views })}</span>
                                    </div>
                                    <div className={styles.achievement}>
                                        <Star size={16} />
                                        <span>{t("likesCount", { total: userStats.total_likes })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main content area */}
                <main className={styles.content}>
                    <nav className={styles.contentTabs}>
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`${styles.contentTab} ${activeTab === tab.key ? styles.contentTabActive : ""}`}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setSearchParams({ tab: tab.key }, { replace: true });
                                }}
                            >
                                {t(tab.labelKey)}
                                {tab.key === "articles" && articleTotal > 0 && (
                                    <span className={styles.contentTabCount}>{articleTotal}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                    {renderMainContent()}
                </main>
            </div>

            <BackToTop />
        </div>
    );
};

export default Profile;

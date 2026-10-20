import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./IndexPage.module.css";
import classicStyles from "./IndexPageClassic.module.css";
import ArticleList from "@/components/articleList/ArticleList";
import CategoryPanel from "@/components/categoryPanel/CategoryPanel";
import TagPanel from "@/components/tagPanel/TagPanel";
import SearchBox from "@/components/searchBox/SearchBox";
import DailyQuote from "@/components/dailyQuote/DailyQuote";
import StatsPanel from "@/components/statsPanel/StatsPanel";
import Calendar from "@/components/calendar/Calendar";
import BackToTop from "@/components/backToTop/BackToTop";
import LabelService from "@/services/LabelService.ts";
import PageSkeleton from "@/components/pageSkeleton/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLayoutMode } from "@/contexts/LayoutModeContext";

interface TagItem {
    id: string | number;
    color: string;
    name: string;
}

const IndexPage: React.FC = () => {
    const { t } = useTranslation("home");
    const { user, loading: authLoading } = useAuth();
    const { mode } = useLayoutMode();

    const [tags, setTags] = useState<TagItem[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [selectedLabelId, setSelectedLabelId] = useState<string | number | undefined>(undefined);
    const [selectedLabelName, setSelectedLabelName] = useState<string | undefined>(undefined);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | undefined>(undefined);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(undefined);
    const [searchKeyword, setSearchKeyword] = useState<string>("");

    // 获取标签（使用 LabelService），仅在已登录时请求
    useEffect(() => {
        const fetchTags = async () => {
            setTagsLoading(true);
            if (!user || !user.id) {
                setTags([]);
                setTagsLoading(false);
                return;
            }

            try {
                const res = await LabelService.queryLabel({ user_id: user.id });
                const mapped = (res || []).map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    color: t.color || "#61dafb",
                }));
                setTags(mapped);
            } catch (err) {
                console.error("获取标签失败:", err);
                setTags([]);
            } finally {
                setTagsLoading(false);
            }
        };

        fetchTags();
    }, [user]);

    // 数据加载完成后立即移除骨架屏
    useEffect(() => {
        if (!authLoading && !tagsLoading) {
            setShowContent(true);
            setIsInitialLoad(false);
        }
    }, [authLoading, tagsLoading]);

    const handleTagClick = (tag: TagItem) => {
        if (selectedLabelId === tag.id) {
            // 再次点击取消选中
            setSelectedLabelId(undefined);
            setSelectedLabelName(undefined);
        } else {
            setSelectedLabelId(tag.id);
            setSelectedLabelName(tag.name);
            // 清除分类和搜索
            setSelectedCategoryId(undefined);
            setSelectedCategoryName(undefined);
            setSearchKeyword("");
        }
    };

    const handleCategoryClick = (id: string | number, name?: string) => {
        if (selectedCategoryId === id) {
            // 再次点击取消选中
            setSelectedCategoryId(undefined);
            setSelectedCategoryName(undefined);
        } else {
            setSelectedCategoryId(id);
            setSelectedCategoryName(name);
            // 清除标签和搜索
            setSelectedLabelId(undefined);
            setSelectedLabelName(undefined);
            setSearchKeyword("");
        }
    };

    // 经典布局：保留旧版首页结构（右侧完整的侧边栏 + 无外层卡片）
    if (mode === "classic") {
        return (
            <>
                {isInitialLoad ? (
                    <PageSkeleton />
                ) : (
                    <div
                        className={`${classicStyles.mainContent} ${showContent ? classicStyles.contentVisible : classicStyles.contentHidden}`}
                    >
                        <div className={classicStyles.leftColumn}>
                            <ArticleList
                                labelId={selectedLabelId}
                                labelName={selectedLabelName}
                                categoryId={selectedCategoryId}
                                categoryName={selectedCategoryName}
                                searchKeyword={searchKeyword}
                                headerRight={
                                    <SearchBox
                                        placeholder={t("searchPlaceholder")}
                                        size="small"
                                        onSearch={(keyword) => setSearchKeyword(keyword.trim())}
                                        onChange={(value) => {
                                            if (!value) {
                                                setSearchKeyword("");
                                            }
                                        }}
                                    />
                                }
                            />
                        </div>

                        <div className={classicStyles.rightColumn}>
                            <div className={classicStyles.panelSlot}>
                                <DailyQuote />
                            </div>
                            <div className={classicStyles.panelSlot}>
                                <TagPanel
                                    tags={tags}
                                    loading={tagsLoading}
                                    selectedTagId={selectedLabelId}
                                    onTagClick={handleTagClick}
                                />
                            </div>
                            <div className={classicStyles.panelSlot}>
                                <CategoryPanel selectedCategoryId={selectedCategoryId} onCategoryClick={handleCategoryClick} />
                            </div>
                            <div className={classicStyles.panelSlot}>
                                <StatsPanel />
                            </div>
                            <div className={classicStyles.panelSlot}>
                                <Calendar />
                            </div>
                        </div>
                    </div>
                )}
                <BackToTop />
            </>
        );
    }

    return (
        <>
            {isInitialLoad ? (
                <PageSkeleton />
            ) : (
                <div className={styles.mainCardWrap}>
                    <div className={`${styles.mainContent} ${showContent ? styles.contentVisible : styles.contentHidden}`}>
                        <div className={styles.contentRow}>
                            {/* 左侧：文章列表 */}
                            <div className={styles.leftColumn}>
                                <ArticleList
                                    labelId={selectedLabelId}
                                    labelName={selectedLabelName}
                                    categoryId={selectedCategoryId}
                                    categoryName={selectedCategoryName}
                                    searchKeyword={searchKeyword}
                                    scrollable
                                    headerRight={
                                        <SearchBox
                                            placeholder={t("searchPlaceholder")}
                                            size="small"
                                            onSearch={(keyword) => setSearchKeyword(keyword.trim())}
                                            onChange={(value) => {
                                                if (!value) {
                                                    setSearchKeyword("");
                                                }
                                            }}
                                        />
                                    }
                                />
                            </div>

                            {/* 右侧：侧边栏 */}
                            <div className={styles.rightColumn}>
                                {/* 每日名言 */}
                                <div className={`${styles.panelSlot} ${styles.wide}`}>
                                    <DailyQuote />
                                </div>
                                {/* 访问统计 */}
                                <div className={`${styles.panelSlot} ${styles.wide}`}>
                                    <StatsPanel />
                                </div>
                                {/* 文章标签 */}
                                <div className={`${styles.panelSlot} ${styles.wide}`}>
                                    <TagPanel
                                        tags={tags}
                                        loading={tagsLoading}
                                        selectedTagId={selectedLabelId}
                                        onTagClick={handleTagClick}
                                    />
                                </div>
                                {/* 文章分类 */}
                                <div className={`${styles.panelSlot} ${styles.wide}`}>
                                    <CategoryPanel selectedCategoryId={selectedCategoryId} onCategoryClick={handleCategoryClick} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IndexPage;

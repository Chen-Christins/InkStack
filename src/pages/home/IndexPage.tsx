import React, { useState, useEffect } from "react";
import styles from "./IndexPage.module.css";
import ArticleList from "@/components/articleList/ArticleList";
import CategoryPanel from "@/components/categoryPanel/CategoryPanel";
import TagPanel from "@/components/tagPanel/TagPanel";
import SearchBox from "@/components/searchBox/SearchBox";
import DailyQuote from "@/components/dailyQuote/DailyQuote";
import StatsPanel from "@/components/statsPanel/StatsPanel";
import LabelService from "@/services/LabelService.ts";
import PageSkeleton from "@/components/pageSkeleton/PageSkeleton";
import { useAuth } from "@/contexts/AuthContext";

const IndexPage: React.FC = () => {
    const { user, loading: authLoading } = useAuth();

    const [tags, setTags] = useState<{ id: string | number; color: string; name: string }[]>([]);
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
                                    headerRight={
                                        <SearchBox
                                            placeholder="搜索文章..."
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
                                        onTagClick={(tag) => {
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
                                        }}
                                    />
                                </div>
                                {/* 文章分类 */}
                                <div className={`${styles.panelSlot} ${styles.wide}`}>
                                    <CategoryPanel
                                        selectedCategoryId={selectedCategoryId}
                                        onCategoryClick={(id, name) => {
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
                                        }}
                                    />
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

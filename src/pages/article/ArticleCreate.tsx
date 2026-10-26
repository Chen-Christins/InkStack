import ArticleService, { type CreateArticleParams } from "@/services/ArticleService.ts";
import CategoryService from "@/services/CategoryService.ts";
import LabelService from "@/services/LabelService.ts";
import React, { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { encodeId, decodeId } from "@/utils/HashId.ts";
import ReactMarkdown from "react-markdown";
import { articleMarkdownComponents, articleMarkdownPlugins } from "@/components/articleView/Markdown";
import type { ArticleCreateProps, ArticleFormData, SelectOption, Tag } from "@/types";
import { FaEdit, FaEye, FaFileImport, FaInfoCircle, FaLock } from "react-icons/fa";
import styles from "./ArticleCreate.module.css";
import CustomSelect from "@/components/customSelect/CustomSelect";
import AddButton from "@/components/addButton/AddButton";
import Skeleton from "@/components/skeleton/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useEditorToolbar } from "@/contexts/EditorToolbarContext";
import message from "@/components/message/Message";

// 模拟数据（已移除）

// 文章草稿持久化（sessionStorage），刷新时保留已选分类/标签
const ARTICLE_DRAFT_KEY = "article_create_draft";

interface ArticleDraft {
    title: string;
    articleType: "original" | "repost";
    categoryId: string | number | null;
    tagIds: (string | number)[];
    content: string;
}

function saveDraftToStorage(formData: ArticleFormData, selectedTags: Tag[]): void {
    const draft: ArticleDraft = {
        title: formData.title,
        articleType: formData.articleType,
        categoryId: formData.category?.id ?? null,
        tagIds: selectedTags.map((t) => t.id),
        content: formData.content,
    };
    sessionStorage.setItem(ARTICLE_DRAFT_KEY, JSON.stringify(draft));
}

function loadDraftFromStorage(): ArticleDraft | null {
    const raw = sessionStorage.getItem(ARTICLE_DRAFT_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearDraftFromStorage(): void {
    sessionStorage.removeItem(ARTICLE_DRAFT_KEY);
}

const ArticleCreate: React.FC<ArticleCreateProps> = ({ onSaveDraft, onPublish, initialData }) => {
    const { user } = useAuth();
    const { id: encodedId } = useParams();
    const id = encodedId ? decodeId(encodedId, "article") : null;
    const navigate = useNavigate();
    const { t } = useTranslation("article");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [formData, setFormData] = useState<ArticleFormData>({
        title: "",
        articleType: "original",
        category: null,
        tags: [],
        content: "",
        ...initialData,
    });

    // 复制成功状态管理
    const [copySuccess, setCopySuccess] = useState<string>("");
    const copyTimeoutRef = useRef<number | null>(null);

    // 处理复制功能
    const handleCopy = async (text: string, type?: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(t("code.copiedToClipboard", { type: type ?? t("code.copy") }));

            // 清除之前的定时器
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            // 3秒后清除提示
            copyTimeoutRef.current = setTimeout(() => {
                setCopySuccess("");
            }, 3000);
        } catch (err) {
            setCopySuccess(t("code.copyFailedManual"));
            setTimeout(() => setCopySuccess(""), 3000);
        }
    };

    // 清理定时器
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const [viewMode, setViewMode] = useState<"editor" | "preview" | "both">("both");
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<SelectOption[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const initialLoadDone = useRef(false);

    // 自动保存草稿到 sessionStorage（仅创建模式），刷新后恢复已选分类/标签
    useEffect(() => {
        if (!id && initialLoadDone.current) {
            saveDraftToStorage(formData, selectedTags);
        }
    }, [formData, selectedTags, id]);

    // 页面加载时获取分类和标签列表（async/await风格）
    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                setLoading(true);
                let formattedCategories: SelectOption[] = [];
                let formattedTags: Tag[] = [];

                try {
                    // 获取当前用户的分类，保证每项都有 color 字段
                    const categoryData = await CategoryService.queryMyCategory();
                    formattedCategories = categoryData.list.map((cat) => ({
                        id: cat.id,
                        name: cat.name,
                        color: cat.color || "#3B82F6",
                    }));
                    setCategories(formattedCategories);
                } catch (err) {
                    console.error("获取分类失败:", err);
                }

                try {
                    // 获取所有标签，使用当前用户id
                    const tagData = await LabelService.queryLabel({ user_id: user.id });
                    formattedTags = tagData.map((tag) => ({
                        id: tag.id,
                        name: tag.name,
                        color: tag.color || "#61dafb",
                    }));
                    setTags(formattedTags);
                } catch (err) {
                    console.error("获取标签失败:", err);
                }

                // 创建模式下，从 sessionStorage 恢复上次选择的分类/标签（匹配最新列表）
                if (!id) {
                    const draft = loadDraftFromStorage();
                    if (draft) {
                        setFormData((prev) => ({
                            ...prev,
                            title: draft.title || prev.title,
                            articleType: draft.articleType || prev.articleType,
                            content: draft.content || prev.content,
                        }));
                        if (draft.categoryId) {
                            const savedCategory = formattedCategories.find((c) => c.id == draft.categoryId);
                            if (savedCategory) {
                                setFormData((prev) => ({ ...prev, category: savedCategory }));
                            }
                        }
                        if (draft.tagIds?.length) {
                            const restoredTags = formattedTags.filter((t) => draft.tagIds.includes(t.id));
                            if (restoredTags.length) {
                                setSelectedTags(restoredTags);
                                setFormData((prev) => ({ ...prev, tags: restoredTags }));
                            }
                        }
                    }
                }

                // 如果是编辑模式，获取文章详情
                if (id) {
                    try {
                        let article;
                        try {
                            // 尝试获取文章详情，先假设是原创(1)
                            article = await ArticleService.getArticleDetails({ id, type: 1 });
                        } catch (err) {
                            // 如果失败，尝试转载(2)
                            article = await ArticleService.getArticleDetails({ id, type: 2 });
                        }

                        if (article) {
                            // 检查权限
                            if (String(article.user_id) !== String(user.id)) {
                                setPermissionDenied(true);
                                setLoading(false);
                                return;
                            }

                            // 填充表单
                            setFormData((prev) => ({
                                ...prev,
                                title: article.title,
                                content: article.content,
                                articleType: article.type === 1 ? "original" : "repost",
                                category: formattedCategories.find((c) => c.id == article.categorys?.[0]?.id) || null,
                                tags: [],
                            }));

                            // 填充标签
                            if (article.labels && article.labels.length > 0) {
                                const articleTags = formattedTags.filter((t) => article.labels?.some((l) => l.id === t.id));
                                setSelectedTags(articleTags);
                                setFormData((prev) => ({ ...prev, tags: articleTags }));
                            }

                            // 填充分类
                            if (article.categorys && article.categorys.length > 0) {
                                const cat = formattedCategories.find((c) => c.id == article.categorys![0]?.id);
                                if (cat) {
                                    setFormData((prev) => ({ ...prev, category: cat }));
                                }
                            }
                        }
                    } catch (err) {
                        console.error("获取文章详情失败:", err);
                        message.error(t("create.fetchFailed"));
                    }
                }
                setLoading(false);
                initialLoadDone.current = true;
            }
        };
        fetchData();
    }, [user, id]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, title: e.target.value }));
    };

    const handleTypeChange = (type: "original" | "repost") => {
        setFormData((prev) => ({ ...prev, articleType: type }));
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, content: e.target.value }));
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setFormData((prev) => ({
                    ...prev,
                    content,
                    // 如果标题为空，默认使用文件名（去掉扩展名）
                    title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
                }));
            };
            reader.readAsText(file);
        }
        // 重置 input 以便重复选择同一文件
        e.target.value = "";
    };

    const handleRemoveTag = (tagId: string | number) => {
        const newTags = selectedTags.filter((tag) => tag.id !== tagId);
        setSelectedTags(newTags);
        setFormData((prev) => ({ ...prev, tags: newTags }));
    };

    const handleAddTag = async (newTag: SelectOption) => {
        // 创建标签到后端
        try {
            const created = await LabelService.createLabel({
                name: newTag.name,
                color: newTag.color || "#61dafb",
            });
            // 更新标签列表
            const tagToAdd: Tag = {
                id: created.id,
                name: created.name,
                color: created.color,
            };
            setTags((prev) => [...prev, tagToAdd]);
            if (!selectedTags.find((t) => t.id === tagToAdd.id)) {
                const newTags = [...selectedTags, tagToAdd];
                setSelectedTags(newTags);
                setFormData((prev) => ({ ...prev, tags: newTags }));
            }
        } catch (err) {
            console.error("标签创建失败:", err);
        }
    };

    const handleAddCategory = async (newCategory: SelectOption) => {
        // 创建个人分类到后端，成功后自动选中
        try {
            const created = await CategoryService.createMyCategory({
                name: newCategory.name,
                url: newCategory.name,
                icon: "📁",
                color: newCategory.color || "#4361ee",
            });
            const categoryToAdd: SelectOption = {
                id: created.id,
                name: created.name,
                color: created.color || newCategory.color || "#4361ee",
            };
            setCategories((prev) => {
                if (prev.some((item) => item.id === categoryToAdd.id)) {
                    return prev;
                }
                return [...prev, categoryToAdd];
            });
            setFormData((prev) => ({ ...prev, category: categoryToAdd }));
        } catch (err) {
            console.error("分类创建失败:", err);
            message.error(t("create.categoryCreateFailed"));
        }
    };

    // 保存草稿：只创建文章
    const handleSaveDraft = async () => {
        if (submitting) {
            return;
        }
        onSaveDraft?.(formData);
        setSubmitting(true);
        try {
            const labelIds = selectedTags.length > 0 ? selectedTags.map((t) => t.id).join(",") : "";
            const categoryId = formData.category?.id ? String(formData.category.id) : "";

            if (id) {
                await ArticleService.updateArticleContent({
                    id,
                    title: formData.title,
                    content: formData.content,
                    type: formData.articleType === "original" ? 1 : 2,
                    label: labelIds,
                    category: categoryId,
                });
                message.success(t("create.updated"));
            } else {
                const createParams: CreateArticleParams = {
                    title: formData.title,
                    content: formData.content,
                    type: formData.articleType === "original" ? 1 : 2,
                };
                if (labelIds) {
                    createParams.label = labelIds;
                }
                if (categoryId) {
                    createParams.category = categoryId;
                }
                const data = await ArticleService.createArticle(createParams);
                if (data) {
                    message.success(t("create.draftSaved"));
                    clearDraftFromStorage();
                } else {
                    message.error(t("create.draftSaveFailed"));
                }
            }
        } catch (err) {
            console.error("保存草稿失败:", err);
            message.error(t("create.draftSaveFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    // 发布文章：先创建再发布
    const handlePublish = async () => {
        if (submitting) {
            return;
        }
        onPublish?.(formData);
        setSubmitting(true);
        try {
            // 选中的标签id
            const labelIds = selectedTags.length > 0 ? selectedTags.map((t) => t.id).join(",") : "";
            // 选中的分类id
            const categoryId = formData.category?.id ? String(formData.category.id) : "";

            if (id) {
                await ArticleService.updateArticleContent({
                    id,
                    title: formData.title,
                    content: formData.content,
                    type: formData.articleType === "original" ? 1 : 2,
                    label: labelIds,
                    category: categoryId,
                });
                message.success(t("create.updatedWithTitle", { title: formData.title || t("untitled") }));
                navigate(`/article/${encodeId(id, "article")}`);
            } else {
                const createParams: CreateArticleParams = {
                    title: formData.title,
                    content: formData.content,
                    type: formData.articleType === "original" ? 1 : 2,
                };
                if (labelIds) {
                    createParams.label = labelIds;
                }
                if (categoryId) {
                    createParams.category = categoryId;
                }
                const createRes = await ArticleService.createArticle(createParams);
                if (createRes.id) {
                    // 当前时间戳（秒），uint64
                    const timestamp = Math.floor(Date.now() / 1000);
                    await ArticleService.publishArticle({
                        id: createRes.id,
                        publish_time: timestamp,
                    });
                    message.success(t("create.publishedWithTitle", { title: formData.title || t("untitled") }));
                    clearDraftFromStorage();
                    navigate(`/article/${encodeId(createRes.id, "article")}`);
                    // console.log('发布文章成功:', publishRes);
                } else {
                    // console.error('创建文章失败，无法发布');
                    message.error(t("create.createFailedCannotPublish"));
                }
            }
        } catch (err) {
            console.error("发布文章失败:", err);
            message.error(t("create.publishFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    // 将保存/发布动作暴露给顶部工具栏（撰写文章的胶囊位置）
    const editorToolbar = useEditorToolbar();
    const editorHandlersRef = editorToolbar?.handlersRef;
    const setEditorToolbarState = editorToolbar?.setState;
    if (editorHandlersRef) {
        editorHandlersRef.current = { onSaveDraft: handleSaveDraft, onPublish: handlePublish };
    }

    useEffect(() => {
        if (!setEditorToolbarState) {
            return;
        }
        setEditorToolbarState({ active: true, submitting, isEdit: !!id });
        return () => setEditorToolbarState({ active: false, submitting: false, isEdit: false });
    }, [setEditorToolbarState, submitting, id]);

    // Markdown 语法帮助数据
    const markdownHelpData = [
        {
            element: t("create.help.heading.element"),
            syntax: t("create.help.heading.syntax"),
            example: t("create.help.heading.example"),
        },
        { element: t("create.help.bold.element"), syntax: t("create.help.bold.syntax"), example: t("create.help.bold.example") },
        { element: t("create.help.italic.element"), syntax: t("create.help.italic.syntax"), example: t("create.help.italic.example") },
        { element: t("create.help.link.element"), syntax: t("create.help.link.syntax"), example: t("create.help.link.example") },
        { element: t("create.help.image.element"), syntax: t("create.help.image.syntax"), example: t("create.help.image.example") },
        { element: t("create.help.list.element"), syntax: t("create.help.list.syntax"), example: t("create.help.list.example") },
        { element: t("create.help.code.element"), syntax: t("create.help.code.syntax"), example: t("create.help.code.example") },
        { element: t("create.help.quote.element"), syntax: t("create.help.quote.syntax"), example: t("create.help.quote.example") },
        {
            element: t("create.help.mathInline.element"),
            syntax: t("create.help.mathInline.syntax"),
            example: t("create.help.mathInline.example"),
        },
        {
            element: t("create.help.mathBlock.element"),
            syntax: t("create.help.mathBlock.syntax"),
            example: t("create.help.mathBlock.example"),
        },
        {
            element: t("create.help.mermaid.element"),
            syntax: t("create.help.mermaid.syntax"),
            example: t("create.help.mermaid.example"),
        },
    ];

    // 创建标题组件工厂函数
    const createHeadingComponent = (level: number) => {
        return ({ children, ...props }: any) => {
            const text = React.Children.toArray(children).join("");
            const id = text
                .toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
                .replace(/\s+/g, "-");

            switch (level) {
                case 1:
                    return (
                        <h1 id={id} {...props}>
                            {children}
                        </h1>
                    );
                case 2:
                    return (
                        <h2 id={id} {...props}>
                            {children}
                        </h2>
                    );
                case 3:
                    return (
                        <h3 id={id} {...props}>
                            {children}
                        </h3>
                    );
                case 4:
                    return (
                        <h4 id={id} {...props}>
                            {children}
                        </h4>
                    );
                case 5:
                    return (
                        <h5 id={id} {...props}>
                            {children}
                        </h5>
                    );
                case 6:
                    return (
                        <h6 id={id} {...props}>
                            {children}
                        </h6>
                    );
                default:
                    return (
                        <h2 id={id} {...props}>
                            {children}
                        </h2>
                    );
            }
        };
    };

    // 简化段落组件
    const ParagraphComponent: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { node?: any }> = ({ children, ...props }) => {
        return <p {...props}>{children}</p>;
    };

    if (loading) {
        return (
            <div className={styles.editorContainer}>
                <div className={styles.editorHeader}>
                    <Skeleton variant="text" width={200} height={32} />
                </div>
                <div style={{ padding: "20px 0" }}>
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ marginBottom: "10px" }}>
                            <Skeleton variant="text" width={100} height={24} />
                        </div>
                        <Skeleton variant="rounded" height={40} />
                    </div>
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ marginBottom: "10px" }}>
                            <Skeleton variant="text" width={100} height={24} />
                        </div>
                        <Skeleton variant="rounded" height={400} />
                    </div>
                </div>
            </div>
        );
    }

    if (permissionDenied) {
        return (
            <div
                className={styles.editorContainer}
                style={{
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div style={{ fontSize: "48px", color: "#dc3545", marginBottom: "20px" }}>
                    <FaLock />
                </div>
                <h2 style={{ marginBottom: "10px", color: "#333" }}>{t("create.permissionDenied")}</h2>
                <p style={{ color: "#666", marginBottom: "20px" }}>{t("create.permissionDeniedDesc")}</p>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => navigate("/")}>
                    {t("create.backHome")}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={styles.editorContainer}>
                {/* 头部 */}
                <div className={styles.editorHeader}>
                    <h2>
                        <Link to="/" className={styles.editorHeaderLink}>
                            {id ? t("create.editTitle") : t("create.createTitle")}
                        </Link>
                    </h2>
                </div>

                {/* 文章标题 */}
                <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>
                        <i className="bi bi-type"></i>
                        {t("create.titleLabel")}
                    </div>
                    <input
                        type="text"
                        className={styles.formControl}
                        placeholder={t("create.titlePlaceholder")}
                        value={formData.title}
                        onChange={handleTitleChange}
                    />
                </div>

                {/* 文章类型 */}
                <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>
                        <i className="bi bi-file-earmark"></i>
                        {t("create.typeLabel")}
                    </div>
                    <div className={styles.radioGroup}>
                        <label className={styles.radioItem}>
                            <input
                                type="radio"
                                className={styles.radioInput}
                                name="article-type"
                                value="original"
                                checked={formData.articleType === "original"}
                                onChange={() => handleTypeChange("original")}
                            />
                            <span className={styles.radioLabel}>{t("create.typeOriginal")}</span>
                        </label>
                        <label className={styles.radioItem}>
                            <input
                                type="radio"
                                className={styles.radioInput}
                                name="article-type"
                                value="repost"
                                checked={formData.articleType === "repost"}
                                onChange={() => handleTypeChange("repost")}
                            />
                            <span className={styles.radioLabel}>{t("create.typeRepost")}</span>
                        </label>
                    </div>
                </div>

                {/* 文章分类 */}
                <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>
                        <i className="bi bi-folder"></i>
                        {t("create.categoryLabel")}
                        <AddButton name={t("create.categorySelect")} onAdd={handleAddCategory} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <CustomSelect
                            name={t("create.categorySelect")}
                            options={categories}
                            value={formData.category}
                            hideBadge
                            onChange={(selected, _idx) => {
                                setFormData((prev) => ({ ...prev, category: selected }));
                            }}
                        />
                    </div>
                </div>

                {/* 文章标签 */}
                <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>
                        <i className="bi bi-tags"></i>
                        {t("create.tagLabel")}
                        <AddButton name={t("create.tagSelect")} onAdd={handleAddTag} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <CustomSelect
                            name={t("create.tagSelect")}
                            options={tags.filter((tag) => !selectedTags.find((t) => t.id === tag.id))}
                            value={null}
                            onChange={(selected, _idx) => {
                                if (selected) {
                                    // 多选逻辑，添加到 selectedTags
                                    if (!selectedTags.find((t) => t.id === selected.id)) {
                                        const newTags = [...selectedTags, selected];
                                        setSelectedTags(newTags);
                                        setFormData((prev) => ({ ...prev, tags: newTags }));
                                    }
                                }
                            }}
                        />
                    </div>
                    <div className={styles.tagsContainer}>
                        {selectedTags.map((tag) => (
                            <div key={tag.id} className={styles.tagItem}>
                                {tag.name}
                                <button className={styles.removeTag} onClick={() => handleRemoveTag(tag.id)}>
                                    <i className="bi bi-x"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 文章内容 */}
                <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>
                        <i className="bi bi-pencil"></i>
                        {t("create.contentLabel")}
                    </div>

                    {/* 工具栏 */}
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarLeft}>
                            <button className={`${styles.btn} ${styles.btnOutlinePrimary}`} onClick={handleImportClick}>
                                <FaFileImport /> {t("create.importMarkdown")}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className={styles.fileInput}
                                accept=".md,.markdown"
                                onChange={handleFileImport}
                            />
                            <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setShowHelpModal(true)}>
                                <FaInfoCircle /> {t("create.syntaxHelp")}
                            </button>
                        </div>
                        <div className={styles.toolbarRight}>
                            <button
                                className={`${styles.editorTab} ${viewMode === "editor" ? styles.active : ""}`}
                                onClick={() => setViewMode("editor")}
                            >
                                <FaEdit /> {t("create.modeEditor")}
                            </button>
                            <button
                                className={`${styles.editorTab} ${viewMode === "preview" ? styles.active : ""}`}
                                onClick={() => setViewMode("preview")}
                            >
                                <FaEye /> {t("create.modePreview")}
                            </button>
                            <button
                                className={`${styles.editorTab} ${viewMode === "both" ? styles.active : ""}`}
                                onClick={() => setViewMode("both")}
                            >
                                {t("create.modeSplit")}
                            </button>
                        </div>
                    </div>

                    {/* 编辑器区域 */}
                    <div className={styles.editorRow}>
                        {(viewMode === "editor" || viewMode === "both") && (
                            <div className={styles.editorColumn}>
                                <textarea
                                    className={`${styles.markdownEditor} ${styles.editorContent} ${styles.active}`}
                                    placeholder={t("create.contentPlaceholder")}
                                    value={formData.content}
                                    onChange={handleContentChange}
                                />
                            </div>
                        )}
                        {(viewMode === "preview" || viewMode === "both") && (
                            <div className={styles.editorColumn}>
                                <div className={`${styles.markdownPreview} ${styles.editorContent} ${styles.active}`}>
                                    <ReactMarkdown
                                        {...articleMarkdownPlugins}
                                        components={articleMarkdownComponents({
                                            styles,
                                            paragraph: ParagraphComponent,
                                            heading: createHeadingComponent,
                                            onCopy: (text) => {
                                                void navigator.clipboard.writeText(text);
                                            },
                                            mermaidCopyLabel: t("code.copyCode"),
                                            trimMermaidCopy: false,
                                        })}
                                    >
                                        {formData.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Markdown 帮助模态框 */}
            {showHelpModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{t("create.helpTitle")}</h3>
                            <button className={styles.modalClose} onClick={() => setShowHelpModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>{t("create.helpTable.element")}</th>
                                        <th>{t("create.helpTable.syntax")}</th>
                                        <th>{t("create.helpTable.example")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {markdownHelpData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.element}</td>
                                            <td style={{ whiteSpace: "pre-line" }}>{item.syntax}</td>
                                            <td className={styles.exampleCell}>
                                                <div className={styles.markdownExample}>
                                                    <ReactMarkdown
                                                        {...articleMarkdownPlugins}
                                                        components={articleMarkdownComponents({
                                                            styles,
                                                            paragraph: ParagraphComponent,
                                                            heading: createHeadingComponent,
                                                            onCopy: handleCopy,
                                                            mermaidCopyLabel: t("code.copyCode"),
                                                            trimMermaidCopy: true,
                                                        })}
                                                    >
                                                        {item.example}
                                                    </ReactMarkdown>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.modalFooter}>
                            {copySuccess && <div className={styles.copySuccessMessage}>{copySuccess}</div>}
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowHelpModal(false)}>
                                {t("create.know")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ArticleCreate;

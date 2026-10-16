import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaTag, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import { message } from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import LabelService from "@/services/LabelService.ts";
import { formatToChinaTime } from "@/utils/Utils.ts";
import styles from "../PersonalCenter.module.css";

// 个人标签类型
interface PersonalTag {
    id: number;
    name: string;
    description?: string | "暂无";
    articleCount?: number | 0;
    color: string;
    createTime?: string | "未知时间";
}

const MyTagsTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const { user } = useAuth();
    const userId = user?.id;
    const [tags, setTags] = useState<PersonalTag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
    const [tagForm, setTagForm] = useState({
        name: "",
        description: "",
        color: "#61dafb",
    });
    const [savingTag, setSavingTag] = useState(false);

    useEffect(() => {
        const fetchPersonalTags = async () => {
            setTagsLoading(true);
            if (!userId) {
                setTags([]);
                setTagsLoading(false);
                return;
            }

            try {
                const res = await LabelService.queryLabel({ user_id: userId });
                const mapped = (res || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.desc || t("tags.unknownDescription"),
                    articleCount: (item.article_count as number) || 0,
                    color: item.color || "#61dafb",
                    createTime: item.create_time ? formatToChinaTime(item.create_time) : t("tags.unknownTime"),
                }));
                setTags(mapped);
            } catch (err) {
                console.error("获取个人标签失败:", err);
                setTags([]);
            } finally {
                setTagsLoading(false);
            }
        };

        fetchPersonalTags();
    }, [userId]);

    // 添加/编辑标签
    const handleSaveTag = async () => {
        if (!tagForm.name.trim()) {
            return;
        }

        setSavingTag(true);
        try {
            if (editingTag) {
                // 编辑标签
                const res = await LabelService.createLabel({
                    id: editingTag.id,
                    name: tagForm.name,
                    color: tagForm.color,
                    description: tagForm.description || "",
                });

                setTags(
                    tags.map((tag) =>
                        tag.id === editingTag.id
                            ? {
                                  ...tag,
                                  name: res.name,
                                  description: res.desc || t("tags.unknownDescription"),
                                  color: res.color,
                                  createTime: res.create_time ? formatToChinaTime(res.create_time) : tag.createTime,
                              }
                            : tag,
                    ),
                );
            } else {
                // 创建新标签
                const res = await LabelService.createLabel({
                    name: tagForm.name,
                    color: tagForm.color,
                    description: tagForm.description || "",
                });

                // 将API响应映射到PersonalTag格式
                const newTag: PersonalTag = {
                    id: Number(res.id),
                    name: res.name,
                    description: res.desc || t("tags.unknownDescription"),
                    articleCount: 0,
                    color: res.color,
                    createTime: res.create_time ? formatToChinaTime(res.create_time) : new Date().toISOString().split("T")[0],
                };
                setTags([...tags, newTag]);
            }

            setShowTagModal(false);
            setEditingTag(null);
            setTagForm({ name: "", description: "", color: "#61dafb" });
        } catch (err) {
            console.error("保存标签失败:", err);
            message.error(t("tags.message.saveFailed"));
        } finally {
            setSavingTag(false);
        }
    };

    // 删除标签
    const handleDeleteTag = async (tag: PersonalTag) => {
        const confirmed = await confirm({
            title: t("tags.deleteConfirmTitle"),
            content: t("tags.deleteConfirmContent", { name: tag.name }),
            confirmText: t("tags.delete"),
            cancelText: t("tags.cancel"),
        });

        if (confirmed) {
            try {
                await LabelService.deleteLabel({ ids: String(tag.id) });
                // 删除成功后从本地状态移除
                setTags(tags.filter((item) => item.id !== tag.id));
            } catch (err) {
                console.error("删除标签失败:", err);
                message.error(t("tags.message.deleteFailed"));
            }
        }
    };

    // 编辑标签
    const handleEditTag = (tag: PersonalTag) => {
        setEditingTag(tag);
        setTagForm({
            name: tag.name,
            description: tag.description || "",
            color: tag.color,
        });
        setShowTagModal(true);
    };

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("tags.title")}</h2>
                <button className={styles.addButton} onClick={() => setShowTagModal(true)}>
                    <FaPlus />
                    {t("tags.createLabel")}
                </button>
            </div>

            {tagsLoading ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <Loading size="small" text={t("tags.loading")} />
                </div>
            ) : tags.length === 0 ? (
                <div className={styles.emptyState}>
                    <FaTag className={styles.emptyIcon} />
                    <h3>{t("tags.emptyTitle")}</h3>
                    <p>{t("tags.emptyHint")}</p>
                </div>
            ) : (
                <div className={styles.tagsGrid}>
                    {tags.map((tag) => (
                        <div key={tag.id} className={styles.tagCard}>
                            <div className={styles.tagHeader}>
                                <div className={styles.tagColor} style={{ backgroundColor: tag.color }}></div>
                                <h3>{tag.name}</h3>
                            </div>
                            <p className={styles.tagDescription}>{tag.description}</p>
                            <div className={styles.tagStats}>
                                <span>{t("tags.articleCount", { value: tag.articleCount ?? 0 })}</span>
                                <span>{t("tags.createdOn", { value: tag.createTime ?? "" })}</span>
                            </div>
                            <div className={styles.tagActions}>
                                <button className={styles.actionButton} onClick={() => handleEditTag(tag)}>
                                    <FaEdit />
                                </button>
                                <button className={styles.actionButton} onClick={() => handleDeleteTag(tag)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 标签模态框 */}
            {showTagModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{editingTag ? t("tags.editLabel") : t("tags.createLabel")}</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => {
                                    setShowTagModal(false);
                                    setEditingTag(null);
                                    setTagForm({ name: "", description: "", color: "#61dafb" });
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>{t("tags.nameLabel")}</label>
                                <input
                                    type="text"
                                    value={tagForm.name}
                                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                                    placeholder={t("tags.namePlaceholder")}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t("tags.descLabel")}</label>
                                <textarea
                                    value={tagForm.description}
                                    onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                                    placeholder={t("tags.descPlaceholder")}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t("tags.colorLabel")}</label>
                                <div className={styles.colorPicker}>
                                    <input
                                        type="color"
                                        value={tagForm.color}
                                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                                    />
                                    <span>{tagForm.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => {
                                    setShowTagModal(false);
                                    setEditingTag(null);
                                    setTagForm({ name: "", description: "", color: "#61dafb" });
                                }}
                            >
                                {t("tags.cancel")}
                            </button>
                            <button className={styles.confirmButton} onClick={handleSaveTag} disabled={savingTag}>
                                {savingTag ? t("tags.saving") : editingTag ? t("tags.update") : t("tags.create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTagsTab;

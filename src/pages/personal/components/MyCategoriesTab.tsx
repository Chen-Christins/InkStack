import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaFolderOpen, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Loading from "@/components/loading/Loading";
import CustomSelect from "@/components/customSelect/CustomSelect";
import { confirm } from "@/components/confirm/Confirm";
import { message } from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import CategoryService from "@/services/CategoryService.ts";
import type { SelectOption } from "@/types";
import { formatToChinaTime } from "@/utils/Utils.ts";
import styles from "../PersonalCenter.module.css";

interface PersonalCategory {
    id: string | number;
    name: string;
    description: string;
    color: string;
    parentId: string | number | null;
    status: number;
    articleCount: number;
    createTime: string;
}

const MyCategoriesTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const { user } = useAuth();
    const userId = user?.id;
    const [categories, setCategories] = useState<PersonalCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<PersonalCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
        color: "#4361ee",
        parentId: "",
    });
    const [savingCategory, setSavingCategory] = useState(false);

    useEffect(() => {
        const fetchPersonalCategories = async () => {
            setCategoriesLoading(true);
            if (!userId) {
                setCategories([]);
                setCategoriesLoading(false);
                return;
            }

            try {
                const res = await CategoryService.queryMyCategory();
                const mapped = (res?.list || []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || t("categories.unknownDescription"),
                    color: item.color || "#4361ee",
                    parentId: item.parent_id || null,
                    status: item.status ?? 1,
                    articleCount: item.article_count || 0,
                    createTime: item.create_time ? formatToChinaTime(item.create_time) : t("categories.unknownTime"),
                }));
                setCategories(mapped);
            } catch (err) {
                console.error("获取个人分类失败:", err);
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchPersonalCategories();
    }, [userId]);

    const parentOptions: SelectOption[] = [
        { id: "", name: t("categories.parentNone"), color: "#6c757d" },
        ...categories
            .filter((cat) => !cat.parentId && String(cat.id) !== String(editingCategory?.id ?? ""))
            .map((cat) => ({
                id: String(cat.id),
                name: cat.name,
                color: cat.color,
            })),
    ];

    const getParentName = (category: PersonalCategory) => {
        if (!category.parentId) {
            return "";
        }
        return categories.find((item) => item.id === category.parentId)?.name || "";
    };

    const resetForm = () => {
        setEditingCategory(null);
        setCategoryForm({ name: "", description: "", color: "#4361ee", parentId: "" });
    };

    const closeModal = () => {
        setShowCategoryModal(false);
        resetForm();
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            message.error(t("categories.nameRequired"));
            return;
        }

        setSavingCategory(true);
        try {
            if (editingCategory) {
                const res = await CategoryService.createMyCategory({
                    id: editingCategory.id,
                    name: categoryForm.name.trim(),
                    url: categoryForm.name.trim(),
                    icon: "📁",
                    color: categoryForm.color,
                    description: categoryForm.description,
                    parent_id: categoryForm.parentId,
                    status: editingCategory.status,
                });

                setCategories((prev) =>
                    prev.map((category) =>
                        category.id === editingCategory.id
                            ? {
                                  ...category,
                                  name: res.name,
                                  description: categoryForm.description || t("categories.unknownDescription"),
                                  color: res.color || categoryForm.color,
                                  parentId: res.parent_id || null,
                              }
                            : category,
                    ),
                );
            } else {
                const res = await CategoryService.createMyCategory({
                    name: categoryForm.name.trim(),
                    url: categoryForm.name.trim(),
                    icon: "📁",
                    color: categoryForm.color,
                    description: categoryForm.description,
                    parent_id: categoryForm.parentId,
                    status: 1,
                });

                const newCategory: PersonalCategory = {
                    id: res.id,
                    name: res.name,
                    description: categoryForm.description || t("categories.unknownDescription"),
                    color: res.color || categoryForm.color,
                    parentId: res.parent_id || null,
                    status: res.status ?? 1,
                    articleCount: 0,
                    createTime: new Date().toISOString().split("T")[0],
                };
                setCategories((prev) => {
                    if (prev.some((item) => item.id === newCategory.id)) {
                        return prev.map((item) => (item.id === newCategory.id ? newCategory : item));
                    }
                    return [...prev, newCategory];
                });
            }

            closeModal();
        } catch (err) {
            console.error("保存分类失败:", err);
            message.error(t("categories.message.saveFailed"));
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (category: PersonalCategory) => {
        const confirmed = await confirm({
            title: t("categories.deleteConfirmTitle"),
            content: t("categories.deleteConfirmContent", { name: category.name }),
            confirmText: t("categories.delete"),
            cancelText: t("categories.cancel"),
        });

        if (confirmed) {
            try {
                await CategoryService.deleteMyCategory({ ids: String(category.id) });
                setCategories((prev) => prev.filter((item) => item.id !== category.id));
            } catch (err) {
                console.error("删除分类失败:", err);
                message.error(t("categories.message.deleteFailed"));
            }
        }
    };

    const handleEditCategory = (category: PersonalCategory) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description === t("categories.unknownDescription") ? "" : category.description,
            color: category.color,
            parentId: category.parentId ? String(category.parentId) : "",
        });
        setShowCategoryModal(true);
    };

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("categories.title")}</h2>
                <button
                    className={styles.addButton}
                    onClick={() => {
                        resetForm();
                        setShowCategoryModal(true);
                    }}
                >
                    <FaPlus />
                    {t("categories.createCategory")}
                </button>
            </div>

            {categoriesLoading ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <Loading size="small" text={t("categories.loading")} />
                </div>
            ) : categories.length === 0 ? (
                <div className={styles.emptyState}>
                    <FaFolderOpen className={styles.emptyIcon} />
                    <h3>{t("categories.emptyTitle")}</h3>
                    <p>{t("categories.emptyHint")}</p>
                </div>
            ) : (
                <div className={styles.tagsGrid}>
                    {categories.map((category) => (
                        <div key={category.id} className={styles.tagCard}>
                            <div className={styles.tagHeader}>
                                <div className={styles.tagColor} style={{ backgroundColor: category.color }}></div>
                                <h3>{category.name}</h3>
                            </div>
                            <p className={styles.tagDescription}>{category.description}</p>
                            <div className={styles.tagStats}>
                                <span>{t("categories.articleCount", { value: category.articleCount })}</span>
                                <span>{t("categories.createdOn", { value: category.createTime })}</span>
                                {getParentName(category) && (
                                    <span>{t("categories.parentValue", { value: getParentName(category) })}</span>
                                )}
                            </div>
                            <div className={styles.tagActions}>
                                <button className={styles.actionButton} onClick={() => handleEditCategory(category)}>
                                    <FaEdit />
                                </button>
                                <button className={styles.actionButton} onClick={() => handleDeleteCategory(category)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCategoryModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{editingCategory ? t("categories.editTitle") : t("categories.createCategory")}</h3>
                            <button className={styles.closeButton} onClick={closeModal}>
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>{t("categories.nameLabel")}</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder={t("categories.namePlaceholder")}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t("categories.descLabel")}</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    placeholder={t("categories.descPlaceholder")}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t("categories.parentLabel")}</label>
                                <CustomSelect
                                    name={t("categories.parentLabel")}
                                    options={parentOptions}
                                    value={parentOptions.find((option) => option.id === categoryForm.parentId) || null}
                                    onChange={(option) => setCategoryForm({ ...categoryForm, parentId: String(option?.id || "") })}
                                    hideBadge={true}
                                    placeholder={t("categories.parentPlaceholder")}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t("categories.colorLabel")}</label>
                                <div className={styles.colorPicker}>
                                    <input
                                        type="color"
                                        value={categoryForm.color}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    />
                                    <span>{categoryForm.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelButton} onClick={closeModal}>
                                {t("categories.cancel")}
                            </button>
                            <button className={styles.confirmButton} onClick={handleSaveCategory} disabled={savingCategory}>
                                {savingCategory
                                    ? t("categories.saving")
                                    : editingCategory
                                      ? t("categories.update")
                                      : t("categories.create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCategoriesTab;

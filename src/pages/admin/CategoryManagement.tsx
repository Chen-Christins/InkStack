import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaTags, FaPlus, FaEdit, FaTrash, FaFilter, FaEye, FaChartBar, FaCheckCircle, FaTimes, FaLayerGroup } from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types";
import styles from "./CategoryManagement.module.css";
import CategoryService from "@/services/CategoryService.ts";
import { formatDateTime } from "@/utils/Utils.ts";

interface Category {
    id: string | number;
    name: string;
    slug: string;
    description: string;
    color: string;
    icon?: string;
    parentId?: string | number;
    articleCount: number;
    views: number;
    createdAt: string;
    updatedAt: string;
    status: "active" | "inactive";
    children?: Category[];
    level: number;
}

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    parentId: string;
    status: "active" | "inactive";
}

interface CategoryStats {
    totalCategories: number;
    activeCategories: number;
    totalArticles: number;
    totalViews: number;
}

interface FilterOptions {
    search: string;
    status: string;
    sortBy: "name" | "articleCount" | "views" | "createdAt";
    sortOrder: "asc" | "desc";
}

const CategoryManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const iconMap: Record<string, string> = {
        "": t("categories.icons.default"),
        "💻": t("categories.icons.tech"),
        "🌟": t("categories.icons.life"),
        "✈️": t("categories.icons.travel"),
        "🍔": t("categories.icons.food"),
        "🎨": t("categories.icons.design"),
        "🎵": t("categories.icons.music"),
        "⚽": t("categories.icons.sports"),
        "📚": t("categories.icons.reading"),
        "📷": t("categories.icons.photography"),
    };
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        status: "",
        sortBy: "name",
        sortOrder: "asc",
    });
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        slug: "",
        description: "",
        color: "#4361ee",
        icon: "",
        parentId: "",
        status: "active",
    });
    const [submitting, setSubmitting] = useState(false);

    const statusOptions: SelectOption[] = [
        { id: "", name: t("categories.status.all"), color: "#6c757d" },
        { id: "active", name: t("categories.status.active"), color: "#28a745" },
        { id: "inactive", name: t("categories.status.inactive"), color: "#dc3545" },
    ];

    const sortOptions: SelectOption[] = [
        { id: "name", name: t("categories.sort.name"), color: "#007bff" },
        { id: "articleCount", name: t("categories.sort.articleCount"), color: "#007bff" },
        { id: "views", name: t("categories.sort.views"), color: "#007bff" },
        { id: "createdAt", name: t("categories.sort.createdAt"), color: "#007bff" },
    ];

    const iconOptions: SelectOption[] = Object.entries(iconMap).map(([value, label]) => ({
        id: value,
        name: value ? `${label} ${value}` : label,
        color: "#007bff",
    }));

    const getParentCategoryOptions = (): SelectOption[] => {
        const options: SelectOption[] = [{ id: "", name: t("categories.parent.none"), color: "#6c757d" }];
        const activeCategories = categories.filter((cat) => cat.level === 0 && cat.status === "active");
        options.push(
            ...activeCategories.map((cat) => ({
                id: cat.id.toString(),
                name: cat.name,
                color: "#17a2b8",
            })),
        );
        return options;
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await CategoryService.queryCategory();
            const categoryList = response.list || [];

            const mappedCategories: Category[] = categoryList.map((item: any) => ({
                id: item.id,
                name: item.name,
                slug: item.url,
                description: item.description || "",
                color: item.color,
                icon: item.icon,
                parentId: item.parent_id,
                articleCount: item.article_count || 0,
                views: item.view_count || 0,
                createdAt: item.create_time ? formatDateTime(item.create_time) : "-",
                updatedAt: item.update_time ? formatDateTime(item.update_time) : "-",
                status: item.status === 1 ? "active" : "inactive",
                level: item.parent_id ? 1 : 0,
                children: [],
            }));

            setCategories(mappedCategories);
        } catch (error) {
            console.error("加载分类失败:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters((prev) => ({ ...prev, [field]: selectedOption?.id || "" }));
        };
    };

    const clearFilters = () => {
        setFilters({ search: "", status: "", sortBy: "name", sortOrder: "asc" });
    };

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description,
                color: category.color,
                icon: category.icon || "",
                parentId: category.parentId?.toString() || "",
                status: category.status,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                slug: "",
                description: "",
                color: "#4361ee",
                icon: "",
                parentId: "",
                status: "active",
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            message.error(t("categories.request.nameRequired"));
            return;
        }
        if (!formData.slug.trim()) {
            message.error(t("categories.request.slugRequired"));
            return;
        }
        setSubmitting(true);
        try {
            const response = await CategoryService.createCategory({
                id: editingCategory ? editingCategory.id : undefined,
                name: formData.name,
                url: formData.slug,
                color: formData.color,
                icon: formData.icon,
                description: formData.description,
                parent_id: formData.parentId,
                status: formData.status === "active" ? 1 : 0,
            });

            if (editingCategory) {
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat.id === editingCategory.id ? { ...cat, ...formData, updatedAt: formatDateTime(new Date()) } : cat,
                    ),
                );
                message.success(t("categories.request.updated"));
            } else {
                const newCategory: Category = {
                    id: response.id,
                    name: response.name,
                    slug: formData.slug,
                    description: formData.description,
                    color: response.color,
                    icon: formData.icon,
                    parentId: response.parent_id,
                    articleCount: 0,
                    views: 0,
                    createdAt: formatDateTime(new Date()),
                    updatedAt: formatDateTime(new Date()),
                    status: formData.status,
                    level: formData.parentId ? 1 : 0,
                };
                setCategories((prev) => [...prev, newCategory]);
                message.success(t("categories.request.created"));
            }

            closeModal();
        } catch (error) {
            message.error(t("categories.request.saveFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCategory = async (category: Category) => {
        const isConfirmed = await confirm({
            title: t("categories.deleteConfirm.title"),
            content: (
                <div>
                    <p>
                        {t("categories.deleteConfirm.contentBefore")}
                        <strong>{category.name}</strong>
                        {t("categories.deleteConfirm.contentAfter")}
                    </p>
                    <p style={{ color: "var(--error)" }}>{t("categories.deleteConfirm.warning")}</p>
                </div>
            ),
            confirmText: t("categories.deleteConfirm.confirmText"),
            cancelText: t("categories.deleteConfirm.cancelText"),
        });
        if (!isConfirmed) {
            return;
        }

        try {
            await CategoryService.deleteCategory({ ids: String(category.id) });
            setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
            message.success(t("categories.request.deleted"));
        } catch (error) {
            message.error(t("categories.request.deleteFailed"));
        }
    };

    const toggleCategoryStatus = async (category: Category) => {
        const newStatus = category.status === "active" ? "inactive" : "active";
        try {
            await CategoryService.createCategory({
                name: category.name,
                url: category.slug,
                color: category.color,
                icon: category.icon || "",
                description: category.description,
                parent_id: category.parentId,
                status: newStatus === "active" ? 1 : 0,
            });
            setCategories((prev) =>
                prev.map((cat) =>
                    cat.id === category.id ? { ...cat, status: newStatus, updatedAt: formatDateTime(new Date()) } : cat,
                ),
            );
        } catch (error) {
            message.error(t("categories.request.toggleFailed"));
        }
    };

    const stats: CategoryStats = {
        totalCategories: categories.length,
        activeCategories: categories.filter((cat) => cat.status === "active").length,
        totalArticles: categories.reduce((sum, cat) => sum + cat.articleCount, 0),
        totalViews: categories.reduce((sum, cat) => sum + cat.views, 0),
    };

    const filteredCategories = categories
        .filter((cat) => {
            if (
                filters.search &&
                !cat.name.toLowerCase().includes(filters.search.toLowerCase()) &&
                !cat.description.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }
            if (filters.status && cat.status !== filters.status) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (filters.sortBy === "name") {
                comparison = a.name.localeCompare(b.name);
            } else {
                comparison = (a[filters.sortBy] || 0) > (b[filters.sortBy] || 0) ? 1 : -1;
            }
            return filters.sortOrder === "asc" ? comparison : -comparison;
        });

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return "-";
        }
        return formatDateTime(dateString);
    };

    if (loading) {
        return (
            <div className={styles.categoryManagement}>
                <Loading text={t("categories.loading")} size="large" />
            </div>
        );
    }

    return (
        <div className={styles.categoryManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("categories.title")}</h1>
                    <p className={styles.pageDescription}>{t("categories.description")}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal()}>
                        <FaPlus />
                        {t("categories.addCategory")}
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaLayerGroup />
                    </div>
                    <div className={styles.statValue}>{stats.totalCategories}</div>
                    <div className={styles.statLabel}>{t("categories.stats.total")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statValue}>{stats.activeCategories}</div>
                    <div className={styles.statLabel}>{t("categories.stats.active")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaChartBar />
                    </div>
                    <div className={styles.statValue}>{stats.totalArticles}</div>
                    <div className={styles.statLabel}>{t("categories.stats.articles")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaEye />
                    </div>
                    <div className={styles.statValue}>{stats.totalViews.toLocaleString()}</div>
                    <div className={styles.statLabel}>{t("categories.stats.views")}</div>
                </div>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        {t("categories.filter.title")}
                    </h3>
                    <div className={styles.filterActions}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                            {t("categories.filter.clear")}
                        </button>
                    </div>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("categories.filter.searchLabel")}</label>
                        <Input
                            placeholder={t("categories.filter.searchPlaceholder")}
                            value={filters.search}
                            onChange={(value) => handleFilterChange("search", value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("categories.filter.statusLabel")}</label>
                        <CustomSelect
                            name={t("categories.filter.statusLabel")}
                            options={statusOptions}
                            value={statusOptions.find((option) => option.id === filters.status) || null}
                            onChange={handleSelectChange("status")}
                            placeholder={t("categories.filter.statusPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("categories.filter.sortLabel")}</label>
                        <CustomSelect
                            name={t("categories.filter.sortLabel")}
                            options={sortOptions}
                            value={sortOptions.find((option) => option.id === filters.sortBy) || null}
                            onChange={handleSelectChange("sortBy")}
                            placeholder={t("categories.filter.sortPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("categories.filter.orderLabel")}</label>
                        <button
                            className={`${styles.btn} ${styles.btnOutline}`}
                            onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }))}
                            style={{ minHeight: "46px", height: "50px", justifyContent: "center" }}
                        >
                            {filters.sortOrder === "asc" ? t("categories.filter.ascending") : t("categories.filter.descending")}
                        </button>
                    </div>
                </div>
            </div>

            {/* 分类表格 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>{t("categories.table.title")}</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                            {t("categories.table.total", { total: filteredCategories.length })}
                        </span>
                    </div>
                </div>
                <table className={styles.categoriesTable}>
                    <thead>
                        <tr>
                            <th>{t("categories.table.headers.info")}</th>
                            <th>{t("categories.table.headers.parent")}</th>
                            <th>{t("categories.table.headers.status")}</th>
                            <th>{t("categories.table.headers.stats")}</th>
                            <th>{t("categories.table.headers.createdAt")}</th>
                            <th>{t("categories.table.headers.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td>
                                        <div className={styles.categoryInfo}>
                                            <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                                                {category.icon || <FaTags />}
                                            </div>
                                            <div className={styles.categoryDetails}>
                                                <div className={styles.categoryName}>{category.name}</div>
                                                <div className={styles.categorySlug}>{category.slug}</div>
                                                {category.description && (
                                                    <div className={styles.categoryDescription}>{category.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {category.parentId ? (
                                            <span className={styles.parentBadge}>
                                                {categories.find((c) => c.id === category.parentId)?.name || "-"}
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
                                                {t("categories.parent.top")}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[category.status]}`}>
                                            <span className={styles.statusIndicator}></span>
                                            {category.status === "active"
                                                ? t("categories.status.active")
                                                : t("categories.status.inactive")}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.statsInfo}>
                                            <span>
                                                <FaTags /> {t("categories.table.articles", { value: category.articleCount })}
                                            </span>
                                            <span>
                                                <FaEye /> {category.views.toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{formatDate(category.createdAt)}</td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={t("categories.table.edit")}
                                                onClick={() => openModal(category)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={
                                                    category.status === "active"
                                                        ? t("categories.table.disable")
                                                        : t("categories.table.enable")
                                                }
                                                onClick={() => toggleCategoryStatus(category)}
                                            >
                                                {category.status === "active" ? <FaTimes /> : <FaCheckCircle />}
                                            </button>
                                            <Button
                                                color="error"
                                                variant="ghost"
                                                size="small"
                                                onClick={() => deleteCategory(category)}
                                                className={styles.actionButton}
                                                aria-label={t("categories.table.delete")}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {t("categories.table.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 新增/编辑模态框 */}
            <Modal
                visible={showModal}
                title={editingCategory ? t("categories.modal.editTitle") : t("categories.modal.createTitle")}
                onClose={closeModal}
                width={600}
                footer={
                    <>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeModal} disabled={submitting}>
                            {t("categories.modal.cancel")}
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveCategory} disabled={submitting}>
                            {submitting
                                ? t("categories.modal.saving")
                                : editingCategory
                                  ? t("categories.modal.save")
                                  : t("categories.modal.create")}
                        </button>
                    </>
                }
            >
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("categories.modal.nameLabel")}</label>
                    <Input
                        placeholder={t("categories.modal.namePlaceholder")}
                        value={formData.name}
                        onChange={(value) => {
                            setFormData((prev) => ({ ...prev, name: value, slug: value ? generateSlug(value) : "" }));
                        }}
                        className={styles.formInput}
                        size="large"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("categories.modal.slugLabel")}</label>
                    <Input
                        placeholder={t("categories.modal.slugPlaceholder")}
                        value={formData.slug}
                        onChange={(value) => setFormData((prev) => ({ ...prev, slug: value }))}
                        className={styles.formInput}
                        size="large"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("categories.modal.descriptionLabel")}</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        className={styles.formTextarea}
                        placeholder={t("categories.modal.descriptionPlaceholder")}
                        rows={3}
                    />
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("categories.modal.colorLabel")}</label>
                        <div className={styles.colorPickerContainer}>
                            <input
                                type="color"
                                className={styles.colorInput}
                                value={formData.color}
                                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                            />
                            <div className={styles.colorPreview} style={{ backgroundColor: formData.color }} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("categories.modal.iconLabel")}</label>
                        <CustomSelect
                            name={t("categories.modal.iconLabel")}
                            value={iconOptions.find((o) => o.id === formData.icon) || null}
                            onChange={(option) => setFormData((prev) => ({ ...prev, icon: String(option?.id || "") }))}
                            options={iconOptions}
                            hideBadge={true}
                            placeholder={t("categories.modal.iconPlaceholder")}
                        />
                    </div>
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("categories.modal.parentLabel")}</label>
                        <CustomSelect
                            name={t("categories.modal.parentLabel")}
                            value={getParentCategoryOptions().find((option) => option.id === formData.parentId) || null}
                            onChange={(option) => setFormData((prev) => ({ ...prev, parentId: String(option?.id || "") }))}
                            options={getParentCategoryOptions()}
                            hideBadge={true}
                            placeholder={t("categories.modal.parentPlaceholder")}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("categories.modal.statusLabel")}</label>
                        <CustomSelect
                            name={t("categories.modal.statusLabel")}
                            value={statusOptions.find((option) => option.id === formData.status) || null}
                            onChange={(option) =>
                                setFormData((prev) => ({ ...prev, status: (option?.id as "active" | "inactive") || "active" }))
                            }
                            options={statusOptions.slice(1)}
                            hideBadge={true}
                            placeholder={t("categories.modal.statusPlaceholder")}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CategoryManagement;

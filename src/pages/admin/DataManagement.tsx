import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    FaDatabase,
    FaDownload,
    FaTrash,
    FaFilter,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaFileExport,
    FaFileImport,
    FaHdd,
    FaCloudUploadAlt,
    FaChartLine,
    FaCalendar,
    FaUser,
    FaFileAlt,
    FaComment,
    FaTags,
    FaArchive,
    FaBroom,
    FaCheckCircle,
    FaSync,
    FaSave,
    FaServer,
} from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import { message } from "@/components/message/Message";
import { formatToChinaTime } from "@/utils/Utils.ts";
import DataService from "@/services/DataService.ts";
import http from "@/infra/Http.ts";
import type { BackupRecord, DataStats, ExportRecord } from "@/services/DataService.ts";
import type { SelectOption } from "@/types";
import type { BackupStatus } from "@/types/Enums.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import styles from "./DataManagement.module.css";

// 筛选条件接口
interface FilterOptions {
    search: string;
    type: string;
    status: string;
    dateRange: string;
}

const DataManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const enums = useEnumLabels();

    // 状态管理
    const [activeTab, setActiveTab] = useState<"overview" | "backups" | "exports">("overview");
    const [backups, setBackups] = useState<BackupRecord[]>([]);
    const [exports, setExports] = useState<ExportRecord[]>([]);
    const [stats, setStats] = useState<DataStats>({
        totalSize: 0,
        usedSize: 0,
        availableSize: 0,
        totalRecords: 0,
        articles: 0,
        users: 0,
        comments: 0,
        categories: 0,
        tags: 0,
        backups: 0,
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        type: "",
        status: "",
        dateRange: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [loadingExports, setLoadingExports] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const itemsPerPage = 15;

    // 加载数据概览
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await DataService.getStats();
                setStats(data);
            } catch (err) {
                console.error("加载数据概览失败:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 切换 tab 时懒加载
    useEffect(() => {
        if (activeTab === "overview") {
            const fetchStats = async () => {
                try {
                    const data = await DataService.getStats();
                    setStats(data);
                } catch (err) {
                    console.error("加载数据概览失败:", err);
                }
            };
            fetchStats();
        }
        if (activeTab === "backups") {
            const fetchBackups = async () => {
                setLoadingBackups(true);
                try {
                    const res = await DataService.getBackups({});
                    setBackups(res.list);
                } catch (err) {
                    console.error("加载备份列表失败:", err);
                } finally {
                    setLoadingBackups(false);
                }
            };
            fetchBackups();
        }
        if (activeTab === "exports") {
            const fetchExports = async () => {
                setLoadingExports(true);
                try {
                    const res = await DataService.getExports({});
                    setExports(res.list);
                } catch (err) {
                    console.error("加载导出列表失败:", err);
                } finally {
                    setLoadingExports(false);
                }
            };
            fetchExports();
        }
        setCurrentPage(1);
    }, [activeTab]);

    // 筛选数据
    const filteredBackups = useMemo(() => {
        return backups.filter((backup) => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!backup.name.toLowerCase().includes(searchTerm) && !backup.description.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            if (filters.type && backup.type !== filters.type) {
                return false;
            }
            if (filters.status && backup.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [backups, filters]);

    const filteredExports = useMemo(() => {
        return exports.filter((exportItem) => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!exportItem.name.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            if (filters.type && exportItem.type !== filters.type) {
                return false;
            }
            if (filters.status && exportItem.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [exports, filters]);

    // 分页计算
    const currentData = activeTab === "backups" ? filteredBackups : filteredExports;
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = currentData.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeTab]);

    // 筛选选项数据
    const backupTypeOptions: SelectOption[] = [
        { id: "", name: t("data.type.all"), color: "#6c757d" },
        { id: "full", name: t("data.type.fullBackup"), color: "#007bff" },
        { id: "incremental", name: t("data.type.incrementalBackup"), color: "#17a2b8" },
        { id: "manual", name: t("data.type.manualBackup"), color: "#6c757d" },
    ];

    const exportTypeOptions: SelectOption[] = [
        { id: "", name: t("data.type.all"), color: "#6c757d" },
        { id: "articles", name: t("data.type.articles"), color: "#007bff" },
        { id: "users", name: t("data.type.users"), color: "#17a2b8" },
        { id: "comments", name: t("data.type.comments"), color: "#28a745" },
        { id: "full", name: t("data.type.fullData"), color: "#007bff" },
    ];

    const statusOptions: SelectOption[] = [
        { id: "", name: t("data.statusFilter.all"), color: "#6c757d" },
        { id: "completed", name: t("data.statusFilter.completed"), color: "#28a745" },
        { id: "processing", name: t("data.statusFilter.processing"), color: "#ffc107" },
        { id: "failed", name: t("data.statusFilter.failed"), color: "#dc3545" },
    ];

    // 处理选择变化
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters((prev) => ({
                ...prev,
                [field]: selectedOption?.id || "",
            }));
        };
    };

    // 处理搜索变化
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 清除筛选
    const clearFilters = () => {
        setFilters({
            search: "",
            type: "",
            status: "",
            dateRange: "",
        });
    };

    // 创建备份
    const createBackup = async (type: "full" | "incremental") => {
        await confirm({
            title: t("data.confirm.createBackup.title"),
            content: (
                <div>
                    <p>
                        {type === "full"
                            ? t("data.confirm.createBackup.contentFull")
                            : t("data.confirm.createBackup.contentIncremental")}
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                        {type === "full" ? t("data.confirm.createBackup.noteFull") : t("data.confirm.createBackup.noteIncremental")}
                    </p>
                </div>
            ),
            confirmText: t("data.confirm.createBackup.confirm"),
            cancelText: t("data.confirm.cancel"),
            onConfirm: async () => {
                try {
                    const newBackup = await DataService.createBackup(type);
                    setBackups((prev) => [newBackup, ...prev]);
                    const stats = await DataService.getStats();
                    setStats(stats);
                } catch (err) {
                    console.error("创建备份失败:", err);
                }
            },
        });
    };

    // 导出数据
    const exportData = async (type: "articles" | "users" | "comments" | "full") => {
        await confirm({
            title: t("data.confirm.exportData.title"),
            content: (
                <div>
                    <p>
                        {type === "articles"
                            ? t("data.confirm.exportData.contentArticles")
                            : type === "users"
                              ? t("data.confirm.exportData.contentUsers")
                              : type === "comments"
                                ? t("data.confirm.exportData.contentComments")
                                : t("data.confirm.exportData.contentFull")}
                    </p>
                </div>
            ),
            confirmText: t("data.confirm.exportData.confirm"),
            cancelText: t("data.confirm.cancel"),
            onConfirm: async () => {
                try {
                    const newExport = await DataService.createExport(type);
                    setExports((prev) => [newExport, ...prev]);
                    const stats = await DataService.getStats();
                    setStats(stats);
                } catch (err) {
                    console.error("导出失败:", err);
                }
            },
        });
    };

    // 下载文件
    const downloadFile = async (item: BackupRecord | ExportRecord) => {
        const isBackup = "fileCount" in item;
        const url = isBackup ? `/admin/database/backups/${item.id}/download` : `/admin/database/exports/${item.id}/download`;
        try {
            await http.download(url, (item as BackupRecord).name || (item as ExportRecord).name);
        } catch (err: any) {
            message.error(err?.message || t("data.messages.downloadFailed"));
        }
    };

    // 删除记录
    const deleteRecord = async (item: BackupRecord | ExportRecord) => {
        await confirm({
            title: t("data.confirm.delete.title"),
            content: (
                <div>
                    <p>
                        {t("data.confirm.delete.content", {
                            name: (item as BackupRecord).name || (item as ExportRecord).name,
                        })}
                    </p>
                    <p style={{ color: "var(--error-color)" }}>{t("data.confirm.delete.warning")}</p>
                </div>
            ),
            confirmText: t("data.confirm.delete.confirm"),
            cancelText: t("data.confirm.cancel"),
            onConfirm: async () => {
                try {
                    if ("fileCount" in item) {
                        await DataService.deleteBackup(item.id);
                        setBackups((prev) => prev.filter((backup) => backup.id !== item.id));
                    } else {
                        await DataService.deleteExport(item.id);
                        setExports((prev) => prev.filter((exportItem) => exportItem.id !== item.id));
                    }
                    const stats = await DataService.getStats();
                    setStats(stats);
                } catch (err) {
                    console.error("删除失败:", err);
                }
            },
        });
    };

    // 清理数据
    const cleanupData = async () => {
        await confirm({
            title: t("data.confirm.cleanup.title"),
            content: (
                <div>
                    <p>{t("data.confirm.cleanup.content")}</p>
                    <p style={{ color: "var(--warning-color)" }}>{t("data.confirm.cleanup.warning")}</p>
                </div>
            ),
            confirmText: t("data.confirm.cleanup.confirm"),
            cancelText: t("data.confirm.cancel"),
            onConfirm: async () => {
                try {
                    await DataService.cleanup();
                    const stats = await DataService.getStats();
                    setStats(stats);
                } catch (err) {
                    console.error("清理数据失败:", err);
                }
            },
        });
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) {
            return "-";
        }
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
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

    if (initialLoading) {
        return (
            <div className={styles.dataManagement}>
                <Loading text={t("data.loading")} size="large" />
            </div>
        );
    }

    return (
        <div className={styles.dataManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("data.title")}</h1>
                    <p className={styles.pageDescription}>{t("data.description")}</p>
                </div>
            </div>

            {/* 标签页切换 */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === "overview" ? styles.active : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <FaChartLine />
                    {t("data.tabs.overview")}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === "backups" ? styles.active : ""}`}
                    onClick={() => setActiveTab("backups")}
                >
                    <FaArchive />
                    {t("data.tabs.backups")}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === "exports" ? styles.active : ""}`}
                    onClick={() => setActiveTab("exports")}
                >
                    <FaFileExport />
                    {t("data.tabs.exports")}
                </button>
            </div>

            {activeTab === "overview" && (
                <>
                    {/* 存储统计 */}
                    <div className={styles.storageSection}>
                        <div className={styles.storageHeader}>
                            <h3 className={styles.sectionTitle}>
                                <FaHdd />
                                {t("data.storage.title")}
                            </h3>
                            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={cleanupData}>
                                <FaBroom />
                                {t("data.storage.cleanup")}
                            </button>
                        </div>
                        <div className={styles.storageCards}>
                            <div className={styles.storageCard}>
                                <div className={styles.storageIcon}>
                                    <FaServer />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>{t("data.storage.total")}</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.totalSize)}</div>
                                </div>
                            </div>
                            <div className={styles.storageCard}>
                                <div className={`${styles.storageIcon} ${styles.used}`}>
                                    <FaDatabase />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>{t("data.storage.used")}</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.usedSize)}</div>
                                </div>
                            </div>
                            <div className={styles.storageCard}>
                                <div className={`${styles.storageIcon} ${styles.available}`}>
                                    <FaHdd />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>{t("data.storage.available")}</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.availableSize)}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.storageBar}>
                            <div
                                className={styles.storageProgress}
                                style={{
                                    width: `${(stats.usedSize / stats.totalSize) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* 数据统计 */}
                    <div className={styles.statsSection}>
                        <h3 className={styles.sectionTitle}>
                            <FaChartLine />
                            {t("data.stats.title")}
                        </h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.primary}`}>
                                    <FaFileAlt />
                                </div>
                                <div className={styles.statValue}>{stats.articles}</div>
                                <div className={styles.statLabel}>{t("data.stats.articles")}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.success}`}>
                                    <FaUser />
                                </div>
                                <div className={styles.statValue}>{stats.users}</div>
                                <div className={styles.statLabel}>{t("data.stats.users")}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.info}`}>
                                    <FaComment />
                                </div>
                                <div className={styles.statValue}>{stats.comments}</div>
                                <div className={styles.statLabel}>{t("data.stats.comments")}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.warning}`}>
                                    <FaTags />
                                </div>
                                <div className={styles.statValue}>{stats.tags}</div>
                                <div className={styles.statLabel}>{t("data.stats.tags")}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.secondary}`}>
                                    <FaArchive />
                                </div>
                                <div className={styles.statValue}>{stats.backups}</div>
                                <div className={styles.statLabel}>{t("data.stats.backups")}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.error}`}>
                                    <FaDatabase />
                                </div>
                                <div className={styles.statValue}>{stats.totalRecords}</div>
                                <div className={styles.statLabel}>{t("data.stats.totalRecords")}</div>
                            </div>
                        </div>
                    </div>

                    {/* 快速操作 */}
                    <div className={styles.quickActions}>
                        <h3 className={styles.sectionTitle}>
                            <FaSync />
                            {t("data.quickActions.title")}
                        </h3>
                        <div className={styles.actionCards}>
                            <button className={styles.actionCard} onClick={() => createBackup("full")}>
                                <div className={styles.actionIcon}>
                                    <FaCloudUploadAlt />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{t("data.quickActions.fullBackup")}</div>
                                    <div className={styles.actionDescription}>{t("data.quickActions.fullBackupDesc")}</div>
                                </div>
                            </button>
                            <button className={styles.actionCard} onClick={() => createBackup("incremental")}>
                                <div className={styles.actionIcon}>
                                    <FaSave />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{t("data.quickActions.incrementalBackup")}</div>
                                    <div className={styles.actionDescription}>{t("data.quickActions.incrementalBackupDesc")}</div>
                                </div>
                            </button>
                            <button className={styles.actionCard} onClick={() => exportData("full")}>
                                <div className={styles.actionIcon}>
                                    <FaFileExport />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{t("data.quickActions.exportData")}</div>
                                    <div className={styles.actionDescription}>{t("data.quickActions.exportDataDesc")}</div>
                                </div>
                            </button>
                            <button className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <FaFileImport />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{t("data.quickActions.importData")}</div>
                                    <div className={styles.actionDescription}>{t("data.quickActions.importDataDesc")}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {(activeTab === "backups" || activeTab === "exports") && (
                <>
                    {/* 筛选区域 */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterHeader}>
                            <h3 className={styles.filterTitle}>
                                <FaFilter />
                                {t("data.filter.title")}
                            </h3>
                            <div className={styles.filterActions}>
                                <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                                    {t("data.filter.clear")}
                                </button>
                            </div>
                        </div>
                        <div className={styles.filterForm}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>
                                    {activeTab === "backups" ? t("data.filter.searchBackups") : t("data.filter.searchExports")}
                                </label>
                                <Input
                                    placeholder={
                                        activeTab === "backups"
                                            ? t("data.filter.searchBackupsPlaceholder")
                                            : t("data.filter.searchExportsPlaceholder")
                                    }
                                    value={filters.search}
                                    onChange={(value) => handleFilterChange("search", value)}
                                    allowClear={true}
                                    size="large"
                                    style={{ minHeight: "46px", height: "50px" }}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>
                                    {activeTab === "backups" ? t("data.filter.backupType") : t("data.filter.exportType")}
                                </label>
                                <CustomSelect
                                    name={t("data.filter.typeName")}
                                    options={activeTab === "backups" ? backupTypeOptions : exportTypeOptions}
                                    value={
                                        (activeTab === "backups"
                                            ? backupTypeOptions.find((option) => option.id === filters.type)
                                            : exportTypeOptions.find((option) => option.id === filters.type)) || null
                                    }
                                    onChange={handleSelectChange("type")}
                                    placeholder={t("data.filter.typePlaceholder")}
                                    className="adminCustomSelect"
                                    hideBadge={true}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>{t("data.filter.statusLabel")}</label>
                                <CustomSelect
                                    name={t("data.filter.statusName")}
                                    options={statusOptions}
                                    value={statusOptions.find((option) => option.id === filters.status) || null}
                                    onChange={handleSelectChange("status")}
                                    placeholder={t("data.filter.statusPlaceholder")}
                                    className="adminCustomSelect"
                                    hideBadge={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 数据表格 */}
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>
                                {activeTab === "backups" ? t("data.table.backupTitle") : t("data.table.exportTitle")}
                            </h3>
                            <div className={styles.tableActions}>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                                    onClick={() => (activeTab === "backups" ? createBackup("full") : exportData("full"))}
                                >
                                    <FaPlus />
                                    {activeTab === "backups" ? t("data.table.createBackup") : t("data.table.exportData")}
                                </button>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "var(--text-secondary)",
                                        marginLeft: "12px",
                                    }}
                                >
                                    {t("data.table.totalRecords", { total: currentData.length })}
                                </span>
                            </div>
                        </div>

                        {activeTab === "backups" ? (
                            loadingBackups ? (
                                <div style={{ padding: "60px 0" }}>
                                    <Loading text={t("data.table.loadingBackups")} size="large" />
                                </div>
                            ) : (
                                <table className={`${styles.recordsTable} ${styles.backupRecordsTable}`}>
                                    <thead>
                                        <tr>
                                            <th>{t("data.table.headers.backupInfo")}</th>
                                            <th>{t("data.table.headers.type")}</th>
                                            <th>{t("data.table.headers.size")}</th>
                                            <th>{t("data.table.headers.fileCount")}</th>
                                            <th>{t("data.table.headers.status")}</th>
                                            <th>{t("data.table.headers.createdAt")}</th>
                                            <th>{t("data.table.headers.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.length > 0 ? (
                                            currentItems.map((backup) => (
                                                <tr key={backup.id}>
                                                    <td>
                                                        <div className={styles.recordInfo}>
                                                            <div className={styles.recordIcon}>
                                                                <FaArchive />
                                                            </div>
                                                            <div className={styles.recordDetails}>
                                                                <div className={styles.recordName}>{backup.name}</div>
                                                                <div className={styles.recordMeta}>
                                                                    <span>
                                                                        <FaUser /> {backup.createdBy}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.recordDescription}>
                                                                    {(backup as BackupRecord).description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.typeBadge} ${styles[backup.type]}`}>
                                                            {backup.type === "full" && t("data.type.full")}
                                                            {backup.type === "incremental" && t("data.type.incremental")}
                                                            {backup.type === "manual" && t("data.type.manual")}
                                                        </span>
                                                    </td>
                                                    <td>{formatFileSize(backup.size)}</td>
                                                    <td>{(backup as BackupRecord).fileCount}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${styles[backup.status]}`}>
                                                            <span className={styles.statusIndicator}></span>
                                                            {enums.backupStatus[backup.status as BackupStatus] || backup.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={styles.timeInfo}>
                                                            <div>
                                                                <FaCalendar /> {formatToChinaTime(Number(backup.createdAt))}
                                                            </div>
                                                            {(backup as BackupRecord).completedAt ? (
                                                                <div>
                                                                    <FaCheckCircle />{" "}
                                                                    {formatToChinaTime(Number((backup as BackupRecord).completedAt))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.actionButtons}>
                                                            <button
                                                                className={`${styles.actionButton} ${styles.download}`}
                                                                title={t("data.table.downloadBackup")}
                                                                onClick={() => downloadFile(backup)}
                                                                disabled={backup.status !== "completed"}
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                            <button
                                                                className={`${styles.actionButton} ${styles.delete}`}
                                                                title={t("data.table.deleteRecord")}
                                                                onClick={() => deleteRecord(backup)}
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
                                                    {t("data.table.empty")}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )
                        ) : loadingExports ? (
                            <div style={{ padding: "60px 0" }}>
                                <Loading text={t("data.table.loadingExports")} size="large" />
                            </div>
                        ) : (
                            <table className={`${styles.recordsTable} ${styles.exportRecordsTable}`}>
                                <thead>
                                    <tr>
                                        <th>{t("data.table.headers.exportInfo")}</th>
                                        <th>{t("data.table.headers.type")}</th>
                                        <th>{t("data.table.headers.format")}</th>
                                        <th>{t("data.table.headers.size")}</th>
                                        <th>{t("data.table.headers.recordCount")}</th>
                                        <th>{t("data.table.headers.status")}</th>
                                        <th>{t("data.table.headers.createdAt")}</th>
                                        <th>{t("data.table.headers.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? (
                                        currentItems.map((exportItem) => (
                                            <tr key={exportItem.id}>
                                                <td>
                                                    <div className={styles.recordInfo}>
                                                        <div className={styles.recordIcon}>
                                                            <FaFileExport />
                                                        </div>
                                                        <div className={styles.recordDetails}>
                                                            <div className={styles.recordName}>{exportItem.name}</div>
                                                            <div className={styles.recordMeta}>
                                                                <span>
                                                                    <FaUser /> {exportItem.createdBy}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.typeBadge} ${styles[exportItem.type]}`}>
                                                        {exportItem.type === "articles" && t("data.type.article")}
                                                        {exportItem.type === "users" && t("data.type.user")}
                                                        {exportItem.type === "comments" && t("data.type.comment")}
                                                        {exportItem.type === "full" && t("data.type.full")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.formatBadge}>
                                                        {(exportItem as ExportRecord).format.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>{formatFileSize(exportItem.size)}</td>
                                                <td>{(exportItem as ExportRecord).recordCount}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[exportItem.status]}`}>
                                                        <span className={styles.statusIndicator}></span>
                                                        {enums.backupStatus[exportItem.status as BackupStatus] || exportItem.status}
                                                    </span>
                                                </td>
                                                <td>{formatToChinaTime(Number(exportItem.createdAt))}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.download}`}
                                                            title={t("data.table.downloadFile")}
                                                            onClick={() => downloadFile(exportItem)}
                                                            disabled={exportItem.status !== "completed"}
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.delete}`}
                                                            title={t("data.table.deleteRecord")}
                                                            onClick={() => deleteRecord(exportItem)}
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
                                                colSpan={8}
                                                style={{
                                                    textAlign: "center",
                                                    padding: "40px",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {t("data.table.empty")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* 分页 */}
                        {totalPages >= 1 && (
                            <div className={styles.paginationContainer}>
                                <div className={styles.paginationInfo}>
                                    {t("data.pagination.info", {
                                        start: startIndex + 1,
                                        end: Math.min(endIndex, currentData.length),
                                        total: currentData.length,
                                    })}
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
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
                </>
            )}
        </div>
    );
};

export default DataManagement;

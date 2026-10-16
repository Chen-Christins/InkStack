import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaFilter,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaChevronLeft,
    FaChevronRight,
    FaBuilding,
    FaCheckCircle,
    FaTimesCircle,
    FaEye,
    FaClipboardList,
} from "react-icons/fa";
import Input from "@/components/input/Input";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import Modal from "@/components/modal/Modal";
import CustomSelect from "@/components/customSelect/CustomSelect";
import styles from "./OrganizationManagement.module.css";
import OrganizationService, { type OrganizationStatsResponse, type ApplyItem } from "@/services/OrganizationService.ts";

interface Organization {
    id: string;
    name: string;
    type: string;
    status: "active" | "inactive";
    createdAt: string;
    description?: string;
    memberCount: number;
}

const OrganizationManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [formData, setFormData] = useState<Partial<Organization>>({
        name: "",
        type: "",
        status: "active",
        description: "",
    });
    const [previewOrg, setPreviewOrg] = useState<Organization | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    // 申请审核相关状态
    const [activeTab, setActiveTab] = useState<"orgs" | "applies">("orgs");
    const [applies, setApplies] = useState<ApplyItem[]>([]);
    const [appliesLoading, setAppliesLoading] = useState(false);
    const [appliesTotal, setAppliesTotal] = useState(0);
    const [appliesPage, setAppliesPage] = useState(1);
    const [appliesStatusFilter, setAppliesStatusFilter] = useState<number | undefined>(0); // 默认显示待审核
    const appliesPageSize = 10;

    // 统计数据
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
    });

    const fetchStats = async () => {
        try {
            const res: OrganizationStatsResponse = await OrganizationService.getAdminOrganizationStats();
            setStats({
                total: res.total_organizations,
                active: res.active_organizations,
                inactive: res.inactive_organizations,
            });
        } catch (error) {
            console.error("获取统计数据失败:", error);
        }
    };

    const STATUS_STR_MAP_NUMBER: Record<string, number> = {
        active: 1,
        inactive: 0,
    };
    const STATUS_NUMBER_MAP_STR: Record<number, "active" | "inactive"> = {
        1: "active",
        0: "inactive",
    };
    const pageSize = 10;

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const params: any = {
                page_num: currentPage,
                page_size: pageSize,
            };
            if (statusFilter !== "all") {
                params.status = STATUS_STR_MAP_NUMBER[statusFilter];
            }
            const res = await OrganizationService.getAdminOrganizations(params);
            const mappedList: Organization[] = (res.list || []).map(
                (item: { count: any; id: any; name: any; type: any; status: any; create_time: number; description: any }) => ({
                    id: String(item.id),
                    name: item.name,
                    type: item.type,
                    status: STATUS_NUMBER_MAP_STR[Number(item.status)] as "active" | "inactive",
                    createdAt: dayjs.unix(item.create_time).format("YYYY-MM-DD HH:mm:ss"),
                    description: item.description,
                    memberCount: item.count, // 如有成员数字段可填
                }),
            );
            setOrganizations(mappedList);
            setTotal(res.total);
        } catch (e) {
            message.error(t("organizations.messages.fetchOrgsFailed"));
        } finally {
            setLoading(false);
        }
    };

    const fetchApplies = async () => {
        setAppliesLoading(true);
        try {
            const res = await OrganizationService.getApplyList({
                page_num: appliesPage,
                page_size: appliesPageSize,
                status: appliesStatusFilter,
            });
            setApplies(res.list || []);
            setAppliesTotal(res.total);
        } catch (e) {
            message.error(t("organizations.messages.fetchAppliesFailed"));
        } finally {
            setAppliesLoading(false);
        }
    };

    const handleReview = async (applyId: string, action: "approve" | "reject") => {
        const actionLabel = action === "approve" ? t("organizations.applyActions.approve") : t("organizations.applyActions.reject");
        const actionResult =
            action === "approve" ? t("organizations.applyActions.approveResult") : t("organizations.applyActions.rejectResult");
        const isConfirmed = await confirm({
            title: t("organizations.review.confirmTitle", { action: actionLabel }),
            content: t("organizations.review.confirmContent", { action: actionLabel }),
            confirmText: actionLabel,
            cancelText: t("organizations.actions.cancel"),
        });
        if (!isConfirmed) {
            return;
        }
        try {
            await OrganizationService.reviewApply({ apply_id: applyId, action });
            message.success(t("organizations.review.success", { result: actionResult }));
            fetchApplies();
            fetchStats();
            if (action === "approve") {
                fetchOrganizations();
            }
        } catch (e: any) {
            message.error(e.message || t("organizations.messages.operationFailed"));
        }
    };

    useEffect(() => {
        fetchOrganizations();
        // eslint-disable-next-line
    }, [currentPage, statusFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === "applies") {
            fetchApplies();
        }
        // eslint-disable-next-line
    }, [appliesPage, appliesStatusFilter, activeTab]);

    // 打开创建模态框
    const openCreateModal = () => {
        setCurrentOrg(null);
        setFormData({ name: "", type: "", status: "active", description: "" });
        setIsModalVisible(true);
    };

    // 打开预览模态框
    const openPreviewModal = (org: Organization) => {
        setPreviewOrg(org);
        setIsPreviewVisible(true);
    };

    // 打开编辑模态框
    const openEditModal = (org: Organization) => {
        setCurrentOrg(org);
        setFormData({
            name: org.name,
            type: org.type,
            status: org.status,
            description: org.description || "",
        });
        setIsModalVisible(true);
    };

    // 处理表单提交
    const handleSubmit = async () => {
        if (!formData.name || !formData.type || !formData.status) {
            message.error(t("organizations.messages.incompleteForm"));
            return;
        }
        setLoading(true);
        try {
            if (currentOrg) {
                // 编辑模式（假设接口同创建）
                await OrganizationService.createOrganization({
                    id: currentOrg.id,
                    name: formData.name!,
                    type: formData.type!,
                    status: STATUS_STR_MAP_NUMBER[formData.status!],
                    description: formData.description || "",
                });
                message.success(t("organizations.messages.orgUpdated"));
            } else {
                // 创建模式
                await OrganizationService.createOrganization({
                    name: formData.name!,
                    type: formData.type!,
                    status: STATUS_STR_MAP_NUMBER[formData.status!],
                    description: formData.description || "",
                });
                message.success(t("organizations.messages.orgCreated"));
            }
            setIsModalVisible(false);
            await fetchOrganizations();
            fetchStats();
        } catch (e: any) {
            message.error(e.message || t("organizations.messages.operationFailed"));
        } finally {
            setLoading(false);
        }
    };

    // 筛选逻辑
    const filteredOrgs = organizations.filter((item) => {
        const matchesSearch = item.name.includes(searchTerm);
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // 分页逻辑
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentData = filteredOrgs.slice(startIndex, startIndex + pageSize);

    // 生成页码数组
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);
            if (start > 1) {
                pages.push(1);
                if (start > 2) {
                    pages.push("...");
                }
            }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages) {
                if (end < totalPages - 1) {
                    pages.push("...");
                }
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: t("organizations.delete.title"),
            content: t("organizations.delete.content"),
            confirmText: t("organizations.actions.delete"),
            cancelText: t("organizations.actions.cancel"),
        });
        if (isConfirmed) {
            setLoading(true);
            try {
                await OrganizationService.deleteOrganizations({ ids: id });
                await fetchOrganizations();
                fetchStats();
                message.success(t("organizations.delete.success"));
            } catch (e) {
                message.error(t("organizations.delete.error"));
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        <FaCheckCircle /> {t("organizations.status.active")}
                    </span>
                );
            case "inactive":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusInactive}`}>
                        <FaTimesCircle /> {t("organizations.status.inactive")}
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading && activeTab === "orgs") {
        return <Loading />;
    }

    const getApplyStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>{t("organizations.applyStatus.pending")}</span>
                );
            case 1:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        <FaCheckCircle /> {t("organizations.applyStatus.approved")}
                    </span>
                );
            case 2:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusInactive}`}>
                        <FaTimesCircle /> {t("organizations.applyStatus.rejected")}
                    </span>
                );
            default:
                return null;
        }
    };

    const appliesPages = Math.ceil(appliesTotal / appliesPageSize);

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("organizations.page.title")}</h1>
                    <p className={styles.pageDescription}>{t("organizations.page.description")}</p>
                </div>
                <div className={styles.headerActions}>
                    {activeTab === "orgs" ? (
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
                            <FaPlus /> {t("organizations.actions.create")}
                        </button>
                    ) : (
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            {t("organizations.applies.total", { total: appliesTotal })}
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaBuilding />
                    </div>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>{t("organizations.stats.total")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statValue}>{stats.active}</div>
                    <div className={styles.statLabel}>{t("organizations.stats.active")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTimesCircle />
                    </div>
                    <div className={styles.statValue}>{stats.inactive}</div>
                    <div className={styles.statLabel}>{t("organizations.stats.inactive")}</div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div className={styles.tabBar}>
                <button
                    className={`${styles.tabBtn} ${activeTab === "orgs" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("orgs")}
                >
                    <FaBuilding /> {t("organizations.tabs.orgs")}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === "applies" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("applies")}
                >
                    <FaClipboardList /> {t("organizations.tabs.applies")}
                    {(() => {
                        // 待审核数量提示（仅 orgs 视图时检查）
                        return null;
                    })()}
                </button>
            </div>

            {activeTab === "orgs" ? (
                <>
                    <div className={styles.filterSection}>
                        <div className={styles.filterHeader}>
                            <h3 className={styles.filterTitle}>
                                <FaFilter />
                                {t("organizations.filter.title")}
                            </h3>
                        </div>
                        <div className={styles.filterForm}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>{t("organizations.filter.searchLabel")}</label>
                                <Input
                                    placeholder={t("organizations.filter.searchPlaceholder")}
                                    value={searchTerm}
                                    onChange={(value) => setSearchTerm(value)}
                                    prefix={<FaSearch />}
                                    size="large"
                                    style={{ minHeight: "46px", height: "50px" }}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>{t("organizations.filter.statusLabel")}</label>
                                <CustomSelect
                                    name={t("organizations.filter.statusSelectName")}
                                    options={[
                                        { id: "all", name: t("organizations.status.all"), color: "var(--text-secondary)" },
                                        { id: "active", name: t("organizations.status.active"), color: "var(--success)" },
                                        { id: "inactive", name: t("organizations.status.inactive"), color: "var(--error)" },
                                    ]}
                                    value={{
                                        id: statusFilter,
                                        name:
                                            statusFilter === "all"
                                                ? t("organizations.status.all")
                                                : statusFilter === "active"
                                                  ? t("organizations.status.active")
                                                  : t("organizations.status.inactive"),
                                        color: "",
                                    }}
                                    onChange={(option) => setStatusFilter(option ? String(option.id) : "all")}
                                    placeholder={t("organizations.filter.statusPlaceholder")}
                                    hideBadge={true}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>{t("organizations.table.title")}</h3>
                            <div className={styles.tableActions}>
                                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                                    {t("organizations.table.totalOrgs", { total })}
                                </span>
                            </div>
                        </div>
                        <table className={`${styles.orgTable} ${styles.organizationTable}`}>
                            <thead>
                                <tr>
                                    <th>{t("organizations.table.columns.name")}</th>
                                    <th>{t("organizations.table.columns.type")}</th>
                                    <th>{t("organizations.table.columns.members")}</th>
                                    <th>{t("organizations.table.columns.status")}</th>
                                    <th>{t("organizations.table.columns.createdAt")}</th>
                                    <th>{t("organizations.table.columns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <div
                                                        className={styles.userAvatar}
                                                        style={{
                                                            background: "var(--primary-light)",
                                                            color: "var(--primary)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <FaBuilding />
                                                    </div>
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{item.name}</div>
                                                        <div className={styles.userEmail}>
                                                            {item.description && (
                                                                <span
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        color: "var(--text-secondary)",
                                                                        lineHeight: "1.4",
                                                                    }}
                                                                >
                                                                    {item.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.type}</td>
                                            <td>{item.memberCount}</td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.createdAt}</td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        title={t("organizations.actions.preview")}
                                                        onClick={() => openPreviewModal(item)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        title={t("organizations.actions.edit")}
                                                        onClick={() => openEditModal(item)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.delete}`}
                                                        title={t("organizations.actions.delete")}
                                                        onClick={() => handleDelete(item.id)}
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
                                            colSpan={6}
                                            style={{
                                                textAlign: "center",
                                                padding: "40px",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {t("organizations.table.empty")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {totalPages >= 1 && (
                            <div className={styles.pagination}>
                                <span className={styles.pageInfo}>
                                    {t("organizations.pagination.showing", {
                                        start: startIndex + 1,
                                        end: Math.min(startIndex + pageSize, total),
                                        total,
                                    })}
                                </span>
                                <div className={styles.pageButtons}>
                                    <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                                        <FaAngleDoubleLeft />
                                    </button>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((prev) => prev - 1)}
                                    >
                                        <FaChevronLeft />
                                    </button>

                                    {getPageNumbers().map((page, index) => (
                                        <React.Fragment key={index}>
                                            {page === "..." ? (
                                                <span className={styles.paginationEllipsis}>...</span>
                                            ) : (
                                                <button
                                                    className={`${styles.pageBtn} ${currentPage === page ? styles.active : ""}`}
                                                    onClick={() => setCurrentPage(page as number)}
                                                >
                                                    {page}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((prev) => prev + 1)}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                    >
                                        <FaAngleDoubleRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 创建/编辑模态框 */}
                    <Modal
                        visible={isModalVisible}
                        title={currentOrg ? t("organizations.modal.editTitle") : t("organizations.modal.createTitle")}
                        onClose={() => setIsModalVisible(false)}
                        width={600}
                        footer={
                            <>
                                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsModalVisible(false)}>
                                    {t("organizations.actions.cancel")}
                                </button>
                                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>
                                    {currentOrg ? t("organizations.modal.save") : t("organizations.modal.create")}
                                </button>
                            </>
                        }
                    >
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("organizations.modal.nameLabel")}</label>
                            <Input
                                placeholder={t("organizations.modal.namePlaceholder")}
                                value={formData.name || ""}
                                onChange={(value) => setFormData({ ...formData, name: value })}
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("organizations.modal.typeLabel")}</label>
                            <Input
                                placeholder={t("organizations.modal.typePlaceholder")}
                                value={formData.type || ""}
                                onChange={(value) => setFormData({ ...formData, type: value })}
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("organizations.modal.statusLabel")}</label>
                            <CustomSelect
                                name={t("organizations.modal.statusSelectName")}
                                options={[
                                    { id: "active", name: t("organizations.status.active"), color: "var(--success)" },
                                    { id: "inactive", name: t("organizations.status.inactive"), color: "var(--error)" },
                                ]}
                                value={{
                                    id: formData.status || "active",
                                    name:
                                        formData.status === "active"
                                            ? t("organizations.status.active")
                                            : t("organizations.status.inactive"),
                                    color: "",
                                }}
                                onChange={(option) => setFormData({ ...formData, status: option?.id as any })}
                                placeholder={t("organizations.modal.statusPlaceholder")}
                                hideBadge={true}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("organizations.modal.descriptionLabel")}</label>
                            <textarea
                                className={styles.formTextarea}
                                placeholder={t("organizations.modal.descriptionPlaceholder")}
                                value={formData.description || ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </Modal>

                    {/* 预览模态框（卡片样式） */}
                    <Modal
                        visible={isPreviewVisible}
                        title={previewOrg ? t("organizations.preview.title") : t("organizations.preview.title")}
                        onClose={() => setIsPreviewVisible(false)}
                        width={520}
                        footer={
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsPreviewVisible(false)}>
                                {t("organizations.actions.close")}
                            </button>
                        }
                    >
                        {previewOrg && (
                            <div
                                className={styles.previewCard}
                                style={{
                                    padding: "32px 24px",
                                    borderRadius: "16px",
                                    background: "var(--bg-primary)",
                                    boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "18px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "2.2rem",
                                            color: "var(--primary)",
                                            marginRight: "18px",
                                        }}
                                    >
                                        <FaBuilding />
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: "1.3rem",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            {previewOrg.name}
                                        </div>
                                        <div style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>{previewOrg.type}</div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: "14px" }}>
                                    <span style={{ marginRight: "16px" }}>{getStatusBadge(previewOrg.status)}</span>
                                    <span
                                        style={{
                                            color: "var(--text-secondary)",
                                            fontSize: "13px",
                                            marginRight: "16px",
                                        }}
                                    >
                                        {t("organizations.preview.createdAt", { date: previewOrg.createdAt })}
                                    </span>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                                        {t("organizations.preview.members", { value: previewOrg.memberCount })}
                                    </span>
                                </div>
                                <div style={{ marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "1rem" }}>{t("organizations.preview.description")}</strong>
                                    <div
                                        style={{
                                            marginTop: "6px",
                                            color: "var(--text-primary)",
                                            fontSize: "1rem",
                                            lineHeight: "1.7",
                                        }}
                                    >
                                        {previewOrg.description || t("organizations.preview.noDescription")}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal>
                </>
            ) : (
                <>
                    {/* 申请审核列表 */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterHeader}>
                            <h3 className={styles.filterTitle}>
                                <FaFilter />
                                {t("organizations.filter.title")}
                            </h3>
                        </div>
                        <div className={styles.filterForm}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>{t("organizations.applies.filterLabel")}</label>
                                <CustomSelect
                                    name={t("organizations.applies.statusSelectName")}
                                    options={[
                                        { id: "0", name: t("organizations.applyStatus.pending"), color: "#f0ad4e" },
                                        { id: "1", name: t("organizations.applyStatus.approved"), color: "var(--success)" },
                                        { id: "2", name: t("organizations.applyStatus.rejected"), color: "var(--error)" },
                                    ]}
                                    value={{
                                        id: String(appliesStatusFilter ?? ""),
                                        name:
                                            appliesStatusFilter === undefined
                                                ? t("organizations.applyStatus.all")
                                                : appliesStatusFilter === 0
                                                  ? t("organizations.applyStatus.pending")
                                                  : appliesStatusFilter === 1
                                                    ? t("organizations.applyStatus.approved")
                                                    : t("organizations.applyStatus.rejected"),
                                        color: "",
                                    }}
                                    onChange={(option) => {
                                        const val = option ? Number(option.id) : undefined;
                                        setAppliesStatusFilter(val);
                                        setAppliesPage(1);
                                    }}
                                    placeholder={t("organizations.applies.statusPlaceholder")}
                                    hideBadge={true}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>{t("organizations.applies.tableTitle")}</h3>
                        </div>
                        {appliesLoading ? (
                            <Loading />
                        ) : (
                            <>
                                <table className={`${styles.orgTable} ${styles.applyTable}`}>
                                    <thead>
                                        <tr>
                                            <th>{t("organizations.applies.columns.user")}</th>
                                            <th>{t("organizations.applies.columns.orgName")}</th>
                                            <th>{t("organizations.applies.columns.type")}</th>
                                            <th>{t("organizations.applies.columns.description")}</th>
                                            <th>{t("organizations.applies.columns.status")}</th>
                                            <th>{t("organizations.applies.columns.createdAt")}</th>
                                            <th>{t("organizations.applies.columns.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applies.length > 0 ? (
                                            applies.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.user_name || item.user_id}</td>
                                                    <td>{item.org_name}</td>
                                                    <td>{item.org_type}</td>
                                                    <td>
                                                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                            {item.org_description || "-"}
                                                        </span>
                                                    </td>
                                                    <td>{getApplyStatusBadge(item.status)}</td>
                                                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                                                        {item.created_at
                                                            ? dayjs.unix(item.created_at).format("YYYY-MM-DD HH:mm:ss")
                                                            : "-"}
                                                    </td>
                                                    <td>
                                                        <div className={styles.actionButtons}>
                                                            {item.status === 0 && (
                                                                <>
                                                                    <button
                                                                        className={`${styles.actionBtn} ${styles.approveAction}`}
                                                                        title={t("organizations.applyActions.approve")}
                                                                        onClick={() => handleReview(item.id, "approve")}
                                                                    >
                                                                        <FaCheckCircle />
                                                                    </button>
                                                                    <button
                                                                        className={`${styles.actionBtn} ${styles.rejectAction}`}
                                                                        title={t("organizations.applyActions.reject")}
                                                                        onClick={() => handleReview(item.id, "reject")}
                                                                    >
                                                                        <FaTimesCircle />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {item.status !== 0 && (
                                                                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                                                                    {item.review_reason || t("organizations.applies.reviewed")}
                                                                </span>
                                                            )}
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
                                                    {t("organizations.applies.empty")}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {appliesPages >= 1 && (
                                    <div className={styles.pagination}>
                                        <span className={styles.pageInfo}>
                                            {t("organizations.applies.pagination.showing", {
                                                start: (appliesPage - 1) * appliesPageSize + 1,
                                                end: Math.min(appliesPage * appliesPageSize, appliesTotal),
                                                total: appliesTotal,
                                            })}
                                        </span>
                                        <div className={styles.pageButtons}>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={appliesPage === 1}
                                                onClick={() => setAppliesPage(1)}
                                            >
                                                <FaAngleDoubleLeft />
                                            </button>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={appliesPage === 1}
                                                onClick={() => setAppliesPage((prev) => prev - 1)}
                                            >
                                                <FaChevronLeft />
                                            </button>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={appliesPage === appliesPages}
                                                onClick={() => setAppliesPage((prev) => prev + 1)}
                                            >
                                                <FaChevronRight />
                                            </button>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={appliesPage === appliesPages}
                                                onClick={() => setAppliesPage(appliesPages)}
                                            >
                                                <FaAngleDoubleRight />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrganizationManagement;

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    FaFilter,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaUsers,
} from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import Loading from "@/components/loading/Loading";
import Avatar from "@/components/avatar/Avatar";
import Modal from "@/components/modal/Modal";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types";
import { PlatformRoleCSS, PlatformRoleByKey, type PlatformRole } from "@/types/Roles.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { useInitialLoaded } from "@/hooks/UseInitialLoaded";
import styles from "./UserManagement.module.css";
import { AuthService } from "@/services/AuthService.ts";
import { formatToChinaTime } from "@/utils/Utils.ts";

// 用户接口定义
interface UserListItem {
    id: string | number;
    username: string;
    email: string;
    avatar: string;
    role: number;
    status: string;
    createdAt: string;
    lastLogin: string;
    articleCount: number;
    commentCount: number;
}

// 统计数据接口
interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    inactiveUsers: number;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    role: string;
    status: string;
    dateRange: string;
}

const UserManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const enums = useEnumLabels();
    // 状态管理
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        inactiveUsers: 0,
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        role: "",
        status: "",
        dateRange: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const initialLoaded = useInitialLoaded(loading);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        account: "",
        email: "",
        passwd: "",
        role: 1,
        state: 1,
    });
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const [detailUser, setDetailUser] = useState<UserListItem | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);

    const usersPerPage = 15; // 每页显示15条数据

    // 加载统计数据
    const fetchStats = async () => {
        try {
            const statsRsp = await AuthService.getAdminUserStats();
            setStats({
                totalUsers: statsRsp.total_users,
                activeUsers: statsRsp.active_users,
                newUsers: statsRsp.new_users_30d,
                inactiveUsers: statsRsp.inactive_users,
            });
        } catch (error) {
            console.error("获取用户统计失败:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // 加载用户数据
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const dateRangeMap: Record<string, number> = {
                    "7days": 7,
                    "30days": 30,
                    "90days": 90,
                };

                const params: any = {
                    page_num: currentPage,
                    page_size: usersPerPage,
                };

                if (filters.role) {
                    params.role = PlatformRoleByKey[filters.role];
                }
                // 假设 1=active, 2=inactive (根据实际后端定义调整)
                if (filters.status) {
                    params.state = filters.status === "active" ? 1 : 2;
                }
                if (filters.dateRange) {
                    params.regis_range = dateRangeMap[filters.dateRange];
                }

                const rsp = await AuthService.listUsersAdmin(params);

                let fetchedUsers: UserListItem[] = [];
                if (Array.isArray(rsp.list) && rsp.list.length > 0) {
                    fetchedUsers = rsp.list.map((user) => ({
                        id: user.id,
                        username: user.name,
                        email: user.email,
                        avatar: user.avatar || `https://picsum.photos/id/${(Number(user.id) % 100) + 1}/80`,
                        role: user.role,
                        status: user.state === 1 ? "active" : "inactive",
                        createdAt: formatToChinaTime(user.create_time),
                        lastLogin: formatToChinaTime(user.login_time),
                        articleCount: (user as any).article_count ?? 0,
                        commentCount: (user as any).comment_count ?? 0,
                    }));
                }
                setUsers(fetchedUsers);
                setTotalUsers(rsp.total);
            } catch (error) {
                console.error("获取用户列表失败:", error);
                // 可以添加错误提示
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, filters.role, filters.status, filters.dateRange]);

    // 筛选用户数据
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // 搜索筛选
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!user.username.toLowerCase().includes(searchTerm) && !user.email.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });
    }, [users, filters.search]);

    // 分页计算
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + users.length;
    const currentUsers = filteredUsers;

    // 筛选选项数据
    const roleOptions: SelectOption[] = [
        { id: "", name: t("users.roleOptions.all"), color: "#6c757d" },
        { id: "admin", name: t("users.roleOptions.admin"), color: "#dc3545" },
        { id: "checker", name: t("users.roleOptions.checker"), color: "#28a745" },
        { id: "editor", name: t("users.roleOptions.editor"), color: "#ffc107" },
        { id: "user", name: t("users.roleOptions.user"), color: "#007bff" },
    ];

    const statusOptions: SelectOption[] = [
        { id: "", name: t("users.statusOptions.all"), color: "#6c757d" },
        { id: "active", name: t("users.statusOptions.active"), color: "#28a745" },
        { id: "inactive", name: t("users.statusOptions.inactive"), color: "#ffc107" },
    ];

    const createRoleOptions: SelectOption[] = [
        { id: "1", name: t("users.createRoleOptions.user"), color: "#007bff" },
        { id: "2", name: t("users.createRoleOptions.admin"), color: "#dc3545" },
        { id: "3", name: t("users.createRoleOptions.editor"), color: "#ffc107" },
        { id: "4", name: t("users.createRoleOptions.checker"), color: "#28a745" },
    ];

    const createStateOptions: SelectOption[] = [
        { id: "1", name: t("users.statusOptions.active"), color: "#28a745" },
        { id: "2", name: t("users.statusOptions.inactive"), color: "#ffc107" },
    ];

    const dateRangeOptions: SelectOption[] = [
        { id: "", name: t("users.dateRangeOptions.all"), color: "#6c757d" },
        { id: "7days", name: t("users.dateRangeOptions.last7days"), color: "#17a2b8" },
        { id: "30days", name: t("users.dateRangeOptions.last30days"), color: "#17a2b8" },
        { id: "90days", name: t("users.dateRangeOptions.last90days"), color: "#17a2b8" },
    ];

    // 处理CustomSelect选择
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters((prev) => ({
                ...prev,
                [field]: selectedOption?.id || "",
            }));
            setCurrentPage(1);
        };
    };

    // 处理筛选条件变化（用于搜索框）
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 清除筛选条件
    const clearFilters = () => {
        setFilters({
            search: "",
            role: "",
            status: "",
            dateRange: "",
        });
        setCurrentPage(1);
    };

    // 打开创建用户模态框
    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            account: "",
            email: "",
            passwd: "",
            role: 1,
            state: 1,
        });
        setIsModalVisible(true);
    };

    // 打开编辑用户模态框
    const openEditModal = (user: UserListItem) => {
        setEditingUser(user);
        setFormData({
            account: user.username,
            email: user.email,
            passwd: "",
            role: user.role,
            state: user.status === "active" ? 1 : 2,
        });
        setIsModalVisible(true);
    };

    // 打开查看详情模态框
    const openDetailModal = (user: UserListItem) => {
        setDetailUser(user);
        setIsDetailVisible(true);
    };

    // 提交表单（创建/编辑）
    const handleFormSubmit = async () => {
        if (!formData.account.trim()) {
            message.error(t("users.message.usernameRequired"));
            return;
        }
        if (!formData.email.trim()) {
            message.error(t("users.message.emailRequired"));
            return;
        }
        if (!editingUser && (!formData.passwd || formData.passwd.length < 6)) {
            message.error(t("users.message.passwordMin"));
            return;
        }

        setSubmitting(true);
        try {
            if (editingUser) {
                // 编辑模式
                const updateParams: any = {
                    user_id: editingUser.id,
                    account: formData.account.trim(),
                    email: formData.email.trim(),
                    role: formData.role,
                    state: formData.state,
                };
                if (formData.passwd) {
                    updateParams.passwd = formData.passwd;
                }
                await AuthService.updateUserAdmin(updateParams);
                message.success(t("users.message.updateSuccess"));
            } else {
                // 创建模式
                await AuthService.createUserAdmin({
                    account: formData.account.trim(),
                    email: formData.email.trim(),
                    passwd: formData.passwd,
                    role: formData.role,
                    state: formData.state,
                });
                message.success(t("users.message.createSuccess"));
            }
            setIsModalVisible(false);
            // 刷新用户列表
            const rsp = await AuthService.listUsersAdmin({ page_num: 1, page_size: usersPerPage });
            let fetchedUsers: UserListItem[] = [];
            if (Array.isArray(rsp.list) && rsp.list.length > 0) {
                fetchedUsers = rsp.list.map((user) => ({
                    id: user.id,
                    username: user.name,
                    email: user.email,
                    avatar: user.avatar || `https://picsum.photos/id/${(Number(user.id) % 100) + 1}/80`,
                    role: user.role,
                    status: user.state === 1 ? "active" : "inactive",
                    createdAt: formatToChinaTime(user.create_time),
                    lastLogin: formatToChinaTime(user.login_time),
                    articleCount: (user as any).article_count ?? 0,
                    commentCount: (user as any).comment_count ?? 0,
                }));
            }
            setUsers(fetchedUsers);
            setTotalUsers(rsp.total);
            fetchStats();
        } catch (error: any) {
            message.error(error.message || (editingUser ? t("users.message.updateFailed") : t("users.message.createFailed")));
        } finally {
            setSubmitting(false);
        }
    };

    // 删除用户
    const deleteUser = async (userId: string | number) => {
        const isConfirmed = await confirm({
            title: t("users.confirm.deleteTitle"),
            content: t("users.confirm.deleteContent"),
            confirmText: t("users.confirm.deleteConfirm"),
            cancelText: t("users.confirm.deleteCancel"),
        });
        if (!isConfirmed) {
            return;
        }

        try {
            await AuthService.deleteUserAdmin(userId);
            message.success(t("users.message.deleteSuccess"));
            setUsers((prev) => prev.filter((user) => user.id !== userId));
            setTotalUsers((prev) => prev - 1);
            fetchStats();
        } catch (error: any) {
            message.error(error.message || t("users.message.deleteFailed"));
        }
    };

    // 格式化日期（精确到秒，YYYY-MM-DD HH:mm:ss），无效/epoch 时间显示为 -
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
            return "-";
        }
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

    if (loading && !initialLoaded) {
        return (
            <div className={styles.userManagement}>
                <Loading text={t("users.loading")} size="large" />
            </div>
        );
    }

    return (
        <div className={styles.userManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t("users.title")}</h1>
                    <p className={styles.pageDescription}>{t("users.description")}</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
                        <FaPlus />
                        {t("users.addUser")}
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaUsers />
                    </div>
                    <div className={styles.statValue}>{stats.totalUsers}</div>
                    <div className={styles.statLabel}>{t("users.stats.totalUsers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaEye />
                    </div>
                    <div className={styles.statValue}>{stats.activeUsers}</div>
                    <div className={styles.statLabel}>{t("users.stats.activeUsers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaPlus />
                    </div>
                    <div className={styles.statValue}>{stats.newUsers}</div>
                    <div className={styles.statLabel}>{t("users.stats.newUsers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTrash />
                    </div>
                    <div className={styles.statValue}>{stats.inactiveUsers}</div>
                    <div className={styles.statLabel}>{t("users.stats.inactiveUsers")}</div>
                </div>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        {t("users.filters.title")}
                    </h3>
                    <div className={styles.filterActions}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                            {t("users.filters.clear")}
                        </button>
                    </div>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("users.filters.search")}</label>
                        <Input
                            placeholder={t("users.filters.searchPlaceholder")}
                            value={filters.search}
                            onChange={(value) => handleFilterChange("search", value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("users.filters.role")}</label>
                        <CustomSelect
                            name={t("users.filters.role")}
                            options={roleOptions}
                            value={roleOptions.find((option) => option.id === filters.role) || null}
                            onChange={handleSelectChange("role")}
                            placeholder={t("users.filters.rolePlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("users.filters.status")}</label>
                        <CustomSelect
                            name={t("users.filters.status")}
                            options={statusOptions}
                            value={statusOptions.find((option) => option.id === filters.status) || null}
                            onChange={handleSelectChange("status")}
                            placeholder={t("users.filters.statusPlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{t("users.filters.registerTime")}</label>
                        <CustomSelect
                            name={t("users.filters.registerTime")}
                            options={dateRangeOptions}
                            value={dateRangeOptions.find((option) => option.id === filters.dateRange) || null}
                            onChange={handleSelectChange("dateRange")}
                            placeholder={t("users.filters.dateRangePlaceholder")}
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 用户表格 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>{t("users.table.title")}</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                            {t("users.table.total", { total: totalUsers })}
                        </span>
                    </div>
                </div>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>{t("users.table.userInfo")}</th>
                            <th>{t("users.table.role")}</th>
                            <th>{t("users.table.status")}</th>
                            <th>{t("users.table.registerTime")}</th>
                            <th>{t("users.table.lastLogin")}</th>
                            <th>{t("users.table.articleCount")}</th>
                            <th>{t("users.table.commentCount")}</th>
                            <th>{t("users.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                                    <Loading size="small" />
                                </td>
                            </tr>
                        ) : currentUsers.length > 0 ? (
                            currentUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <Avatar src={user.avatar} name={user.username} size={40} />
                                            <div className={styles.userDetails}>
                                                <div className={styles.userName}>{user.username}</div>
                                                <div className={styles.userEmail}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`${styles.roleBadge} ${styles[PlatformRoleCSS[user.role as keyof typeof PlatformRoleCSS] || "user"]}`}
                                        >
                                            {enums.platformRole[user.role as PlatformRole] || user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                                            <span className={styles.statusIndicator}></span>
                                            {user.status === "active"
                                                ? t("users.status.active")
                                                : user.status === "inactive"
                                                  ? t("users.status.inactive")
                                                  : t("users.status.pending")}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>{formatDate(user.lastLogin)}</td>
                                    <td>{user.articleCount}</td>
                                    <td>{user.commentCount}</td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={t("users.actions.edit")}
                                                onClick={() => openEditModal(user)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.edit}`}
                                                title={t("users.actions.view")}
                                                onClick={() => openDetailModal(user)}
                                            >
                                                <FaEye />
                                            </button>
                                            <Button
                                                color="error"
                                                variant="ghost"
                                                size="small"
                                                onClick={() => deleteUser(user.id)}
                                                className={styles.actionButton}
                                                aria-label={t("users.actions.delete")}
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
                                    colSpan={8}
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {t("users.table.noData")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* 分页 */}
                {totalPages >= 1 && (
                    <div className={styles.paginationContainer}>
                        <div className={styles.paginationInfo}>
                            {t("users.table.pagination", {
                                start: startIndex + 1,
                                end: Math.min(endIndex, totalUsers),
                                total: totalUsers,
                            })}
                        </div>
                        <div className={styles.paginationControls}>
                            <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
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

            {/* 创建/编辑用户模态框 */}
            <Modal
                visible={isModalVisible}
                title={editingUser ? t("users.form.editTitle") : t("users.form.createTitle")}
                onClose={() => setIsModalVisible(false)}
                width={560}
                footer={
                    <>
                        <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => setIsModalVisible(false)}
                            disabled={submitting}
                        >
                            {t("users.form.cancel")}
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleFormSubmit} disabled={submitting}>
                            {submitting ? t("users.form.saving") : editingUser ? t("users.form.save") : t("users.form.create")}
                        </button>
                    </>
                }
            >
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("users.form.username")}</label>
                    <Input
                        placeholder={t("users.form.usernamePlaceholder")}
                        value={formData.account}
                        onChange={(value) => setFormData({ ...formData, account: value })}
                        className={styles.formInput}
                        size="large"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("users.form.email")}</label>
                    <Input
                        placeholder={t("users.form.emailPlaceholder")}
                        value={formData.email}
                        onChange={(value) => setFormData({ ...formData, email: value })}
                        className={styles.formInput}
                        size="large"
                        type="email"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                        {t("users.form.password")}
                        {editingUser ? "" : " *"}
                    </label>
                    <Input
                        placeholder={editingUser ? t("users.form.passwordEditPlaceholder") : t("users.form.passwordPlaceholder")}
                        value={formData.passwd}
                        onChange={(value) => setFormData({ ...formData, passwd: value })}
                        className={styles.formInput}
                        size="large"
                        type="password"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("users.form.role")}</label>
                    <CustomSelect
                        name={t("users.form.role")}
                        options={createRoleOptions}
                        value={createRoleOptions.find((o) => Number(o.id) === formData.role) || null}
                        onChange={(option) => setFormData({ ...formData, role: option ? Number(option.id) : 1 })}
                        placeholder={t("users.form.rolePlaceholder")}
                        hideBadge={true}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("users.form.status")}</label>
                    <CustomSelect
                        name={t("users.form.status")}
                        options={createStateOptions}
                        value={createStateOptions.find((o) => Number(o.id) === formData.state) || null}
                        onChange={(option) => setFormData({ ...formData, state: option ? Number(option.id) : 1 })}
                        placeholder={t("users.form.statusPlaceholder")}
                        hideBadge={true}
                    />
                </div>
            </Modal>

            {/* 查看用户详情模态框 */}
            <Modal
                visible={isDetailVisible}
                title={t("users.detail.title")}
                onClose={() => setIsDetailVisible(false)}
                width={520}
                footer={
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsDetailVisible(false)}>
                        {t("users.detail.close")}
                    </button>
                }
            >
                {detailUser && (
                    <div style={{ padding: "8px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                            <Avatar src={detailUser.avatar} name={detailUser.username} size={64} />
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 600 }}>{detailUser.username}</div>
                                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                    {detailUser.email}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.role")}
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: 500 }}>
                                    <span
                                        className={`${styles.roleBadge} ${styles[PlatformRoleCSS[detailUser.role as keyof typeof PlatformRoleCSS] || "user"]}`}
                                    >
                                        {enums.platformRole[detailUser.role as PlatformRole] || detailUser.role}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.status")}
                                </div>
                                <div style={{ fontSize: "15px" }}>
                                    <span className={`${styles.statusBadge} ${styles[detailUser.status]}`}>
                                        <span className={styles.statusIndicator}></span>
                                        {detailUser.status === "active"
                                            ? t("users.status.active")
                                            : detailUser.status === "inactive"
                                              ? t("users.status.inactive")
                                              : t("users.status.pending")}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.registerTime")}
                                </div>
                                <div style={{ fontSize: "15px" }}>{detailUser.createdAt}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.lastLogin")}
                                </div>
                                <div style={{ fontSize: "15px" }}>{detailUser.lastLogin}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.articleCount")}
                                </div>
                                <div style={{ fontSize: "15px" }}>{detailUser.articleCount}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                    {t("users.detail.commentCount")}
                                </div>
                                <div style={{ fontSize: "15px" }}>{detailUser.commentCount}</div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;

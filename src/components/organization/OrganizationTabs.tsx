import React from "react";
import {
    FaCrown,
    FaUserShield,
    FaUser,
    FaUserCheck,
    FaCode,
    FaEye,
    FaSync,
    FaUserMinus,
    FaCog,
    FaTasks,
    FaEdit,
    FaTrash,
    FaCalendarAlt,
    FaFlag,
    FaHourglassHalf,
    FaPlayCircle,
    FaStopCircle,
    FaCheck,
    FaTimes,
    FaPlus,
} from "react-icons/fa";
import type { Member, Task, OrganizationDetail } from "@/types/Organization.ts";
import { OrgRole, canManageOrg } from "@/types/Roles.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import { useTranslation } from "react-i18next";
import Avatar from "../avatar/Avatar";
import styles from "./Organization.module.css";
import Modal from "../modal/Modal";
import Input from "../input/Input";
import message from "@/components/message/Message";
// import DatePicker from '../datePicker/DatePicker';
// import dayjs from 'dayjs';
import "dayjs/locale/zh-cn";
import OrganizationRepos from "./OrganizationRepos";
import OrganizationService from "@/services/OrganizationService.ts";
import Loading from "../loading/Loading";

interface OrganizationTabsProps {
    org: OrganizationDetail | null;
    userRole: OrgRole | null;
    currentUser?: any;
    showPendingRequests: boolean;
    showTasks: boolean;
    showRepos: boolean;
    members: Member[];
    membersTotal: number;
    page: number;
    isRefreshing: boolean;
    pendingRequests: Member[];
    pendingRequestsTotal: number;
    pendingRequestsPage: number;
    pendingRequestsLoading: boolean;
    tasks: Task[];
    tasksTotal: number;
    tasksPage: number;
    tasksLoading: boolean;
    roleModalVisible: boolean;
    selectedTask: Task | null;
    taskPreviewModalVisible: boolean;
    memberPreviewModalVisible: boolean;
    selectedMember: Member | null;
    selectedRole: number;
    getAvailableRoleOptions: () => any[];
    onTabChange: (showPending: boolean, showTasks: boolean, showRepos?: boolean) => void;
    onRefreshMembers: () => void;
    onRefreshPending: () => void;
    onPageChange: (newPage: number) => void;
    onPendingPageChange: (newPage: number) => void;
    onTasksPageChange: (newPage: number) => void;
    onActionPendingRequest: (requestId: string, action: "accept" | "reject") => void;
    onKickMember: (member: Member) => void;
    onSetMemberRole: (member: Member) => void;
    onRoleModalClose: () => void;
    onTaskPreviewModalClose: () => void;
    onMemberPreviewModalClose: () => void;
    onViewMember: (member: Member) => void;
    onRoleChange: (role: number) => void;
    onConfirmRole: () => void;
    onCreateTask: () => void;
    onRefreshTasks: (page?: number) => void;
    onEditTask: (task: Task) => void;
    onViewTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    canManageMember: (member: Member) => boolean;
    canSetRole: (member: Member) => boolean;
    canManageTask: () => boolean;
    onReposChange?: (delta: number) => void;
}

const PAGE_SIZE = 15;
const TASKS_PAGE_SIZE = 15; // 任务列表每页显示的条数

const statusClassMap = {
    draft: styles.statusDraft,
    active: styles.statusActive,
    closed: styles.statusClosed,
    // 其它状态...
};

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
    org,
    currentUser,
    userRole,
    showPendingRequests,
    showTasks,
    showRepos,
    members,
    membersTotal,
    page,
    isRefreshing,
    pendingRequests,
    pendingRequestsTotal,
    pendingRequestsPage,
    pendingRequestsLoading,
    tasks,
    tasksTotal,
    tasksPage,
    tasksLoading,
    roleModalVisible,
    taskPreviewModalVisible,
    memberPreviewModalVisible,
    selectedMember,
    selectedRole,
    selectedTask,
    getAvailableRoleOptions,
    onTabChange,
    onRefreshMembers,
    onRefreshPending,
    onPageChange,
    onPendingPageChange,
    onTasksPageChange,
    onActionPendingRequest,
    onKickMember,
    onSetMemberRole,
    onRoleModalClose,
    onTaskPreviewModalClose,
    onMemberPreviewModalClose,
    onViewMember,
    onRoleChange,
    onConfirmRole,
    onCreateTask,
    onRefreshTasks,
    onEditTask,
    onViewTask,
    onDeleteTask,
    canManageMember,
    canSetRole,
    canManageTask,
    onReposChange,
}) => {
    const enums = useEnumLabels();
    const { t } = useTranslation("organization");
    // 仓库添加相关状态
    const [repoModalVisible, setRepoModalVisible] = React.useState(false);
    const [repoForm, setRepoForm] = React.useState({ name: "", url: "", token: "" });
    const [reposRefreshKey, setReposRefreshKey] = React.useState(0);

    const handleAddRepo = async () => {
        if (!repoForm.name.trim()) {
            message.warn(t("tabs.message.repoNameRequired"));
            return;
        }
        if (!repoForm.url.trim()) {
            message.warn(t("tabs.message.repoUrlRequired"));
            return;
        }
        if (!repoForm.url.trim().startsWith("https://github.com/")) {
            message.warn(t("tabs.message.repoGithubOnly"));
            return;
        }
        try {
            await OrganizationService.addRepo({
                org_id: org?.id || "",
                name: repoForm.name.trim(),
                url: repoForm.url.trim(),
                token: repoForm.token.trim() || undefined,
            });
            setRepoForm({ name: "", url: "", token: "" });
            setRepoModalVisible(false);
            message.success(t("tabs.message.repoAddSuccess"));
            onReposChange?.(1);
            setReposRefreshKey((prev) => prev + 1);
        } catch {
            message.error(t("tabs.message.repoAddFailed"));
        }
    };

    return (
        <div className={styles.tableContainer}>
            {/* Tab切换按钮 + 右侧操作区 */}
            <div className={styles.tabsHeader}>
                <div className={styles.tabsNav}>
                    <button
                        className={`${styles.tabButton} ${!showPendingRequests && !showTasks && !showRepos ? styles.activeTab : ""}`}
                        onClick={() => onTabChange(false, false, false)}
                    >
                        {t("tabs.tabs.members")}
                    </button>
                    {canManageOrg(userRole, currentUser?.role) && (
                        <button
                            className={`${styles.tabButton} ${showPendingRequests ? styles.activeTab : ""}`}
                            onClick={() => onTabChange(true, false)}
                        >
                            {t("tabs.tabs.pending")}
                        </button>
                    )}
                    {canManageOrg(userRole, currentUser?.role) && (
                        <button
                            className={`${styles.tabButton} ${showTasks ? styles.activeTab : ""}`}
                            onClick={() => onTabChange(false, true)}
                        >
                            {t("tabs.tabs.tasks")}
                        </button>
                    )}
                    {userRole != null && (
                        <button
                            className={`${styles.tabButton} ${showRepos ? styles.activeTab : ""}`}
                            onClick={() => onTabChange(false, false, true)}
                        >
                            {t("tabs.tabs.repos")}
                        </button>
                    )}
                </div>
                <div className={styles.tabsActions}>
                    {!showPendingRequests && !showTasks && !showRepos && (
                        <>
                            <span className={styles.tabsCount}>{t("tabs.members.count", { total: membersTotal })}</span>
                            <button
                                className={`${styles.refreshButton} ${isRefreshing ? styles.loading : ""}`}
                                title={t("tabs.members.refreshTitle")}
                                onClick={onRefreshMembers}
                                disabled={isRefreshing}
                            >
                                <span className={styles.refreshIcon}>
                                    <FaSync />
                                </span>
                                {t("tabs.actions.refresh")}
                            </button>
                        </>
                    )}
                    {showPendingRequests && canManageOrg(userRole, currentUser?.role) && (
                        <>
                            <span className={styles.tabsCount}>{t("tabs.pending.count", { total: pendingRequests.length })}</span>
                            <button
                                className={`${styles.refreshButton} ${pendingRequestsLoading ? styles.loading : ""}`}
                                title={t("tabs.pending.refreshTitle")}
                                onClick={onRefreshPending}
                                disabled={pendingRequestsLoading}
                            >
                                <span className={styles.refreshIcon}>
                                    <FaSync />
                                </span>
                                {t("tabs.actions.refresh")}
                            </button>
                        </>
                    )}
                    {showTasks && canManageOrg(userRole, currentUser?.role) && (
                        <>
                            <button
                                className={styles.refreshButton}
                                onClick={() => onRefreshTasks()}
                                title={t("tabs.tasks.refreshTitle")}
                            >
                                <span className={styles.refreshIcon}>
                                    <FaSync />
                                </span>
                                {t("tabs.actions.refresh")}
                            </button>
                            <button className={styles.createButton} onClick={onCreateTask}>
                                <FaPlus />
                                {t("tabs.tasks.create")}
                            </button>
                        </>
                    )}
                    {showRepos && userRole != null && (
                        <button className={styles.createButton} onClick={() => setRepoModalVisible(true)}>
                            <FaPlus />
                            {t("tabs.repos.add")}
                        </button>
                    )}
                </div>
            </div>

            {/* 成员列表视图 */}
            {!showPendingRequests && !showTasks && !showRepos && (
                <>
                    {isRefreshing && (!members || members.length === 0) ? (
                        <div style={{ padding: "40px 0" }}>
                            <Loading />
                        </div>
                    ) : (
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th>{t("tabs.members.colUser")}</th>
                                    <th>{t("tabs.members.colRole")}</th>
                                    <th>{t("tabs.members.colStatus")}</th>
                                    <th>{t("tabs.members.colJoinTime")}</th>
                                    <th>{t("tabs.members.colActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members && members.length > 0 ? (
                                    members.map((member) => (
                                        <tr key={member.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <Avatar
                                                        src={member.avatar}
                                                        name={member.name}
                                                        size={40}
                                                        className={styles.userAvatar}
                                                    />
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{member.name}</div>
                                                        {member.email && <div className={styles.userEmail}>{member.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label={t("tabs.members.colRole")}>
                                                <span
                                                    className={`${styles.roleBadge} ${member.role === OrgRole.ORG_ADMIN ? styles.admin : member.role === OrgRole.DEV_LEAD ? styles.moderator : styles.user}`}
                                                >
                                                    {member.role === OrgRole.ORG_ADMIN && (
                                                        <FaCrown style={{ color: "#f7b500", marginRight: 4 }} />
                                                    )}
                                                    {member.role === OrgRole.DEV_LEAD && (
                                                        <FaUserShield style={{ color: "#4caf50", marginRight: 4 }} />
                                                    )}
                                                    {member.role === OrgRole.DEVELOPER && (
                                                        <FaCode style={{ color: "#2196f3", marginRight: 4 }} />
                                                    )}
                                                    {member.role === OrgRole.REPORTER && (
                                                        <FaUserCheck style={{ color: "#2196f3", marginRight: 4 }} />
                                                    )}
                                                    {member.role === OrgRole.MEMBER && (
                                                        <FaUser style={{ color: "#2196f3", marginRight: 4 }} />
                                                    )}
                                                    {enums.orgRole[member.role || OrgRole.MEMBER]}
                                                </span>
                                            </td>
                                            <td data-label={t("tabs.members.colStatus")}>
                                                <span
                                                    className={`${styles.statusBadge} ${member.status === "active" ? styles.active : styles.inactive}`}
                                                >
                                                    <span className={styles.statusIndicator}></span>
                                                    {member.status === "active"
                                                        ? t("tabs.members.statusActive")
                                                        : t("tabs.members.statusInactive")}
                                                </span>
                                            </td>
                                            <td data-label={t("tabs.members.colJoinTime")}>{member.joinTime || "-"}</td>
                                            <td data-label={t("tabs.members.colActions")}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.viewButton}`}
                                                        title={t("tabs.members.viewTitle")}
                                                        onClick={() => onViewMember(member)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {canManageMember(member) && (
                                                        <>
                                                            <button
                                                                className={`${styles.actionButton} ${styles.kickButton}`}
                                                                title={t("tabs.members.kickTitle")}
                                                                onClick={() => onKickMember(member)}
                                                            >
                                                                <FaUserMinus />
                                                            </button>
                                                            {canSetRole(member) && (
                                                                <button
                                                                    className={`${styles.actionButton} ${styles.roleButton}`}
                                                                    title={t("tabs.members.setRoleTitle")}
                                                                    onClick={() => onSetMemberRole(member)}
                                                                >
                                                                    <FaCog />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 0 }}>
                                            <div className={styles.emptyState}>
                                                <FaUser className={styles.emptyIcon} />
                                                <h3 className={styles.emptyTitle}>{t("tabs.members.emptyTitle")}</h3>
                                                <p className={styles.emptySubtext}>{t("tabs.members.emptySubtext")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    {/* 分页区块 */}
                    {membersTotal > 0 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                {t("tabs.pagination.info", {
                                    start: (page - 1) * PAGE_SIZE + 1,
                                    end: Math.min(page * PAGE_SIZE, membersTotal),
                                    total: membersTotal,
                                })}
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={page === 1}
                                    onClick={() => onPageChange(page - 1)}
                                >
                                    {t("tabs.pagination.prev")}
                                </button>
                                {Array.from({ length: Math.ceil(membersTotal / PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${page === i + 1 ? styles.active : ""}`}
                                        onClick={() => onPageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={page === Math.ceil(membersTotal / PAGE_SIZE)}
                                    onClick={() => onPageChange(page + 1)}
                                >
                                    {t("tabs.pagination.next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 待处理请求视图 */}
            {showPendingRequests && canManageOrg(userRole, currentUser?.role) && (
                <>
                    {pendingRequestsLoading ? (
                        <div style={{ padding: "40px 0" }}>
                            <Loading />
                        </div>
                    ) : (
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th>{t("tabs.pending.colUser")}</th>
                                    <th>{t("tabs.pending.colApplyTime")}</th>
                                    <th>{t("tabs.pending.colActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.map((request) => (
                                        <tr key={request.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <Avatar
                                                        src={request.avatar}
                                                        name={request.name}
                                                        size={40}
                                                        className={styles.userAvatar}
                                                    />
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{request.name}</div>
                                                        {request.email && <div className={styles.userEmail}>{request.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label={t("tabs.pending.colApplyTime")}>{request.joinTime || "-"}</td>
                                            <td data-label={t("tabs.pending.colActions")}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.acceptButton}`}
                                                        title={t("tabs.pending.acceptTitle")}
                                                        onClick={() => onActionPendingRequest(request.id, "accept")}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.rejectButton}`}
                                                        title={t("tabs.pending.rejectTitle")}
                                                        onClick={() => onActionPendingRequest(request.id, "reject")}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ padding: 0 }}>
                                            <div className={styles.emptyState}>
                                                <FaHourglassHalf className={styles.emptyIcon} />
                                                <h3 className={styles.emptyTitle}>{t("tabs.pending.emptyTitle")}</h3>
                                                <p className={styles.emptySubtext}>{t("tabs.pending.emptySubtext")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    {/* 分页区块 - 待处理请求 */}
                    {pendingRequestsTotal > 0 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                {t("tabs.pagination.info", {
                                    start: (pendingRequestsPage - 1) * PAGE_SIZE + 1,
                                    end: Math.min(pendingRequestsPage * PAGE_SIZE, pendingRequestsTotal),
                                    total: pendingRequestsTotal,
                                })}
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={pendingRequestsPage === 1}
                                    onClick={() => onPendingPageChange(pendingRequestsPage - 1)}
                                >
                                    {t("tabs.pagination.prev")}
                                </button>
                                {Array.from({ length: Math.ceil(pendingRequestsTotal / PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${pendingRequestsPage === i + 1 ? styles.active : ""}`}
                                        onClick={() => onPendingPageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={pendingRequestsPage === Math.ceil(pendingRequestsTotal / PAGE_SIZE)}
                                    onClick={() => onPendingPageChange(pendingRequestsPage + 1)}
                                >
                                    {t("tabs.pagination.next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 任务列表视图 */}
            {showTasks && canManageOrg(userRole, currentUser?.role) && (
                <>
                    {tasksLoading ? (
                        <div style={{ padding: "40px 0" }}>
                            <Loading />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaTasks className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>{t("tabs.tasks.emptyTitle")}</h3>
                            <p className={styles.emptySubtext}>
                                {canManageOrg(userRole, currentUser?.role)
                                    ? t("tabs.tasks.emptyManageHint")
                                    : t("tabs.tasks.emptySubtext")}
                            </p>
                        </div>
                    ) : (
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left" }}>{t("tabs.tasks.colTask")}</th>
                                    <th>{t("tabs.tasks.colPriority")}</th>
                                    <th>{t("tabs.tasks.colAssignee")}</th>
                                    <th>{t("tabs.tasks.colDueDate")}</th>
                                    <th>{t("tabs.tasks.colStatus")}</th>
                                    <th>{t("tabs.tasks.colActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <tr key={task.id} className={styles.tableRow}>
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
                                                        <FaTasks />
                                                    </div>
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{task.title}</div>
                                                        {task.description && (
                                                            <div
                                                                className={styles.userEmail}
                                                                style={{
                                                                    marginTop: "4px",
                                                                    fontSize: "12px",
                                                                    color: "var(--text-secondary)",
                                                                    lineHeight: "1.4",
                                                                }}
                                                            >
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label={t("tabs.tasks.colPriority")} style={{ textAlign: "center" }}>
                                                <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                                                    <FaFlag />
                                                    {task.priority === "low" && t("tabs.tasks.priorityLow")}
                                                    {task.priority === "medium" && t("tabs.tasks.priorityMedium")}
                                                    {task.priority === "high" && t("tabs.tasks.priorityHigh")}
                                                    {task.priority === "urgent" && t("tabs.tasks.priorityUrgent")}
                                                </span>
                                            </td>
                                            <td data-label={t("tabs.tasks.colAssignee")} style={{ textAlign: "center" }}>
                                                {task.assignee_name || (
                                                    <span
                                                        style={{
                                                            color: "var(--text-secondary)",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        {t("tabs.tasks.unassigned")}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label={t("tabs.tasks.colDueDate")} style={{ textAlign: "center" }}>
                                                {task.due_date ? (
                                                    <span
                                                        style={{
                                                            color: "var(--warning)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <FaCalendarAlt />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "var(--text-secondary)",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        {t("tabs.tasks.noDueDate")}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label={t("tabs.tasks.colStatus")} style={{ textAlign: "center" }}>
                                                <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                                                    {task.status === "draft" && <FaHourglassHalf />}
                                                    {task.status === "draft" && t("tabs.tasks.statusDraft")}
                                                    {task.status === "active" && <FaPlayCircle />}
                                                    {task.status === "active" && t("tabs.tasks.statusActive")}
                                                    {task.status === "closed" && <FaStopCircle />}
                                                    {task.status === "closed" && t("tabs.tasks.statusClosed")}
                                                </span>
                                            </td>
                                            <td data-label={t("tabs.tasks.colActions")} style={{ textAlign: "center" }}>
                                                <div className={styles.actionButtons} style={{ justifyContent: "center" }}>
                                                    <button
                                                        className={styles.actionButton}
                                                        title={t("tabs.tasks.viewTitle")}
                                                        onClick={() => onViewTask(task)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {canManageTask() && (
                                                        <>
                                                            <button
                                                                className={styles.actionButton}
                                                                title={t("tabs.tasks.editTitle")}
                                                                onClick={() => onEditTask(task)}
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                                                title={t("tabs.tasks.deleteTitle")}
                                                                onClick={() => onDeleteTask(task)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 0 }}>
                                            <div className={styles.emptyState}>
                                                <FaTasks className={styles.emptyIcon} />
                                                <h3 className={styles.emptyTitle}>{t("tabs.tasks.emptyTitle")}</h3>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    {/* 分页区块 - 任务列表 */}
                    {tasksTotal > 0 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                {t("tabs.pagination.info", {
                                    start: (tasksPage - 1) * TASKS_PAGE_SIZE + 1,
                                    end: Math.min(tasksPage * TASKS_PAGE_SIZE, tasksTotal),
                                    total: tasksTotal,
                                })}
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={tasksPage === 1}
                                    onClick={() => onTasksPageChange(tasksPage - 1)}
                                >
                                    {t("tabs.pagination.prev")}
                                </button>
                                {Array.from({ length: Math.ceil(tasksTotal / TASKS_PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${tasksPage === i + 1 ? styles.active : ""}`}
                                        onClick={() => onRefreshTasks(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={tasksPage === Math.ceil(tasksTotal / TASKS_PAGE_SIZE)}
                                    onClick={() => onTasksPageChange(tasksPage + 1)}
                                >
                                    {t("tabs.pagination.next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 仓库列表视图 */}
            {showRepos && userRole != null && (
                <OrganizationRepos
                    orgId={org?.id || ""}
                    canManage={canManageOrg(userRole, currentUser?.role)}
                    refreshKey={reposRefreshKey}
                    onChange={onReposChange}
                />
            )}

            {/* Role Selection Modal */}
            <Modal
                visible={roleModalVisible}
                title={t("tabs.roleModal.title", { name: selectedMember?.name ?? "" })}
                onClose={onRoleModalClose}
                footer={
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button onClick={onRoleModalClose} className={styles.cancelButton}>
                            {t("tabs.roleModal.cancel")}
                        </button>
                        <button onClick={onConfirmRole} className={styles.confirmButton}>
                            {t("tabs.roleModal.confirm")}
                        </button>
                    </div>
                }
                width="450px"
                size="small"
            >
                <div className={styles.roleSelectionContainer}>
                    <p className={styles.roleSelectionDescription}>
                        {t("tabs.roleModal.description", { name: selectedMember?.name ?? "" })}
                    </p>
                    <div className={styles.roleOptions}>
                        {getAvailableRoleOptions().map((role) => (
                            <label
                                key={role.value}
                                className={`${styles.roleOption} ${selectedRole === role.value ? styles.selectedRole : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.value}
                                    checked={selectedRole === role.value}
                                    onChange={(e) => onRoleChange(parseInt(e.target.value))}
                                    style={{ display: "none" }}
                                />
                                <div className={styles.roleOptionContent}>
                                    <div className={styles.roleIcon}>{role.icon}</div>
                                    <div className={styles.roleInfo}>
                                        <div className={styles.roleLabel}>{role.label}</div>
                                        <div className={styles.roleDescription}>{role.description}</div>
                                    </div>
                                    <div className={styles.roleRadio}>
                                        <div className={styles.radioCircle}></div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* 预览模态框 */}
            <Modal
                visible={taskPreviewModalVisible}
                title={t("tabs.taskModal.title")}
                onClose={onTaskPreviewModalClose}
                width={600}
                footer={
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onTaskPreviewModalClose}>
                        {t("tabs.taskModal.close")}
                    </button>
                }
            >
                {selectedTask ? (
                    <div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("tabs.taskModal.taskTitle")}</div>
                            <div className={styles.detailValue} style={{ fontSize: "18px", fontWeight: 600 }}>
                                {selectedTask.title}
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.priority")}</div>
                                <div className={styles.detailValue}>
                                    <span className={`${styles.priorityBadge} ${styles[selectedTask.priority]}`}>
                                        <FaFlag />
                                        {selectedTask.priority === "low" && t("tabs.tasks.priorityLow")}
                                        {selectedTask.priority === "medium" && t("tabs.tasks.priorityMedium")}
                                        {selectedTask.priority === "high" && t("tabs.tasks.priorityHigh")}
                                        {selectedTask.priority === "urgent" && t("tabs.tasks.priorityUrgent")}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.currentStatus")}</div>
                                <div className={styles.detailValue}>
                                    <span className={`${styles.statusBadge} ${statusClassMap[selectedTask.status] || ""}`}>
                                        {selectedTask.status === "draft" && <FaHourglassHalf />}
                                        {selectedTask.status === "draft" && t("tabs.tasks.statusDraft")}
                                        {selectedTask.status === "active" && <FaPlayCircle />}
                                        {selectedTask.status === "active" && t("tabs.tasks.statusActive")}
                                        {selectedTask.status === "closed" && <FaStopCircle />}
                                        {selectedTask.status === "closed" && t("tabs.tasks.statusClosed")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.assignee")}</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.assignee_name || selectedTask.assignee || t("tabs.taskModal.unassigned")}
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.dueDate")}</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.due_date
                                        ? new Date(selectedTask.due_date).toLocaleString()
                                        : t("tabs.taskModal.noDueDate")}
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.maxFileSize")}</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.maxFileSize ? `${selectedTask.maxFileSize} MB` : t("tabs.taskModal.notSet")}
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.taskModal.allowedTypes")}</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.allowedTypes?.join(", ") || t("tabs.taskModal.unlimited")}
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("tabs.taskModal.description")}</div>
                            <div
                                className={styles.detailValue}
                                style={{
                                    background: "var(--bg-secondary)",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    minHeight: "80px",
                                }}
                            >
                                {selectedTask.description || t("tabs.taskModal.noDescription")}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            padding: "40px",
                        }}
                    >
                        {t("tabs.taskModal.notSelected")}
                    </div>
                )}
            </Modal>

            {/* 成员预览模态框 */}
            <Modal
                visible={memberPreviewModalVisible}
                title={t("tabs.memberModal.title")}
                onClose={onMemberPreviewModalClose}
                width={420}
                footer={
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onMemberPreviewModalClose}>
                        {t("tabs.memberModal.close")}
                    </button>
                }
            >
                {selectedMember ? (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                            <Avatar src={selectedMember.avatar} name={selectedMember.name} size={80} />
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 600 }}>{selectedMember.name}</div>
                                {selectedMember.email && (
                                    <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                                        {selectedMember.email}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.memberModal.role")}</div>
                                <div className={styles.detailValue}>
                                    <span
                                        className={`${styles.roleBadge} ${
                                            selectedMember.role === OrgRole.ORG_ADMIN
                                                ? styles.admin
                                                : selectedMember.role === OrgRole.DEV_LEAD
                                                  ? styles.moderator
                                                  : styles.user
                                        }`}
                                    >
                                        {selectedMember.role === OrgRole.ORG_ADMIN && (
                                            <FaCrown style={{ color: "#f7b500", marginRight: 4 }} />
                                        )}
                                        {selectedMember.role === OrgRole.DEV_LEAD && (
                                            <FaUserShield style={{ color: "#4caf50", marginRight: 4 }} />
                                        )}
                                        {selectedMember.role === OrgRole.DEVELOPER && (
                                            <FaCode style={{ color: "#2196f3", marginRight: 4 }} />
                                        )}
                                        {selectedMember.role === OrgRole.REPORTER && (
                                            <FaUserCheck style={{ color: "#2196f3", marginRight: 4 }} />
                                        )}
                                        {selectedMember.role === OrgRole.MEMBER && (
                                            <FaUser style={{ color: "#2196f3", marginRight: 4 }} />
                                        )}
                                        {enums.orgRole[selectedMember.role || OrgRole.MEMBER]}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>{t("tabs.memberModal.status")}</div>
                                <div className={styles.detailValue}>
                                    <span
                                        className={`${styles.statusBadge} ${selectedMember.status === "active" ? styles.active : styles.inactive}`}
                                    >
                                        <span className={styles.statusIndicator}></span>
                                        {selectedMember.status === "active"
                                            ? t("tabs.memberModal.statusActive")
                                            : t("tabs.memberModal.statusInactive")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>{t("tabs.memberModal.joinTime")}</div>
                            <div className={styles.detailValue}>{selectedMember.joinTime || "-"}</div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            padding: "40px",
                        }}
                    >
                        {t("tabs.memberModal.notSelected")}
                    </div>
                )}
            </Modal>

            {/* 添加仓库 Modal */}
            <Modal
                visible={repoModalVisible}
                title={t("tabs.repos.modalTitle")}
                onClose={() => setRepoModalVisible(false)}
                width={520}
                footer={
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button className={styles.cancelButton} onClick={() => setRepoModalVisible(false)}>
                            {t("tabs.repos.cancel")}
                        </button>
                        <button className={styles.confirmButton} onClick={handleAddRepo}>
                            {t("tabs.repos.confirm")}
                        </button>
                    </div>
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label className={styles.formLabel}>{t("tabs.repos.nameLabel")}</label>
                        <Input
                            placeholder={t("tabs.repos.namePlaceholder")}
                            value={repoForm.name}
                            onChange={(v) => setRepoForm((prev) => ({ ...prev, name: v }))}
                            size="large"
                        />
                    </div>
                    <div>
                        <label className={styles.formLabel}>{t("tabs.repos.urlLabel")}</label>
                        <Input
                            placeholder={t("tabs.repos.urlPlaceholder")}
                            value={repoForm.url}
                            onChange={(v) => setRepoForm((prev) => ({ ...prev, url: v }))}
                            size="large"
                        />
                    </div>
                    <div>
                        <label className={styles.formLabel}>{t("tabs.repos.tokenLabel")}</label>
                        <Input
                            type="password"
                            placeholder={t("tabs.repos.tokenPlaceholder")}
                            value={repoForm.token}
                            onChange={(v) => setRepoForm((prev) => ({ ...prev, token: v }))}
                            size="large"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrganizationTabs;

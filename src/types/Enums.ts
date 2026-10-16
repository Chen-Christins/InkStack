// ============================================================
// 枚举常量定义（状态、优先级、严重度等）
//
// 显示名（本地化）不再在此硬编码，统一通过 `useEnumLabels()`
// （src/i18n/UseEnumLabels.ts）按界面语言获取。
// ============================================================

// ===== 文章状态 =====

export const ArticleState = {
    REVIEWING: 1,
    PUBLISHED: 2,
    UNALLOWED: 3,
    PRIVATE: 4,
} as const;

export type ArticleState = (typeof ArticleState)[keyof typeof ArticleState];

// ===== 作业状态 =====

export const AssignmentStatus = {
    DRAFT: 0,
    OPEN: 1,
    CLOSED: 2,
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

// ===== 作业优先级 =====

export const AssignmentPriority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4,
} as const;

export type AssignmentPriority = (typeof AssignmentPriority)[keyof typeof AssignmentPriority];

// ===== 组织成员状态 =====

export const OrgMembershipStatus = {
    PENDING: 0,
    JOINED: 1,
    REJECTED: 2,
    LEFT: 3,
} as const;

// ===== 评论状态 =====

export const CommentStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    SPAM: "spam",
} as const;

export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

// ===== 备份/导出状态 =====

export const BackupStatus = {
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
} as const;

export type BackupStatus = (typeof BackupStatus)[keyof typeof BackupStatus];

// ===== RD 平台 - 需求状态 =====

export const ReqStatus = {
    NEW: "new",
    DEVELOPING: "developing",
    TESTING: "testing",
    DONE: "done",
    CLOSED: "closed",
} as const;

export type ReqStatus = (typeof ReqStatus)[keyof typeof ReqStatus];

// ===== RD 平台 - 缺陷状态 =====

export const BugStatus = {
    NEW: "new",
    PROCESSING: "processing",
    VERIFIED: "verified",
    CLOSED: "closed",
    REOPENED: "reopened",
} as const;

export type BugStatus = (typeof BugStatus)[keyof typeof BugStatus];

// ===== RD 平台 - 任务状态 =====

export const RdTaskStatus = {
    TODO: "todo",
    DOING: "doing",
    DONE: "done",
    CLOSED: "closed",
} as const;

export type RdTaskStatus = (typeof RdTaskStatus)[keyof typeof RdTaskStatus];

// ===== RD 平台 - 优先级 =====

export const RdPriority = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
} as const;

export type RdPriority = (typeof RdPriority)[keyof typeof RdPriority];

// ===== RD 平台 - 严重度 =====

export const Severity = {
    MINOR: "minor",
    NORMAL: "normal",
    SERIOUS: "serious",
    FATAL: "fatal",
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

// ===== 代码审查 - PR 状态 =====

export const CrState = {
    OPEN: "open",
    CLOSED: "closed",
    MERGED: "merged",
} as const;

export type CrState = (typeof CrState)[keyof typeof CrState];

// ===== 代码审查 - 审查状态 =====

export const ReviewStatus = {
    PENDING: "pending",
    REVIEWING: "reviewing",
    APPROVED: "approved",
    REJECTED: "rejected",
    CHANGES_REQUESTED: "changes_requested",
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

// ===== Agent 会话状态（类型来自 contracts/agent）=====

export type AgentSessionStatus = "queued" | "running" | "awaiting_permission" | "succeeded" | "failed" | "cancelled";

/** Agent 会话状态 → 徽标语义色 */
export const AgentSessionStatusTone: Record<AgentSessionStatus, "neutral" | "running" | "warning" | "success" | "danger"> = {
    queued: "neutral",
    running: "running",
    awaiting_permission: "warning",
    succeeded: "success",
    failed: "danger",
    cancelled: "danger",
};

// ===== Agent 提案状态（类型来自 contracts/agent）=====

export type ProposalStatus = "pending" | "approved" | "applying" | "rejected" | "applied" | "expired";

// ===== 仓库同步状态 =====

export const SyncStatus = {
    IDLE: "idle",
    SYNCING: "syncing",
    SUCCESS: "success",
    FAILED: "failed",
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

// ===== 反馈类型 =====

export const FeedbackType = {
    BUG: "bug",
    FEATURE: "feature",
    OTHER: "other",
    ALL: "",
} as const;

export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];

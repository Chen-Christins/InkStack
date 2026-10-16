/**
 * 枚举/角色显示名 Hook
 *
 * 将原本硬编码中文的 *Label 映射改为随界面语言变化的本地化映射。
 * 用法：const labels = useEnumLabels(); labels.articleState[state]
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ArticleState,
    AssignmentStatus,
    AssignmentPriority,
    OrgMembershipStatus,
    CommentStatus,
    BackupStatus,
    ReqStatus,
    BugStatus,
    RdTaskStatus,
    RdPriority,
    Severity,
    CrState,
    ReviewStatus,
    SyncStatus,
    FeedbackType,
    type AgentSessionStatus,
    type ProposalStatus,
} from "@/types/Enums.ts";
import { PlatformRole, OrgRole } from "@/types/Roles.ts";

export interface EnumLabels {
    articleState: Record<ArticleState, string>;
    assignmentStatus: Record<AssignmentStatus, string>;
    assignmentPriority: Record<AssignmentPriority, string>;
    orgMembershipStatus: Record<number, string>;
    commentStatus: Record<CommentStatus, string>;
    backupStatus: Record<BackupStatus, string>;
    reqStatus: Record<ReqStatus, string>;
    bugStatus: Record<BugStatus, string>;
    rdTaskStatus: Record<RdTaskStatus, string>;
    rdPriority: Record<RdPriority, string>;
    severity: Record<Severity, string>;
    crState: Record<CrState, string>;
    reviewStatus: Record<ReviewStatus, string>;
    agentSessionStatus: Record<AgentSessionStatus, string>;
    proposalStatus: Record<ProposalStatus, string>;
    syncStatus: Record<SyncStatus, string>;
    feedbackType: Record<string, string>;
    platformRole: Record<PlatformRole, string>;
    orgRole: Record<OrgRole, string>;
}

export function useEnumLabels(): EnumLabels {
    const { t } = useTranslation("enums");

    return useMemo(
        () => ({
            articleState: {
                [ArticleState.REVIEWING]: t("articleState.reviewing"),
                [ArticleState.PUBLISHED]: t("articleState.published"),
                [ArticleState.UNALLOWED]: t("articleState.unallowed"),
                [ArticleState.PRIVATE]: t("articleState.private"),
            },
            assignmentStatus: {
                [AssignmentStatus.DRAFT]: t("assignmentStatus.draft"),
                [AssignmentStatus.OPEN]: t("assignmentStatus.open"),
                [AssignmentStatus.CLOSED]: t("assignmentStatus.closed"),
            },
            assignmentPriority: {
                [AssignmentPriority.LOW]: t("assignmentPriority.low"),
                [AssignmentPriority.MEDIUM]: t("assignmentPriority.medium"),
                [AssignmentPriority.HIGH]: t("assignmentPriority.high"),
                [AssignmentPriority.URGENT]: t("assignmentPriority.urgent"),
            },
            orgMembershipStatus: {
                [OrgMembershipStatus.PENDING]: t("orgMembershipStatus.pending"),
                [OrgMembershipStatus.JOINED]: t("orgMembershipStatus.joined"),
                [OrgMembershipStatus.REJECTED]: t("orgMembershipStatus.rejected"),
                [OrgMembershipStatus.LEFT]: t("orgMembershipStatus.left"),
            },
            commentStatus: {
                [CommentStatus.PENDING]: t("commentStatus.pending"),
                [CommentStatus.APPROVED]: t("commentStatus.approved"),
                [CommentStatus.REJECTED]: t("commentStatus.rejected"),
                [CommentStatus.SPAM]: t("commentStatus.spam"),
            },
            backupStatus: {
                [BackupStatus.PROCESSING]: t("backupStatus.processing"),
                [BackupStatus.COMPLETED]: t("backupStatus.completed"),
                [BackupStatus.FAILED]: t("backupStatus.failed"),
            },
            reqStatus: {
                [ReqStatus.NEW]: t("reqStatus.new"),
                [ReqStatus.DEVELOPING]: t("reqStatus.developing"),
                [ReqStatus.TESTING]: t("reqStatus.testing"),
                [ReqStatus.DONE]: t("reqStatus.done"),
                [ReqStatus.CLOSED]: t("reqStatus.closed"),
            },
            bugStatus: {
                [BugStatus.NEW]: t("bugStatus.new"),
                [BugStatus.PROCESSING]: t("bugStatus.processing"),
                [BugStatus.VERIFIED]: t("bugStatus.verified"),
                [BugStatus.CLOSED]: t("bugStatus.closed"),
                [BugStatus.REOPENED]: t("bugStatus.reopened"),
            },
            rdTaskStatus: {
                [RdTaskStatus.TODO]: t("rdTaskStatus.todo"),
                [RdTaskStatus.DOING]: t("rdTaskStatus.doing"),
                [RdTaskStatus.DONE]: t("rdTaskStatus.done"),
                [RdTaskStatus.CLOSED]: t("rdTaskStatus.closed"),
            },
            rdPriority: {
                [RdPriority.LOW]: t("rdPriority.low"),
                [RdPriority.MEDIUM]: t("rdPriority.medium"),
                [RdPriority.HIGH]: t("rdPriority.high"),
                [RdPriority.URGENT]: t("rdPriority.urgent"),
            },
            severity: {
                [Severity.MINOR]: t("severity.minor"),
                [Severity.NORMAL]: t("severity.normal"),
                [Severity.SERIOUS]: t("severity.serious"),
                [Severity.FATAL]: t("severity.fatal"),
            },
            crState: {
                [CrState.OPEN]: t("crState.open"),
                [CrState.CLOSED]: t("crState.closed"),
                [CrState.MERGED]: t("crState.merged"),
            },
            reviewStatus: {
                [ReviewStatus.PENDING]: t("reviewStatus.pending"),
                [ReviewStatus.REVIEWING]: t("reviewStatus.reviewing"),
                [ReviewStatus.APPROVED]: t("reviewStatus.approved"),
                [ReviewStatus.REJECTED]: t("reviewStatus.rejected"),
                [ReviewStatus.CHANGES_REQUESTED]: t("reviewStatus.changes_requested"),
            },
            agentSessionStatus: {
                queued: t("agentSessionStatus.queued"),
                running: t("agentSessionStatus.running"),
                awaiting_permission: t("agentSessionStatus.awaiting_permission"),
                succeeded: t("agentSessionStatus.succeeded"),
                failed: t("agentSessionStatus.failed"),
                cancelled: t("agentSessionStatus.cancelled"),
            },
            proposalStatus: {
                pending: t("proposalStatus.pending"),
                approved: t("proposalStatus.approved"),
                applying: t("proposalStatus.applying"),
                rejected: t("proposalStatus.rejected"),
                applied: t("proposalStatus.applied"),
                expired: t("proposalStatus.expired"),
            },
            syncStatus: {
                [SyncStatus.IDLE]: t("syncStatus.idle"),
                [SyncStatus.SYNCING]: t("syncStatus.syncing"),
                [SyncStatus.SUCCESS]: t("syncStatus.success"),
                [SyncStatus.FAILED]: t("syncStatus.failed"),
            },
            feedbackType: {
                [FeedbackType.BUG]: t("feedbackType.bug"),
                [FeedbackType.FEATURE]: t("feedbackType.feature"),
                [FeedbackType.OTHER]: t("feedbackType.other"),
                [FeedbackType.ALL]: t("feedbackType.all"),
            },
            platformRole: {
                [PlatformRole.USER]: t("platformRole.user"),
                [PlatformRole.ADMIN]: t("platformRole.admin"),
                [PlatformRole.EDITOR]: t("platformRole.editor"),
                [PlatformRole.CHECKER]: t("platformRole.checker"),
            },
            orgRole: {
                [OrgRole.MEMBER]: t("orgRole.member"),
                [OrgRole.REPORTER]: t("orgRole.reporter"),
                [OrgRole.DEVELOPER]: t("orgRole.developer"),
                [OrgRole.DEV_LEAD]: t("orgRole.devLead"),
                [OrgRole.ORG_ADMIN]: t("orgRole.orgAdmin"),
            },
        }),
        [t],
    );
}

export default useEnumLabels;

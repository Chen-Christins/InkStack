import i18n from "@/i18n";
import type { EngineEvent, SessionStatus, ProposalView } from "../../contracts/agent";
import type { SessionHandle, EngineEventListener, PermissionDecision } from "./Types.ts";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 事件间隔 300–600ms，模拟真实流式输出的节奏 */
const randomDelay = () => 300 + Math.floor(Math.random() * 301);

const randomToken = (length: number) => Array.from({ length }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

/**
 * mock 会话数据源：按剧本异步 emit 事件。
 * 剧本：running → chunk → tool_call(get_ticket) → tool_result → chunk
 *   → awaiting_permission → permission_request（挂起等待用户点击）
 *   → [批准] running → tool_call(update_ticket_status) → tool_result → chunk → succeeded
 *   → [拒绝] chunk → cancelled
 */
export function createMockSession(onSid: (sid: string) => void): SessionHandle {
    const sid = `ses_${randomToken(12)}`;
    onSid(sid);
    const listeners = new Set<EngineEventListener>();
    const decisions = new Map<string, PermissionDecision>();
    const decisionResolvers = new Map<string, () => void>();
    const proposalDecisions = new Map<string, PermissionDecision>();
    const proposalResolvers = new Map<string, () => void>();
    let seq = 0;
    let disposed = false;
    let proposal: ProposalView | null = null;

    const emit = (event: EngineEvent) => {
        if (disposed) {
            return;
        }
        listeners.forEach((listener) => listener(event));
    };

    const chunk = (text: string) => emit({ type: "assistant_chunk", seq: ++seq, ts: new Date().toISOString(), text });
    const toolCall = (tool: string, argsDigest: string) =>
        emit({ type: "tool_call", seq: ++seq, ts: new Date().toISOString(), tool, argsDigest });
    const toolResult = (tool: string, ok: boolean, summary?: string) =>
        emit({ type: "tool_result", seq: ++seq, ts: new Date().toISOString(), tool, ok, summary });
    const statusChange = (status: SessionStatus, detail?: string) =>
        emit({ type: "status_change", seq: ++seq, ts: new Date().toISOString(), status, detail });
    const proposalLifecycle = (
        event: "created" | "approved" | "rejected" | "applied" | "expired",
        next: ProposalView,
        actor: string,
        note?: string,
    ) =>
        emit({
            type: "proposal_lifecycle",
            seq: ++seq,
            ts: next.updatedAt,
            event,
            actor,
            proposal: next,
            note,
        });

    const waitForDecision = (requestId: string): Promise<PermissionDecision> =>
        new Promise((resolve) => {
            const decided = decisions.get(requestId);
            if (decided) {
                resolve(decided);
                return;
            }
            decisionResolvers.set(requestId, () => resolve(decisions.get(requestId) ?? "reject"));
        });

    const waitForProposalDecision = (proposalId: string): Promise<PermissionDecision> =>
        new Promise((resolve) => {
            const decided = proposalDecisions.get(proposalId);
            if (decided) {
                resolve(decided);
                return;
            }
            proposalResolvers.set(proposalId, () => resolve(proposalDecisions.get(proposalId) ?? "reject"));
        });

    const run = async () => {
        statusChange("running", i18n.t("services:agentMock.statusRunning"));
        await sleep(randomDelay());
        if (disposed) {
            return;
        }
        chunk(i18n.t("services:agentMock.chunkGreeting"));
        await sleep(randomDelay());
        if (disposed) {
            return;
        }
        toolCall("get_ticket", '{"ticketId":"TCK-1024"}');
        await sleep(randomDelay());
        if (disposed) {
            return;
        }
        toolResult("get_ticket", true, i18n.t("services:agentMock.toolResultGetTicket"));
        await sleep(randomDelay());
        if (disposed) {
            return;
        }
        chunk(i18n.t("services:agentMock.chunkReadDetail"));
        await sleep(randomDelay());
        if (disposed) {
            return;
        }
        statusChange("awaiting_permission", i18n.t("services:agentMock.statusAwaitingPermission"));
        const requestId = `req_${randomToken(10)}`;
        emit({
            type: "permission_request",
            seq: ++seq,
            ts: new Date().toISOString(),
            requestId,
            tool: "update_ticket_status",
            reason: i18n.t("services:agentMock.permissionReason"),
        });

        const decision = await waitForDecision(requestId);
        if (disposed) {
            return;
        }
        if (decision === "approve") {
            // 状态机（图 2）：awaiting_permission --批准--> running --> succeeded
            statusChange("running", i18n.t("services:agentMock.statusResuming"));
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            toolCall("update_ticket_status", '{"ticketId":"TCK-1024","status":"in_progress"}');
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            toolResult("update_ticket_status", true, i18n.t("services:agentMock.toolResultUpdateTicket"));
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            const createdAt = new Date().toISOString();
            proposal = {
                id: `p_${randomToken(12)}`,
                sessionId: sid,
                orgId: 1,
                tool: "update_ticket_status",
                subjectType: "bug",
                subjectHashId: "TCK-1024",
                fromStatus: i18n.t("services:agentMock.proposalFromStatus"),
                toStatus: i18n.t("services:agentMock.proposalToStatus"),
                reason: i18n.t("services:agentMock.proposalReason"),
                status: "pending",
                expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
                updatedAt: createdAt,
            };
            proposalLifecycle("created", proposal, "agent");
            const proposalDecision = await waitForProposalDecision(proposal.id);
            if (disposed) {
                return;
            }
            if (proposalDecision === "approve") {
                await sleep(randomDelay());
                if (disposed || !proposal) {
                    return;
                }
                proposal = {
                    ...proposal,
                    status: "applied",
                    updatedAt: new Date().toISOString(),
                    note: i18n.t("services:agentMock.proposalNote"),
                };
                proposalLifecycle("applied", proposal, "system", proposal.note);
                await sleep(randomDelay());
                if (disposed) {
                    return;
                }
                chunk(i18n.t("services:agentMock.chunkProposalApplied"));
            } else {
                await sleep(randomDelay());
                if (disposed) {
                    return;
                }
                chunk(i18n.t("services:agentMock.chunkProposalRejected"));
            }
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            statusChange(
                "succeeded",
                proposalDecision === "approve"
                    ? i18n.t("services:agentMock.statusProposalApplied")
                    : i18n.t("services:agentMock.statusProposalRejected"),
            );
        } else {
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            chunk(i18n.t("services:agentMock.chunkCancelled"));
            await sleep(randomDelay());
            if (disposed) {
                return;
            }
            statusChange("cancelled", i18n.t("services:agentMock.statusPermissionRejected"));
        }
    };

    return {
        sid,
        start() {
            void run();
        },
        subscribe(listener: EngineEventListener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        answerPermission(requestId: string, decision: PermissionDecision) {
            decisions.set(requestId, decision);
            const resolve = decisionResolvers.get(requestId);
            if (resolve) {
                decisionResolvers.delete(requestId);
                resolve();
            }
        },
        async decideProposal(proposalId: string, decision: PermissionDecision, note?: string) {
            if (!proposal || proposal.id !== proposalId) {
                throw new Error(i18n.t("services:agentMock.unknownProposal", { id: proposalId }));
            }
            if (proposal.status !== "pending") {
                return;
            }
            proposalDecisions.set(proposalId, decision);
            proposal = {
                ...proposal,
                status: decision === "approve" ? "approved" : "rejected",
                updatedAt: new Date().toISOString(),
                ...(note ? { note } : {}),
            };
            proposalLifecycle(decision === "approve" ? "approved" : "rejected", proposal, "user:1", note);
            const resolve = proposalResolvers.get(proposalId);
            if (resolve) {
                proposalResolvers.delete(proposalId);
                resolve();
            }
        },
        cancel() {
            disposed = true;
            listeners.clear();
            decisionResolvers.clear();
            proposalResolvers.clear();
        },
        dispose() {
            disposed = true;
            listeners.clear();
            decisionResolvers.clear();
            proposalResolvers.clear();
        },
    };
}

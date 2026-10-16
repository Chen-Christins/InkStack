/**
 * Agent 会话面板（TH-RFC-001 §05.4）
 *
 * 默认用内置 mock 事件流驱动 UI；`?driver=gateway` 经同源代理连接本机 Gateway：
 * 状态徽标（queued/running/awaiting_permission/succeeded/failed/cancelled）、
 * 事件流（assistant/tool/runner permission/product proposal/status/error）、runner 权限卡，
 * 以及独立的产品写提案卡（批准后仍由 MCP worker 重校验并幂等应用）。
 *
 * 当前从研发平台统一入口 `/rd/agent` 访问；真实写入仍受生产 BFF 集成门禁保护。
 */
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import SimpleBar from "simplebar-react";
import { FaBolt, FaCheckCircle, FaCog, FaInfoCircle, FaRedo, FaShieldAlt, FaTimesCircle, FaWrench } from "react-icons/fa";
import Button from "@/components/button/Button";
import Avatar from "@/components/avatar/Avatar";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import Skeleton from "@/components/skeleton/Skeleton";
import message from "@/components/message/Message";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import AgentApiConfigCard from "./AgentApiConfigCard";
import { createGatewaySession } from "@/services/agentSession/Gateway.ts";
import { createMockSession } from "@/services/agentSession/Mock.ts";
import type { SessionHandle, PermissionDecision } from "@/services/agentSession/Types.ts";
import type { EngineEvent as SharedEngineEvent, SessionStatus as SharedSessionStatus } from "../../contracts/agent";
import styles from "./AgentSessionPanel.module.css";

/** UI and drivers consume the shared event contract. */
export type SessionStatus = SharedSessionStatus;
export type EngineEvent = SharedEngineEvent;

/** 状态 → 徽标语义色映射（见 .module.css 中 badge--* 类） */
const STATUS_TONE: Record<SessionStatus, "neutral" | "running" | "warning" | "success" | "danger"> = {
    queued: "neutral",
    running: "running",
    awaiting_permission: "warning",
    succeeded: "success",
    failed: "danger",
    cancelled: "danger",
};

const formatTime = (ts: string) => {
    const date = new Date(ts);
    return Number.isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString("zh-CN", { hour12: false });
};

const AgentSessionPanel: React.FC = () => {
    const { t } = useTranslation("rd");
    const enums = useEnumLabels();
    const [searchParams, setSearchParams] = useSearchParams();
    const isGatewayDriver = searchParams.get("driver") === "gateway";
    // runId 变化时重开一场 mock 会话（重新演示）
    const [runId, setRunId] = useState(0);
    const [sid, setSid] = useState("");
    const [status, setStatus] = useState<SessionStatus>("queued");
    const [events, setEvents] = useState<EngineEvent[]>([]);
    const [decisions, setDecisions] = useState<Record<string, PermissionDecision>>({});
    const [proposalBusy, setProposalBusy] = useState<Record<string, boolean>>({});
    const [configOpen, setConfigOpen] = useState(false);
    const sessionRef = useRef<SessionHandle | null>(null);
    const scrollBodyRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // ?driver=gateway 接真实 Gateway（mock 为默认）；Agent 会话页
        const session = isGatewayDriver ? createGatewaySession(setSid) : createMockSession(setSid);
        sessionRef.current = session;
        setSid(session.sid);
        setStatus("queued");
        setEvents([]);
        setDecisions({});
        setProposalBusy({});
        const unsubscribe = session.subscribe((event) => {
            setEvents((prev) => [...prev, event]);
            if (event.type === "status_change") {
                setStatus(event.status);
            }
        });
        session.start();
        return () => {
            unsubscribe();
            session.dispose();
            sessionRef.current = null;
        };
    }, [isGatewayDriver, runId]);

    // 新事件到达后自动滚到底部
    useEffect(() => {
        const el = scrollBodyRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [events]);

    const handleRestart = () => {
        sessionRef.current?.cancel();
        setRunId((n) => n + 1);
    };

    const handleDriverChange = (driver: "mock" | "gateway") => {
        if ((driver === "gateway") === isGatewayDriver) {
            return;
        }

        sessionRef.current?.cancel();
        const nextParams = new URLSearchParams(searchParams);
        if (driver === "gateway") {
            nextParams.set("driver", "gateway");
        } else {
            nextParams.delete("driver");
        }
        setSearchParams(nextParams, { replace: true });
    };

    const handleDecision = (requestId: string, decision: PermissionDecision) => {
        sessionRef.current?.answerPermission(requestId, decision);
        setDecisions((prev) => ({ ...prev, [requestId]: decision }));
        if (decision === "approve") {
            message.success(t("agent.message.approvedToolCall"));
        } else {
            message.warn(t("agent.message.rejectedToolCall"));
        }
    };

    const handleProposalDecision = async (proposalId: string, decision: PermissionDecision): Promise<void> => {
        setProposalBusy((prev) => ({ ...prev, [proposalId]: true }));
        try {
            await sessionRef.current?.decideProposal(proposalId, decision);
            if (decision === "approve") {
                message.success(t("agent.message.proposalApproved"));
            } else message.warn(t("agent.message.proposalRejected"));
        } catch {
            message.error(t("agent.message.proposalFailed"));
        } finally {
            setProposalBusy((prev) => ({ ...prev, [proposalId]: false }));
        }
    };

    // 生命周期事件保留在 events 计数中；同一提案只渲染最新快照，避免旧 pending 卡仍可点击。
    const visibleEvents = events.filter((event, index) => {
        if (event.type !== "proposal_lifecycle") {
            return true;
        }
        return !events.slice(index + 1).some((next) => next.type === "proposal_lifecycle" && next.proposal.id === event.proposal.id);
    });

    const renderEvent = (event: EngineEvent): ReactNode => {
        switch (event.type) {
            case "assistant_chunk":
                return (
                    <div className={styles.chunkRow} data-event-type="assistant_chunk">
                        <Avatar name="TechHaven Agent" size={32} />
                        <div className={styles.chunkBody}>
                            <div className={styles.chunkMeta}>
                                <span>TechHaven Agent</span>
                                <span className={styles.chunkTime}>{formatTime(event.ts)}</span>
                            </div>
                            <div className={styles.chunkBubble}>{event.text}</div>
                        </div>
                    </div>
                );
            case "tool_call":
                return (
                    <div className={styles.toolCard}>
                        <div className={styles.toolHead}>
                            <FaWrench aria-hidden="true" />
                            <span>{t("agent.event.toolCall")}</span>
                            <span className={styles.toolName}>{event.tool}</span>
                            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                        </div>
                        <div className={styles.toolDigest}>{event.argsDigest}</div>
                    </div>
                );
            case "tool_result":
                return (
                    <div className={`${styles.toolCard} ${event.ok ? styles.toolCardOk : styles.toolCardFail}`}>
                        <div className={styles.toolHead}>
                            {event.ok ? (
                                <FaCheckCircle className={styles.toolIconOk} aria-hidden="true" />
                            ) : (
                                <FaTimesCircle className={styles.toolIconFail} aria-hidden="true" />
                            )}
                            <span>{event.ok ? t("agent.event.toolSuccess") : t("agent.event.toolFailed")}</span>
                            <span className={styles.toolName}>{event.tool}</span>
                            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                        </div>
                        {event.summary && <div className={styles.toolSummary}>{event.summary}</div>}
                    </div>
                );
            case "permission_request": {
                const decision = decisions[event.requestId];
                return (
                    <div className={styles.permissionCard}>
                        <div className={styles.permEyebrow}>{t("agent.permission.eyebrow")}</div>
                        <div className={styles.permTitle}>
                            <FaShieldAlt aria-hidden="true" />
                            <span>{t("agent.permission.question")}</span>
                            <span className={styles.toolName}>{event.tool}</span>
                            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                        </div>
                        {event.reason && <p className={styles.permReason}>{event.reason}</p>}
                        <p className={styles.permHint}>{t("agent.permission.hint")}</p>
                        {decision ? (
                            <div
                                className={`${styles.permDecision} ${decision === "approve" ? styles.permDecisionOk : styles.permDecisionNo}`}
                            >
                                {decision === "approve" ? <FaCheckCircle aria-hidden="true" /> : <FaTimesCircle aria-hidden="true" />}
                                <span>
                                    {decision === "approve"
                                        ? isGatewayDriver
                                            ? t("agent.permission.approvedGateway")
                                            : t("agent.permission.approvedLocal")
                                        : t("agent.permission.rejected")}
                                </span>
                            </div>
                        ) : (
                            <div className={styles.permActions}>
                                <Button
                                    className={styles.actionButton}
                                    color="success"
                                    size="small"
                                    onClick={() => handleDecision(event.requestId, "approve")}
                                >
                                    {t("agent.permission.allow")}
                                </Button>
                                <Button
                                    className={styles.actionButton}
                                    color="error"
                                    variant="light"
                                    size="small"
                                    onClick={() => handleDecision(event.requestId, "reject")}
                                >
                                    {t("agent.permission.deny")}
                                </Button>
                            </div>
                        )}
                    </div>
                );
            }
            case "proposal_lifecycle": {
                const proposal = event.proposal;
                const pending = proposal.status === "pending";
                const busy = proposalBusy[proposal.id] === true;
                const terminalTone =
                    proposal.status === "applied"
                        ? styles.proposalResultOk
                        : proposal.status === "rejected" || proposal.status === "expired"
                          ? styles.proposalResultNo
                          : styles.proposalResultPending;
                return (
                    <div className={styles.proposalCard} data-proposal-status={proposal.status}>
                        <div className={styles.proposalEyebrow}>{t("agent.proposal.eyebrow")}</div>
                        <div className={styles.proposalTitleRow}>
                            <FaShieldAlt aria-hidden="true" />
                            <strong>{proposal.subjectHashId}</strong>
                            <span className={styles.proposalTransition}>
                                {proposal.fromStatus} → {proposal.toStatus}
                            </span>
                            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                        </div>
                        <p className={styles.proposalReason}>{proposal.reason}</p>
                        <div className={styles.proposalMeta}>
                            <span>{proposal.tool}</span>
                            <span>{proposal.subjectType}</span>
                            <span title={proposal.expiresAt}>
                                {t("agent.proposal.expires", { time: formatTime(proposal.expiresAt) })}
                            </span>
                        </div>
                        {proposal.note && <p className={styles.proposalNote}>{proposal.note}</p>}
                        {pending ? (
                            <div className={styles.permActions}>
                                <Button
                                    className={styles.actionButton}
                                    color="success"
                                    size="small"
                                    loading={busy}
                                    disabled={busy}
                                    onClick={() => void handleProposalDecision(proposal.id, "approve")}
                                >
                                    {t("agent.proposal.approve")}
                                </Button>
                                <Button
                                    className={styles.actionButton}
                                    color="error"
                                    variant="light"
                                    size="small"
                                    disabled={busy}
                                    onClick={() => void handleProposalDecision(proposal.id, "reject")}
                                >
                                    {t("agent.proposal.reject")}
                                </Button>
                            </div>
                        ) : (
                            <div className={`${styles.proposalResult} ${terminalTone}`} role="status">
                                {proposal.status === "applied" ? (
                                    <FaCheckCircle aria-hidden="true" />
                                ) : (
                                    <FaInfoCircle aria-hidden="true" />
                                )}
                                <span>{enums.proposalStatus[proposal.status]}</span>
                                {proposal.status === "approved" && <Loading size="small" text="" />}
                            </div>
                        )}
                        <p className={styles.permHint}>{t("agent.proposal.hint")}</p>
                    </div>
                );
            }
            case "status_change":
                return (
                    <div className={styles.statusRow}>
                        <span className={styles.statusLine} />
                        <span className={styles.statusName}>
                            {t("agent.status.transition", { status: enums.agentSessionStatus[event.status] })}
                        </span>
                        {event.detail && <span className={styles.statusDetail}>{event.detail}</span>}
                        <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                        <span className={styles.statusLine} />
                    </div>
                );
            case "error":
                return (
                    <div className={styles.errorRow}>
                        <FaTimesCircle aria-hidden="true" />
                        <span>{event.message}</span>
                        <span className={styles.toolTime}>{formatTime(event.ts)}</span>
                    </div>
                );
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                <div className={styles.eyebrow}>
                    <span className={styles.eyebrowDot} aria-hidden="true" />
                    Agent Control Plane · R1
                </div>
                <h1 className={styles.title}>{t("agent.hero.title")}</h1>
                <p className={styles.desc}>{t("agent.hero.description")}</p>
                <div className={styles.heroControls}>
                    <div className={styles.modePicker} role="group" aria-label={t("agent.hero.modeAria")}>
                        <span className={styles.modeLabel}>{t("agent.hero.modeLabel")}</span>
                        <div className={styles.modeActions}>
                            <Button
                                className={styles.modeButton}
                                color="primary"
                                variant={isGatewayDriver ? "light" : "solid"}
                                size="small"
                                aria-pressed={!isGatewayDriver}
                                onClick={() => handleDriverChange("mock")}
                            >
                                {t("agent.hero.modeMock")}
                            </Button>
                            <Button
                                className={styles.modeButton}
                                color="primary"
                                variant={isGatewayDriver ? "solid" : "light"}
                                size="small"
                                aria-pressed={isGatewayDriver}
                                onClick={() => handleDriverChange("gateway")}
                            >
                                {t("agent.hero.modeGateway")}
                            </Button>
                        </div>
                    </div>
                    <Button className={styles.configButton} color="secondary" variant="light" onClick={() => setConfigOpen(true)}>
                        <FaCog aria-hidden="true" />
                        {t("agent.hero.apiConfig")}
                    </Button>
                </div>
            </header>

            <section className={styles.panel} aria-label={t("agent.panel.ariaLabel")}>
                <header className={styles.header}>
                    <div className={styles.sessionIdentity}>
                        <div className={styles.agentMark} aria-hidden="true">
                            <FaBolt />
                        </div>
                        <div className={styles.sessionCopy}>
                            <div className={styles.sessionTitleRow}>
                                <h2 className={styles.sessionTitle}>{t("agent.session.title")}</h2>
                                <span className={`${styles.badge} ${styles[`badge--${STATUS_TONE[status]}`]}`} role="status">
                                    <span className={`${styles.badgeDot} ${status === "running" ? styles.badgeDotPulse : ""}`} />
                                    {enums.agentSessionStatus[status]}
                                </span>
                            </div>
                            <span className={styles.sid} title={sid}>
                                {sid || t("agent.session.sidPlaceholder")}
                            </span>
                        </div>
                    </div>
                    <Button className={styles.restartButton} color="secondary" variant="light" size="small" onClick={handleRestart}>
                        <FaRedo aria-hidden="true" />
                        {t("agent.session.restart")}
                    </Button>
                </header>

                <div className={styles.contextBar} aria-label={t("agent.context.ariaLabel")}>
                    <div className={styles.contextItem}>
                        <span className={styles.contextLabel}>{t("agent.context.driverLabel")}</span>
                        <strong>{isGatewayDriver ? "Gateway" : "Local Mock"}</strong>
                    </div>
                    <div className={styles.contextDivider} aria-hidden="true" />
                    <div className={styles.contextItem}>
                        <span className={styles.contextLabel}>{t("agent.context.eventCount")}</span>
                        <strong>{events.length}</strong>
                    </div>
                    <div className={styles.contextDivider} aria-hidden="true" />
                    <div className={styles.contextItem}>
                        <span className={styles.contextLabel}>{t("agent.context.lastUpdated")}</span>
                        <strong>{events.length > 0 ? formatTime(events[events.length - 1].ts) : t("agent.context.waiting")}</strong>
                    </div>
                </div>

                <div className={styles.stream}>
                    <SimpleBar scrollableNodeProps={{ ref: scrollBodyRef }} style={{ maxHeight: 440 }} autoHide={false}>
                        <div className={styles.timeline} aria-live="polite" aria-label={t("agent.stream.ariaLabel")}>
                            {events.length === 0 && (
                                <div className={styles.streamSkeleton}>
                                    <Skeleton variant="text" lines={3} height={14} />
                                </div>
                            )}
                            {visibleEvents.map((event) => (
                                <React.Fragment key={`${event.seq}`}>{renderEvent(event)}</React.Fragment>
                            ))}
                            {status === "running" && (
                                <div className={styles.streamLoadingRow}>
                                    <Loading size="small" text="" />
                                    <span>{isGatewayDriver ? t("agent.stream.gatewayLoading") : t("agent.stream.localLoading")}</span>
                                </div>
                            )}
                        </div>
                    </SimpleBar>
                </div>

                <footer className={styles.footer}>
                    <div className={styles.footerNote}>
                        <FaInfoCircle aria-hidden="true" />
                        <span>{isGatewayDriver ? t("agent.footer.gatewayNote") : t("agent.footer.localNote")}</span>
                    </div>
                    <span className={styles.footerMono}>SSE · versioned envelope · staged approval</span>
                </footer>
            </section>

            <Modal visible={configOpen} title={t("agent.config.title")} onClose={() => setConfigOpen(false)} width={720} footer={null}>
                <div className={styles.configNotice} role="note">
                    <FaShieldAlt aria-hidden="true" />
                    <div>
                        <strong>{t("agent.config.noticeTitle")}</strong>
                        <p>{t("agent.config.noticeBody")}</p>
                    </div>
                </div>
                <AgentApiConfigCard />
            </Modal>
        </div>
    );
};

export default AgentSessionPanel;

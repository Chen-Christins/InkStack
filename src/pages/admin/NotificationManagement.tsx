import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaBell, FaPaperPlane, FaTimes } from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import DatePicker from "@/components/datePicker/DatePicker";
import Switch from "@/components/switch/Switch";
import message from "@/components/message/Message";
import NotificationService from "@/services/NotificationService.ts";
import type { SelectOption } from "@/types";
import styles from "./NotificationManagement.module.css";

const NotificationManagement: React.FC = () => {
    const { t } = useTranslation("admin");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("system");
    const [target, setTarget] = useState<"all" | "users">("all");
    const [userIds, setUserIds] = useState("");
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [broadcastLevel, setBroadcastLevel] = useState<string>("info");
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [sending, setSending] = useState(false);
    const [activeBroadcasts, setActiveBroadcasts] = useState<{ id: number; title: string; content: string; level: string }[]>([]);

    const fetchBroadcasts = async () => {
        try {
            const list = await NotificationService.getBroadcasts();
            setActiveBroadcasts(list);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const handleCloseBroadcast = async (id: number) => {
        try {
            await NotificationService.closeBroadcast(id);
            message.success(t("notifications.message.broadcastClosed"));
            fetchBroadcasts();
        } catch (err: any) {
            message.error(err?.message || t("notifications.message.closeFailed"));
        }
    };

    const broadcastLevelOptions: SelectOption[] = [
        { id: "info", name: t("notifications.level.info"), color: "#3b82f6" },
        { id: "warning", name: t("notifications.level.warning"), color: "#f59e0b" },
        { id: "danger", name: t("notifications.level.danger"), color: "#ef4444" },
    ];

    const typeOptions: SelectOption[] = [
        { id: "system", name: t("notifications.type.system"), color: "#6366f1" },
        { id: "announcement", name: t("notifications.type.announcement"), color: "#f59e0b" },
        { id: "article", name: t("notifications.type.article"), color: "#10b981" },
    ];

    const targetOptions: SelectOption[] = [
        { id: "all", name: t("notifications.target.all"), color: "#6366f1" },
        { id: "users", name: t("notifications.target.users"), color: "#f59e0b" },
    ];

    const handleSend = async () => {
        if (!title.trim()) {
            message.error(t("notifications.message.titleRequired"));
            return;
        }
        if (!content.trim()) {
            message.error(t("notifications.message.contentRequired"));
            return;
        }
        if (target === "users" && !userIds.trim()) {
            message.error(t("notifications.message.targetRequired"));
            return;
        }
        if (isBroadcast && endTime && startTime && endTime <= startTime) {
            message.error(t("notifications.message.endBeforeStart"));
            return;
        }

        setSending(true);
        try {
            await NotificationService.sendNotification({
                title: title.trim(),
                content: content.trim(),
                type,
                target,
                user_ids: target === "users" ? userIds.trim() : undefined,
                is_broadcast: isBroadcast,
                level: isBroadcast ? broadcastLevel : undefined,
                start_time: isBroadcast && startTime ? Math.floor(startTime.getTime() / 1000) : undefined,
                end_time: isBroadcast && endTime ? Math.floor(endTime.getTime() / 1000) : undefined,
            });
            message.success(isBroadcast ? t("notifications.message.broadcastCreated") : t("notifications.message.sendSuccess"));
            setTitle("");
            setContent("");
            setUserIds("");
            setIsBroadcast(false);
            setStartTime(null);
            setEndTime(null);
            if (isBroadcast) {
                fetchBroadcasts();
            }
        } catch (err: any) {
            message.error(err.message || t("notifications.message.sendFailed"));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.notificationManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>
                        <FaBell />
                        {t("notifications.page.title")}
                    </h1>
                    <p className={styles.pageDescription}>{t("notifications.page.description")}</p>
                </div>
            </div>

            {/* 表单卡片 */}
            <div className={styles.formCard}>
                <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>{t("notifications.form.settingsTitle")}</h3>

                    <div className={styles.formGrid}>
                        {/* 通知类型 */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("notifications.form.typeLabel")}</label>
                            <CustomSelect
                                name={t("notifications.form.typeLabel")}
                                options={typeOptions}
                                value={typeOptions.find((o) => o.id === type) || null}
                                onChange={(option) => setType(String(option?.id || "system"))}
                                placeholder={t("notifications.form.typePlaceholder")}
                                hideBadge={true}
                            />
                        </div>

                        {/* 发送目标 */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("notifications.form.targetLabel")}</label>
                            <CustomSelect
                                name={t("notifications.form.targetLabel")}
                                options={targetOptions}
                                value={targetOptions.find((o) => o.id === target) || null}
                                onChange={(option) => setTarget((option?.id as "all" | "users") || "all")}
                                placeholder={t("notifications.form.targetPlaceholder")}
                                hideBadge={true}
                            />
                        </div>
                    </div>

                    {/* 指定用户ID */}
                    {target === "users" && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{t("notifications.form.userIdLabel")}</label>
                            <Input
                                placeholder={t("notifications.form.userIdPlaceholder")}
                                value={userIds}
                                onChange={(value) => setUserIds(value)}
                                allowClear={true}
                                size="large"
                            />
                        </div>
                    )}

                    {/* 设为广播跑马灯 */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("notifications.form.broadcastLabel")}</label>
                        <div className={styles.switchRow}>
                            <Switch checked={isBroadcast} onChange={(checked) => setIsBroadcast(checked)} />
                            <span className={styles.switchHint}>{t("notifications.form.broadcastHint")}</span>
                        </div>
                    </div>

                    {/* 广播设置 */}
                    {isBroadcast && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t("notifications.form.broadcastLevelLabel")}</label>
                                <CustomSelect
                                    name={t("notifications.form.broadcastLevelLabel")}
                                    options={broadcastLevelOptions}
                                    value={broadcastLevelOptions.find((o) => o.id === broadcastLevel) || null}
                                    onChange={(option) => setBroadcastLevel(String(option?.id || "info"))}
                                    placeholder={t("notifications.form.broadcastLevelPlaceholder")}
                                    hideBadge={true}
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("notifications.form.startTimeLabel")}</label>
                                    <DatePicker
                                        value={startTime || undefined}
                                        onChange={(date) => setStartTime(date)}
                                        placeholder={t("notifications.form.startTimePlaceholder")}
                                        showTime
                                        allowClear
                                        size="large"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("notifications.form.endTimeLabel")}</label>
                                    <DatePicker
                                        value={endTime || undefined}
                                        onChange={(date) => setEndTime(date)}
                                        placeholder={t("notifications.form.endTimePlaceholder")}
                                        showTime
                                        allowClear
                                        size="large"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.formDivider} />

                {/* 通知内容 */}
                <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>{t("notifications.form.contentTitle")}</h3>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("notifications.form.titleLabel")}</label>
                        <Input
                            placeholder={t("notifications.form.titlePlaceholder")}
                            value={title}
                            onChange={(value) => setTitle(value)}
                            allowClear={true}
                            maxLength={100}
                            size="large"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            {t("notifications.form.contentLabel")}
                            <span className={styles.charCount}>{content.length}/2000</span>
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t("notifications.form.contentPlaceholder")}
                            rows={6}
                            maxLength={2000}
                        />
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className={styles.formActions}>
                    <Button color="primary" size="medium" onClick={handleSend} disabled={sending} loading={sending}>
                        <FaPaperPlane />
                        {sending ? t("notifications.form.sending") : t("notifications.form.send")}
                    </Button>
                </div>
            </div>

            {/* 当前广播列表 */}
            {activeBroadcasts.length > 0 && (
                <div className={styles.formCard} style={{ marginTop: 24 }}>
                    <h3 className={styles.formSectionTitle}>{t("notifications.broadcasts.title")}</h3>
                    <div className={styles.broadcastList}>
                        {activeBroadcasts.map((bc) => (
                            <div key={bc.id} className={styles.broadcastItem}>
                                <div className={styles.broadcastContent}>
                                    <div className={styles.broadcastTitle}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background:
                                                    bc.level === "danger" ? "#ef4444" : bc.level === "warning" ? "#f59e0b" : "#3b82f6",
                                            }}
                                        />
                                        <strong style={{ fontSize: 14 }}>{bc.title}</strong>
                                    </div>
                                    <div className={styles.broadcastText}>{bc.content}</div>
                                </div>
                                <button
                                    onClick={() => handleCloseBroadcast(bc.id)}
                                    className={styles.broadcastCloseButton}
                                    title={t("notifications.broadcasts.closeTitle")}
                                >
                                    <FaTimes size={10} style={{ marginRight: 4 }} />
                                    {t("notifications.broadcasts.close")}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManagement;

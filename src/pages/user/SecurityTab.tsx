import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaDesktop, FaMobileAlt, FaSignOutAlt } from "react-icons/fa";
import styles from "./UserPage.module.css";
import secStyles from "./AccountSecurity.module.css";
import Switch from "@/components/switch/Switch";
import message from "@/components/message/Message";
import { confirm } from "@/components/confirm/Confirm";
import Loading from "@/components/loading/Loading";
import ErrorState from "@/components/errorState/ErrorState";
import DeviceService, { type LoginDevice } from "@/services/DeviceService.ts";
import { formatRelativeTime } from "@/utils/Utils.ts";

const isMobilePlatform = (platform: string): boolean => /ios|android|mobile/i.test(platform || "");

const SecurityTab: React.FC = () => {
    const { t } = useTranslation("user");
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginAlert, setLoginAlert] = useState(true);
    const [devices, setDevices] = useState<LoginDevice[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const [kickingId, setKickingId] = useState<string | null>(null);

    const loadDevices = useCallback(async () => {
        setDevicesLoading(true);
        setDevicesError(null);
        try {
            const res = await DeviceService.listDevices();
            if (res.errno === 0 && Array.isArray(res.data?.list)) {
                setDevices(res.data.list);
            } else {
                setDevicesError(t("security.messages.devicesFetchFailed"));
            }
        } catch (error: any) {
            setDevicesError(error.msg || error.message || t("security.messages.devicesFetchFailed"));
        } finally {
            setDevicesLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const revoke = (d: LoginDevice) => {
        confirm({
            title: t("security.revoke.title"),
            content: (
                <div>
                    {t("security.revoke.contentPrefix")}
                    <strong>{d.device_name || d.platform || t("security.unknownDevice")}</strong>
                    {t("security.revoke.contentSuffix")}
                </div>
            ),
            confirmText: t("security.revoke.confirm"),
            cancelText: t("security.revoke.cancel"),
            onConfirm: async () => {
                setKickingId(d.device_id);
                try {
                    await DeviceService.kickDevice(d.device_id);
                    message.success(t("security.messages.revokeSuccess"));
                    await loadDevices();
                } catch (error: any) {
                    message.error(error.msg || error.message || t("security.messages.revokeFailed"));
                    await loadDevices();
                } finally {
                    setKickingId(null);
                }
            },
        });
    };

    return (
        <div className={styles.tabWrap}>
            {import.meta.env.DEV && (
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <FaShieldAlt /> {t("security.options.title")}
                    </h2>
                    <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                            <p className={styles.settingName}>{t("security.options.twoFactor.name")}</p>
                            <p className={styles.settingHint}>{t("security.options.twoFactor.hint")}</p>
                        </div>
                        <Switch
                            checked={twoFactor}
                            onChange={(c) => {
                                setTwoFactor(c);
                                message.info(c ? t("security.options.twoFactor.enabled") : t("security.options.twoFactor.disabled"));
                            }}
                        />
                    </div>
                    <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                            <p className={styles.settingName}>{t("security.options.loginAlert.name")}</p>
                            <p className={styles.settingHint}>{t("security.options.loginAlert.hint")}</p>
                        </div>
                        <Switch checked={loginAlert} onChange={(c) => setLoginAlert(c)} />
                    </div>
                </div>
            )}

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                    <FaDesktop /> {t("security.devices.title")}
                </h2>
                <p className={styles.cardDesc}>{t("security.devices.count", { total: devices.length })}</p>
                {devicesLoading ? (
                    <Loading size="medium" text={t("security.devices.loading")} />
                ) : devicesError ? (
                    <ErrorState
                        title={t("security.devices.errorTitle")}
                        message={devicesError}
                        actionText={t("security.devices.reload")}
                        onAction={loadDevices}
                    />
                ) : devices.length === 0 ? (
                    <p className={styles.cardDesc}>{t("security.devices.empty")}</p>
                ) : (
                    <div className={secStyles.deviceList}>
                        {devices.map((d) => {
                            const isCurrent = !!d.is_current;
                            const isKicking = kickingId === d.device_id;
                            return (
                                <div key={d.device_id} className={secStyles.deviceItem}>
                                    <div className={secStyles.deviceIcon}>
                                        {isMobilePlatform(d.platform) ? <FaMobileAlt /> : <FaDesktop />}
                                    </div>
                                    <div className={secStyles.deviceInfo}>
                                        <p className={secStyles.deviceName}>
                                            {d.device_name || d.platform || t("security.unknownDevice")}
                                            {isCurrent && (
                                                <span className={secStyles.currentTag}>{t("security.devices.current")}</span>
                                            )}
                                        </p>
                                        <p className={secStyles.deviceMeta}>
                                            {[d.platform, d.ip ? `IP ${d.ip}` : ""].filter(Boolean).join(" · ")}
                                        </p>
                                        <p className={secStyles.deviceMeta}>
                                            {t("security.devices.loginAt", {
                                                loginTime: formatRelativeTime(d.login_time),
                                                activeTime: formatRelativeTime(d.last_active_time),
                                            })}
                                        </p>
                                    </div>
                                    {!isCurrent && (
                                        <button className={secStyles.revokeBtn} disabled={isKicking} onClick={() => revoke(d)}>
                                            <FaSignOutAlt />{" "}
                                            {isKicking ? t("security.devices.revoking") : t("security.devices.revoke")}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityTab;

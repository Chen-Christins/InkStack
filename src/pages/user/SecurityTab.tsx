import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaDesktop, FaMobileAlt, FaSignOutAlt, FaFingerprint, FaPlus, FaTrashAlt } from "react-icons/fa";
import styles from "./UserPage.module.css";
import secStyles from "./AccountSecurity.module.css";
import Switch from "@/components/switch/Switch";
import Button from "@/components/button/Button";
import Input from "@/components/input/Input";
import Modal from "@/components/modal/Modal";
import message from "@/components/message/Message";
import { confirm } from "@/components/confirm/Confirm";
import Loading from "@/components/loading/Loading";
import ErrorState from "@/components/errorState/ErrorState";
import DeviceService, { type LoginDevice } from "@/services/DeviceService.ts";
import PasskeyService, { type PasskeySummary } from "@/services/PasskeyService.ts";
import { formatRelativeTime } from "@/utils/Utils.ts";

const isMobilePlatform = (platform: string): boolean => /ios|android|mobile/i.test(platform || "");

function getAlgorithmLabel(alg: number): string {
    if (alg === -7) {
        return "ES256";
    }
    if (alg === -257) {
        return "RS256";
    }
    if (alg === -8) {
        return "EdDSA";
    }
    return `alg ${alg}`;
}

function getErrorMessage(error: any, fallback: string): string {
    if (error?.name === "NotAllowedError") {
        return fallback;
    }
    return error?.msg || error?.message || fallback;
}

const SecurityTab: React.FC = () => {
    const { t } = useTranslation("user");
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginAlert, setLoginAlert] = useState(true);

    const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
    const [passkeysLoading, setPasskeysLoading] = useState(true);
    const [passkeysError, setPasskeysError] = useState<string | null>(null);
    const [registerVisible, setRegisterVisible] = useState(false);
    const [passkeyName, setPasskeyName] = useState("");
    const [registering, setRegistering] = useState(false);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);
    const passkeySupported = PasskeyService.isSupported();

    const [devices, setDevices] = useState<LoginDevice[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const [kickingId, setKickingId] = useState<string | null>(null);

    const loadPasskeys = useCallback(async () => {
        setPasskeysLoading(true);
        setPasskeysError(null);
        try {
            const data = await PasskeyService.list();
            setPasskeys(Array.isArray(data.list) ? data.list : []);
        } catch (error: any) {
            setPasskeysError(error.msg || error.message || t("security.passkeys.fetchFailed"));
        } finally {
            setPasskeysLoading(false);
        }
    }, [t]);

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
        void loadPasskeys();
        void loadDevices();
    }, [loadPasskeys, loadDevices]);

    const handleRegisterPasskey = async () => {
        if (!passkeySupported) {
            message.warn(t("security.passkeys.unsupported"));
            return;
        }

        setRegistering(true);
        try {
            await PasskeyService.register(passkeyName.trim() || undefined);
            message.success(t("security.passkeys.registerSuccess"));
            setRegisterVisible(false);
            setPasskeyName("");
            await loadPasskeys();
        } catch (error: any) {
            if (error?.name === "NotAllowedError") {
                message.info(t("security.passkeys.cancelled"));
            } else {
                message.error(getErrorMessage(error, t("security.passkeys.registerFailed")));
            }
        } finally {
            setRegistering(false);
        }
    };

    const revokePasskey = (passkey: PasskeySummary) => {
        confirm({
            title: t("security.passkeys.deleteTitle"),
            content: (
                <div>
                    {t("security.passkeys.deletePrefix")}
                    <strong>{passkey.name || t("security.passkeys.unnamed")}</strong>
                    {t("security.passkeys.deleteSuffix")}
                </div>
            ),
            confirmText: t("security.passkeys.delete"),
            cancelText: t("security.passkeys.cancel"),
            onConfirm: async () => {
                setDeletingId(passkey.id);
                try {
                    await PasskeyService.remove(passkey.id);
                    message.success(t("security.passkeys.deleteSuccess"));
                    await loadPasskeys();
                } catch (error: any) {
                    message.error(getErrorMessage(error, t("security.passkeys.deleteFailed")));
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

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
                <div className={secStyles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>
                            <FaFingerprint /> {t("security.passkeys.title")}
                        </h2>
                        <p className={styles.cardDesc}>{t("security.passkeys.desc")}</p>
                    </div>
                    <Button
                        type="button"
                        color="primary"
                        variant="outline"
                        size="small"
                        onClick={() => setRegisterVisible(true)}
                        disabled={!passkeySupported}
                        title={!passkeySupported ? t("security.passkeys.unsupported") : undefined}
                    >
                        <FaPlus /> {t("security.passkeys.register")}
                    </Button>
                </div>

                {!passkeySupported && <p className={styles.settingHint}>{t("security.passkeys.unsupported")}</p>}

                {passkeysLoading ? (
                    <Loading size="medium" text={t("security.passkeys.loading")} />
                ) : passkeysError ? (
                    <ErrorState
                        title={t("security.passkeys.errorTitle")}
                        message={passkeysError}
                        actionText={t("security.passkeys.reload")}
                        onAction={loadPasskeys}
                    />
                ) : passkeys.length === 0 ? (
                    <p className={styles.cardDesc}>{t("security.passkeys.empty")}</p>
                ) : (
                    <div className={secStyles.passkeyList}>
                        {passkeys.map((passkey) => {
                            const isDeleting = deletingId === passkey.id;
                            const meta = [getAlgorithmLabel(passkey.alg), passkey.transports].filter(Boolean).join(" · ");
                            return (
                                <div key={passkey.id} className={secStyles.passkeyItem}>
                                    <div className={secStyles.passkeyIcon}>
                                        <FaFingerprint />
                                    </div>
                                    <div className={secStyles.passkeyInfo}>
                                        <p className={secStyles.deviceName}>
                                            {passkey.name || t("security.passkeys.unnamed")}
                                            {passkey.backup_state ? (
                                                <span className={secStyles.currentTag}>{t("security.passkeys.synced")}</span>
                                            ) : null}
                                        </p>
                                        {meta && <p className={secStyles.deviceMeta}>{meta}</p>}
                                        <p className={secStyles.deviceMeta}>
                                            {t("security.passkeys.createdAt", { time: formatRelativeTime(passkey.created_at) })}
                                            {" · "}
                                            {t("security.passkeys.lastUsedAt", {
                                                time: passkey.last_used_at
                                                    ? formatRelativeTime(passkey.last_used_at)
                                                    : t("security.passkeys.neverUsed"),
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        className={secStyles.revokeBtn}
                                        disabled={isDeleting}
                                        onClick={() => revokePasskey(passkey)}
                                    >
                                        <FaTrashAlt /> {isDeleting ? t("security.passkeys.deleting") : t("security.passkeys.delete")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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

            <Modal
                visible={registerVisible}
                title={t("security.passkeys.modalTitle")}
                onClose={() => {
                    if (!registering) {
                        setRegisterVisible(false);
                    }
                }}
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() => setRegisterVisible(false)}
                            disabled={registering}
                        >
                            {t("security.passkeys.cancel")}
                        </Button>
                        <Button type="button" color="primary" onClick={handleRegisterPasskey} loading={registering}>
                            {t("security.passkeys.register")}
                        </Button>
                    </>
                }
            >
                <p className={styles.cardDesc}>{t("security.passkeys.modalHint")}</p>
                <Input
                    value={passkeyName}
                    onChange={setPasskeyName}
                    placeholder={t("security.passkeys.namePlaceholder")}
                    maxLength={64}
                    autoFocus
                    className={secStyles.passkeyNameInput}
                />
            </Modal>
        </div>
    );
};

export default SecurityTab;

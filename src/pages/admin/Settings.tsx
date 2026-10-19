import React, { useState, useEffect } from "react";
import {
    FaSave,
    FaUpload,
    FaTrash,
    FaEnvelope,
    FaServer,
    FaCog,
    FaGlobe,
    FaPalette,
    FaBell,
    FaShieldAlt,
    FaDatabase,
    FaUsers,
    FaClock,
    FaSpinner,
} from "react-icons/fa";
import styles from "./Settings.module.css";
import CustomSelect from "@/components/customSelect/CustomSelect";
import message from "@/components/message/Message";
import SettingsService, { type SiteSettings, type EmailSettings, type SystemSettings } from "@/services/SettingsService.ts";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useTranslation } from "react-i18next";

const Settings: React.FC = () => {
    const { t } = useTranslation("admin");
    const [activeTab, setActiveTab] = useState<"site" | "email" | "system">("site");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const { refreshSettings } = useSiteSettings();

    const [siteSettings, setSiteSettings] = useState<SiteSettings>({
        siteName: "",
        siteDescription: "",
        siteKeywords: "",
        siteIcon: "",
        siteLogo: "",
        favicon: "",
        adminEmail: "",
        timezone: "Asia/Shanghai",
        language: "zh-CN",
    });

    const [emailSettings, setEmailSettings] = useState<EmailSettings>({
        smtpHost: "",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        smtpEncryption: "tls",
        fromEmail: "",
        fromName: "",
        replyTo: "",
    });

    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        enableRegistration: true,
        requireEmailVerification: true,
        allowComments: true,
        moderateComments: false,
        maxFileSize: 10,
        allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
        sessionTimeout: 24,
        maintenanceMode: false,
        backupSchedule: "daily",
    });

    // 加载设置
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await SettingsService.getSettings();
                setSiteSettings({
                    siteName: data.siteName,
                    siteDescription: data.siteDescription,
                    siteKeywords: data.siteKeywords,
                    siteIcon: data.siteIcon,
                    siteLogo: data.siteLogo,
                    favicon: data.favicon,
                    adminEmail: data.adminEmail,
                    timezone: data.timezone,
                    language: data.language,
                });
                setEmailSettings({
                    smtpHost: data.smtpHost,
                    smtpPort: data.smtpPort,
                    smtpUsername: data.smtpUsername,
                    smtpPassword: data.smtpPassword,
                    smtpEncryption: data.smtpEncryption,
                    fromEmail: data.fromEmail,
                    fromName: data.fromName,
                    replyTo: data.replyTo,
                });
                setSystemSettings({
                    enableRegistration: data.enableRegistration,
                    requireEmailVerification: data.requireEmailVerification,
                    allowComments: data.allowComments,
                    moderateComments: data.moderateComments,
                    maxFileSize: data.maxFileSize,
                    allowedFileTypes: data.allowedFileTypes,
                    sessionTimeout: data.sessionTimeout,
                    maintenanceMode: data.maintenanceMode,
                    backupSchedule: data.backupSchedule,
                });
            } catch {
                message.error(t("settings.message.loadFailed"));
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // 处理输入变化
    const handleSiteSettingChange = (field: keyof SiteSettings, value: string | boolean) => {
        setSiteSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleEmailSettingChange = (field: keyof EmailSettings, value: string | number) => {
        setEmailSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSystemSettingChange = (field: keyof SystemSettings, value: string | boolean | number) => {
        setSystemSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 保存设置
    const saveSettings = async () => {
        setSaving(true);

        try {
            await SettingsService.updateSettings({
                ...siteSettings,
                ...emailSettings,
                ...systemSettings,
            });
            await refreshSettings();
            message.success(t("settings.message.saveSuccess"));
        } catch {
            message.error(t("settings.message.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    // 文件上传处理
    const handleFileUpload = async (type: "siteIcon" | "siteLogo" | "favicon") => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                return;
            }

            setUploading((prev) => ({ ...prev, [type]: true }));
            try {
                const url = await SettingsService.uploadImage(file, type);
                handleSiteSettingChange(type, url);
            } catch {
                console.error("图片上传失败");
            } finally {
                setUploading((prev) => ({ ...prev, [type]: false }));
            }
        };
        input.click();
    };

    // 时区选项
    const timezoneOptions = [
        { id: "Asia/Shanghai", name: "Asia/Shanghai", color: "" },
        { id: "Asia/Tokyo", name: "Asia/Tokyo", color: "" },
        { id: "Asia/Seoul", name: "Asia/Seoul", color: "" },
        { id: "UTC", name: "UTC", color: "" },
        { id: "America/New_York", name: "America/New_York", color: "" },
        { id: "Europe/London", name: "Europe/London", color: "" },
        { id: "Europe/Paris", name: "Europe/Paris", color: "" },
    ];

    // 语言选项
    const languageOptions = [
        { id: "zh-CN", name: "简体中文", color: "" },
        { id: "zh-TW", name: "繁体中文", color: "" },
        { id: "en-US", name: "English", color: "" },
        { id: "ja-JP", name: "日本語", color: "" },
        { id: "ko-KR", name: "한국어", color: "" },
    ];

    // 加密方式选项
    const encryptionOptions = [
        { id: "none", name: t("settings.email.encryptionOptions.none"), color: "" },
        { id: "ssl", name: t("settings.email.encryptionOptions.ssl"), color: "" },
        { id: "tls", name: t("settings.email.encryptionOptions.tls"), color: "" },
    ];

    // 备份计划选项
    const backupScheduleOptions = [
        { id: "disabled", name: t("settings.system.backupScheduleOptions.disabled"), color: "" },
        { id: "daily", name: t("settings.system.backupScheduleOptions.daily"), color: "" },
        { id: "weekly", name: t("settings.system.backupScheduleOptions.weekly"), color: "" },
        { id: "monthly", name: t("settings.system.backupScheduleOptions.monthly"), color: "" },
    ];

    return loading ? (
        <div className={styles.settings}>
            <div className={styles.loadingContainer}>
                <FaSpinner className="fa-spin" />
                <span>{t("settings.loading")}</span>
            </div>
        </div>
    ) : (
        <div className={styles.settings}>
            {/* Tab导航 */}
            <div className={styles.tabsContainer}>
                <nav className={styles.tabsNav}>
                    <button
                        className={`${styles.tabButton} ${activeTab === "site" ? styles.active : ""}`}
                        onClick={() => setActiveTab("site")}
                    >
                        <div className={styles.tabIcon}>
                            <FaGlobe />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>{t("settings.tabs.site")}</span>
                            <span className={styles.tabDescription}>{t("settings.tabs.siteDesc")}</span>
                        </div>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "email" ? styles.active : ""}`}
                        onClick={() => setActiveTab("email")}
                    >
                        <div className={styles.tabIcon}>
                            <FaEnvelope />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>{t("settings.tabs.email")}</span>
                            <span className={styles.tabDescription}>{t("settings.tabs.emailDesc")}</span>
                        </div>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "system" ? styles.active : ""}`}
                        onClick={() => setActiveTab("system")}
                    >
                        <div className={styles.tabIcon}>
                            <FaCog />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>{t("settings.tabs.system")}</span>
                            <span className={styles.tabDescription}>{t("settings.tabs.systemDesc")}</span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* 主要内容区域 */}
            <div className={styles.settingsContent}>
                {/* 站点设置 */}
                {activeTab === "site" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaGlobe />
                                {t("settings.site.title")}
                            </h2>
                            <p className={styles.sectionDescription}>{t("settings.site.description")}</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* 站点信息 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>{t("settings.site.basicInfo")}</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.siteName")}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={siteSettings.siteName}
                                        onChange={(e) => handleSiteSettingChange("siteName", e.target.value)}
                                        placeholder={t("settings.site.siteNamePlaceholder")}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.siteDescription")}</label>
                                    <textarea
                                        className={styles.formTextarea}
                                        value={siteSettings.siteDescription}
                                        onChange={(e) => handleSiteSettingChange("siteDescription", e.target.value)}
                                        placeholder={t("settings.site.siteDescriptionPlaceholder")}
                                        rows={3}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.keywords")}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={siteSettings.siteKeywords}
                                        onChange={(e) => handleSiteSettingChange("siteKeywords", e.target.value)}
                                        placeholder={t("settings.site.keywordsPlaceholder")}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.adminEmail")}</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={siteSettings.adminEmail}
                                        onChange={(e) => handleSiteSettingChange("adminEmail", e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            {/* 站点图标 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaPalette />
                                    {t("settings.site.icons.title")}
                                </h3>
                                <div className={styles.imageUploadGrid}>
                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>{t("settings.site.icons.siteIcon")}</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.siteIcon ? (
                                                <img
                                                    src={siteSettings.siteIcon}
                                                    alt={t("settings.site.icons.siteIconAlt")}
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>{t("settings.site.icons.uploadIcon")}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("siteIcon")}
                                                disabled={uploading["siteIcon"]}
                                            >
                                                {uploading["siteIcon"] ? (
                                                    <>
                                                        <FaSpinner className="fa-spin" /> {t("settings.site.icons.uploading")}
                                                    </>
                                                ) : (
                                                    t("settings.site.icons.selectFile")
                                                )}
                                            </button>
                                            {siteSettings.siteIcon && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("siteIcon", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>{t("settings.site.icons.iconHint")}</p>
                                    </div>

                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>{t("settings.site.icons.logo")}</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.siteLogo ? (
                                                <img
                                                    src={siteSettings.siteLogo}
                                                    alt={t("settings.site.icons.logoAlt")}
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>{t("settings.site.icons.uploadLogo")}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("siteLogo")}
                                                disabled={uploading["siteLogo"]}
                                            >
                                                {uploading["siteLogo"] ? (
                                                    <>
                                                        <FaSpinner className="fa-spin" /> {t("settings.site.icons.uploading")}
                                                    </>
                                                ) : (
                                                    t("settings.site.icons.selectFile")
                                                )}
                                            </button>
                                            {siteSettings.siteLogo && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("siteLogo", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>{t("settings.site.icons.logoHint")}</p>
                                    </div>

                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>{t("settings.site.icons.favicon")}</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.favicon ? (
                                                <img
                                                    src={siteSettings.favicon}
                                                    alt={t("settings.site.icons.faviconAlt")}
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>{t("settings.site.icons.uploadFavicon")}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("favicon")}
                                                disabled={uploading["favicon"]}
                                            >
                                                {uploading["favicon"] ? (
                                                    <>
                                                        <FaSpinner className="fa-spin" /> {t("settings.site.icons.uploading")}
                                                    </>
                                                ) : (
                                                    t("settings.site.icons.selectFile")
                                                )}
                                            </button>
                                            {siteSettings.favicon && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("favicon", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>{t("settings.site.icons.faviconHint")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 本地化设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaClock />
                                    {t("settings.site.localization.title")}
                                </h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.localization.timezone")}</label>
                                    <CustomSelect
                                        name={t("settings.site.localization.timezone")}
                                        value={timezoneOptions.find((tz) => tz.id === siteSettings.timezone) || null}
                                        onChange={(selectedOption) =>
                                            handleSiteSettingChange("timezone", String(selectedOption?.id || ""))
                                        }
                                        options={timezoneOptions}
                                        hideBadge={true}
                                        placeholder={t("settings.site.localization.timezonePlaceholder")}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.site.localization.language")}</label>
                                    <CustomSelect
                                        name={t("settings.site.localization.language")}
                                        value={languageOptions.find((lang) => lang.id === siteSettings.language) || null}
                                        onChange={(selectedOption) =>
                                            handleSiteSettingChange("language", String(selectedOption?.id || ""))
                                        }
                                        options={languageOptions}
                                        hideBadge={true}
                                        placeholder={t("settings.site.localization.languagePlaceholder")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 邮件设置 */}
                {activeTab === "email" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaEnvelope />
                                {t("settings.email.title")}
                            </h2>
                            <p className={styles.sectionDescription}>{t("settings.email.description")}</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* SMTP配置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaServer />
                                    {t("settings.email.smtpTitle")}
                                </h3>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>{t("settings.email.host")}</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            value={emailSettings.smtpHost}
                                            onChange={(e) => handleEmailSettingChange("smtpHost", e.target.value)}
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>{t("settings.email.port")}</label>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            value={emailSettings.smtpPort}
                                            onChange={(e) => handleEmailSettingChange("smtpPort", parseInt(e.target.value))}
                                            placeholder="587"
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.encryption")}</label>
                                    <CustomSelect
                                        name={t("settings.email.encryption")}
                                        value={encryptionOptions.find((opt) => opt.id === emailSettings.smtpEncryption) || null}
                                        onChange={(selectedOption) =>
                                            handleEmailSettingChange(
                                                "smtpEncryption",
                                                (selectedOption?.id as "none" | "ssl" | "tls") || "none",
                                            )
                                        }
                                        options={encryptionOptions}
                                        hideBadge={true}
                                        placeholder={t("settings.email.encryptionPlaceholder")}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.username")}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={emailSettings.smtpUsername}
                                        onChange={(e) => handleEmailSettingChange("smtpUsername", e.target.value)}
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.password")}</label>
                                    <input
                                        type="password"
                                        className={styles.formInput}
                                        value={emailSettings.smtpPassword}
                                        onChange={(e) => handleEmailSettingChange("smtpPassword", e.target.value)}
                                        placeholder={t("settings.email.passwordPlaceholder")}
                                    />
                                </div>
                            </div>

                            {/* 邮件发送设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>{t("settings.email.sendTitle")}</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.fromEmail")}</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={emailSettings.fromEmail}
                                        onChange={(e) => handleEmailSettingChange("fromEmail", e.target.value)}
                                        placeholder="noreply@InkStack.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.fromName")}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={emailSettings.fromName}
                                        onChange={(e) => handleEmailSettingChange("fromName", e.target.value)}
                                        placeholder="InkStack"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.email.replyTo")}</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={emailSettings.replyTo}
                                        onChange={(e) => handleEmailSettingChange("replyTo", e.target.value)}
                                        placeholder="support@InkStack.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 系统设置 */}
                {activeTab === "system" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaCog />
                                {t("settings.system.title")}
                            </h2>
                            <p className={styles.sectionDescription}>{t("settings.system.description")}</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* 用户设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaUsers />
                                    {t("settings.system.users.title")}
                                </h3>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.enableRegistration}
                                            onChange={(e) => handleSystemSettingChange("enableRegistration", e.target.checked)}
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>{t("settings.system.users.enableRegistration")}</span>
                                    </label>
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.requireEmailVerification}
                                            onChange={(e) => handleSystemSettingChange("requireEmailVerification", e.target.checked)}
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>
                                            {t("settings.system.users.requireEmailVerification")}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* 评论设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaBell />
                                    {t("settings.system.comments.title")}
                                </h3>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.allowComments}
                                            onChange={(e) => handleSystemSettingChange("allowComments", e.target.checked)}
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>{t("settings.system.comments.allowComments")}</span>
                                    </label>
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.moderateComments}
                                            onChange={(e) => handleSystemSettingChange("moderateComments", e.target.checked)}
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>{t("settings.system.comments.moderateComments")}</span>
                                    </label>
                                </div>
                            </div>

                            {/* 文件上传设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>{t("settings.system.upload.title")}</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.system.upload.maxFileSize")}</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={systemSettings.maxFileSize}
                                        onChange={(e) => handleSystemSettingChange("maxFileSize", parseInt(e.target.value))}
                                        min="1"
                                        max="100"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.system.upload.allowedFileTypes")}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={systemSettings.allowedFileTypes}
                                        onChange={(e) => handleSystemSettingChange("allowedFileTypes", e.target.value)}
                                        placeholder="jpg,jpeg,png,gif,pdf,doc,docx"
                                    />
                                    <p className={styles.formHint}>{t("settings.system.upload.allowedFileTypesHint")}</p>
                                </div>
                            </div>

                            {/* 系统维护设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaShieldAlt />
                                    {t("settings.system.maintenance.title")}
                                </h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.system.maintenance.sessionTimeout")}</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={systemSettings.sessionTimeout}
                                        onChange={(e) => handleSystemSettingChange("sessionTimeout", parseInt(e.target.value))}
                                        min="1"
                                        max="168"
                                    />
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.maintenanceMode}
                                            onChange={(e) => handleSystemSettingChange("maintenanceMode", e.target.checked)}
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>{t("settings.system.maintenance.maintenanceMode")}</span>
                                    </label>
                                    <p className={styles.switchHint}>{t("settings.system.maintenance.maintenanceModeHint")}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t("settings.system.maintenance.backupSchedule")}</label>
                                    <CustomSelect
                                        name={t("settings.system.maintenance.backupSchedule")}
                                        value={backupScheduleOptions.find((opt) => opt.id === systemSettings.backupSchedule) || null}
                                        onChange={(selectedOption) =>
                                            handleSystemSettingChange("backupSchedule", selectedOption?.id || "disabled")
                                        }
                                        options={backupScheduleOptions}
                                        hideBadge={true}
                                        placeholder={t("settings.system.maintenance.backupSchedulePlaceholder")}
                                    />
                                </div>
                            </div>

                            {/* 数据库设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaDatabase />
                                    {t("settings.system.database.title")}
                                </h3>
                                <div className={styles.formGroup}>
                                    <button className={styles.actionButton}>
                                        <FaDatabase />
                                        {t("settings.system.database.optimize")}
                                    </button>
                                    <p className={styles.formHint}>{t("settings.system.database.optimizeHint")}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <button className={styles.actionButton}>
                                        <FaSave />
                                        {t("settings.system.database.backupNow")}
                                    </button>
                                    <p className={styles.formHint}>{t("settings.system.database.backupNowHint")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 底部操作栏 */}
            <div className={styles.settingsFooter}>
                <div className={styles.footerActions}>
                    <button className={styles.cancelButton}>{t("settings.actions.reset")}</button>
                    <button className={styles.saveButton} onClick={saveSettings} disabled={saving}>
                        <FaSave />
                        {saving ? t("settings.actions.saving") : t("settings.actions.save")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

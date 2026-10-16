import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaCamera, FaUser, FaLock, FaSave, FaQuoteRight, FaGlobe, FaLink, FaGithub } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/services/AuthService.ts";
import { message } from "@/components/message/Message";
import Avatar from "@/components/avatar/Avatar";
import ApiConfigCard from "./ApiConfigCard";
import styles from "../PersonalCenter.module.css";

const EditProfileTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(user?.name || "");
    const [motto, setMotto] = useState(user?.bio || "");
    const [website, setWebsite] = useState(user?.website || "");
    const [github, setGithub] = useState(user?.github || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "https://picsum.photos/id/64/200");
    const [avatarInput, setAvatarInput] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        message.info(t("editProfile.messages.avatarUploadUnavailable"));
    };

    const handleApplyAvatarUrl = async () => {
        const trimmed = avatarInput.trim();
        if (!trimmed) {
            message.warn(t("editProfile.messages.avatarUrlRequired"));
            return;
        }
        if (!/^https?:\/\/.+/.test(trimmed)) {
            message.warn(t("editProfile.messages.avatarUrlInvalid"));
            return;
        }
        setSavingAvatar(true);
        try {
            await AuthService.updateUserProfile(undefined, undefined, undefined, undefined, undefined, trimmed);
            setAvatarUrl(trimmed);
            setAvatarInput("");
            message.success(t("editProfile.messages.avatarUpdated"));
        } catch (err: any) {
            message.error(err?.message || t("editProfile.messages.avatarUpdateFailed"));
        } finally {
            setSavingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            message.warn(t("editProfile.messages.nameRequired"));
            return;
        }

        setSavingProfile(true);
        try {
            await AuthService.updateUserProfile(
                name.trim(),
                undefined,
                motto.trim(),
                website.trim(),
                undefined,
                avatarUrl,
                github.trim(),
            );
            message.success(t("editProfile.messages.profileUpdated"));
        } catch (err: any) {
            message.error(err?.message || t("editProfile.messages.saveFailed"));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword) {
            message.warn(t("editProfile.messages.currentPasswordRequired"));
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            message.warn(t("editProfile.messages.newPasswordTooShort"));
            return;
        }
        if (newPassword !== confirmPassword) {
            message.warn(t("editProfile.messages.passwordMismatch"));
            return;
        }

        setSavingPassword(true);
        try {
            await AuthService.updateUserProfile(undefined, newPassword, undefined, undefined, currentPassword);
            message.success(t("editProfile.messages.passwordChanged"));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            message.error(err?.message || t("editProfile.messages.passwordChangeFailed"));
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>{t("editProfile.pageTitle")}</h2>
            </div>

            <div className={styles.editSections}>
                <div className={styles.editRow}>
                    {/* 基本信息 */}
                    <div className={styles.editCard}>
                        <div className={styles.editCardHeader}>
                            <FaUser className={styles.editCardIcon} />
                            <span>{t("editProfile.sections.basic")}</span>
                        </div>
                        <div className={styles.editCardBody}>
                            <div className={styles.editSubHeader}>
                                <FaCamera className={styles.editCardIcon} />
                                <span>{t("editProfile.avatar.title")}</span>
                            </div>
                            <div className={styles.avatarSection}>
                                <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
                                    <Avatar
                                        src={avatarUrl}
                                        name={name || user?.name || t("editProfile.avatar.defaultName")}
                                        size={100}
                                        className={styles.editAvatar}
                                    />
                                    <div className={styles.avatarOverlay}>
                                        <FaCamera />
                                        <span>{t("editProfile.avatar.change")}</span>
                                    </div>
                                </div>
                                <p className={styles.avatarHint}>{t("editProfile.avatar.hint")}</p>
                                <div className={styles.avatarUrlRow}>
                                    <input
                                        type="url"
                                        className={styles.editInput}
                                        value={avatarInput}
                                        onChange={(e) => setAvatarInput(e.target.value)}
                                        placeholder={user?.avatar || "https://example.com/avatar.jpg"}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.editSaveBtn}
                                        onClick={handleApplyAvatarUrl}
                                        disabled={savingAvatar}
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        <FaLink size={12} />
                                        {savingAvatar ? t("editProfile.avatar.applying") : t("editProfile.avatar.apply")}
                                    </button>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarChange}
                                style={{ display: "none" }}
                            />

                            <div className={styles.editDivider} />
                            <div className={styles.editFormGrid}>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>{t("editProfile.fields.name")}</label>
                                    <input
                                        type="text"
                                        className={styles.editInput}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={user?.name || t("editProfile.fields.namePlaceholder")}
                                    />
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>{t("editProfile.fields.email")}</label>
                                    <input type="email" className={styles.editInput} value={user?.email || ""} disabled />
                                    <span className={styles.editHint}>{t("editProfile.fields.emailHint")}</span>
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>
                                        <FaQuoteRight size={12} style={{ marginRight: 4 }} />
                                        {t("editProfile.fields.motto")}
                                    </label>
                                    <input
                                        type="text"
                                        className={styles.editInput}
                                        value={motto}
                                        onChange={(e) => setMotto(e.target.value)}
                                        placeholder={user?.bio || t("editProfile.fields.mottoPlaceholder")}
                                        maxLength={100}
                                    />
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>
                                        <FaGlobe size={12} style={{ marginRight: 4 }} />
                                        {t("editProfile.fields.website")}
                                    </label>
                                    <input
                                        type="url"
                                        className={styles.editInput}
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder={user?.website || "https://example.com"}
                                    />
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>
                                        <FaGithub size={12} style={{ marginRight: 4 }} />
                                        {t("editProfile.fields.github")}
                                    </label>
                                    <input
                                        type="url"
                                        className={styles.editInput}
                                        value={github}
                                        onChange={(e) => setGithub(e.target.value)}
                                        placeholder={user?.github || "https://github.com/yourname"}
                                    />
                                </div>
                            </div>
                            <button className={styles.editSaveBtn} onClick={handleSaveProfile} disabled={savingProfile}>
                                <FaSave />
                                {savingProfile ? t("editProfile.actions.saving") : t("editProfile.actions.save")}
                            </button>

                            <div className={styles.editDivider} />
                            <div className={styles.editSubHeader}>
                                <FaLock className={styles.editCardIcon} />
                                <span>{t("editProfile.password.title")}</span>
                            </div>
                            <div className={styles.editFormGrid}>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>{t("editProfile.password.current")}</label>
                                    <input
                                        type="password"
                                        className={styles.editInput}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder={t("editProfile.password.currentPlaceholder")}
                                    />
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>{t("editProfile.password.new")}</label>
                                    <input
                                        type="password"
                                        className={styles.editInput}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t("editProfile.password.newPlaceholder")}
                                    />
                                </div>
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>{t("editProfile.password.confirm")}</label>
                                    <input
                                        type="password"
                                        className={styles.editInput}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t("editProfile.password.confirmPlaceholder")}
                                    />
                                </div>
                            </div>
                            <button className={styles.editSaveBtn} onClick={handleChangePassword} disabled={savingPassword}>
                                <FaLock />
                                {savingPassword ? t("editProfile.password.saving") : t("editProfile.password.submit")}
                            </button>
                        </div>
                    </div>

                    {/* AI 接口配置 */}
                    <ApiConfigCard />
                </div>
            </div>
        </div>
    );
};

export default EditProfileTab;

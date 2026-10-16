import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBuilding, FaTimes } from "react-icons/fa";
import styles from "./ApplyCreateOrg.module.css";
import OrganizationService from "@/services/OrganizationService.ts";
import message from "@/components/message/Message";

interface ApplyCreateOrgProps {
    visible: boolean;
    onClose: () => void;
}

const ApplyCreateOrg: React.FC<ApplyCreateOrgProps> = ({ visible, onClose }) => {
    const { t } = useTranslation("components");
    const [formData, setFormData] = useState({ name: "", type: "", description: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.type.trim()) {
            message.error(t("applyCreateOrg.message.nameTypeRequired"));
            return;
        }
        setSubmitting(true);
        try {
            await OrganizationService.applyCreateOrganization({
                name: formData.name.trim(),
                type: formData.type.trim(),
                description: formData.description.trim(),
            });
            message.success(t("applyCreateOrg.message.submitSuccess"));
            setFormData({ name: "", type: "", description: "" });
            onClose();
        } catch (e: any) {
            message.error(e.message || t("applyCreateOrg.message.submitFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setFormData({ name: "", type: "", description: "" });
            onClose();
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <>
            {/* 遮罩层 */}
            <div className={styles.overlay} onClick={handleClose} />

            {/* 右侧滑出面板 */}
            <div className={`${styles.panel} ${visible ? styles.panelOpen : ""}`}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>
                        <FaBuilding /> {t("applyCreateOrg.title")}
                    </h3>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.panelBody}>
                    <p className={styles.panelHint}>{t("applyCreateOrg.hint")}</p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("applyCreateOrg.nameLabel")}</label>
                        <input
                            className={styles.formInput}
                            placeholder={t("applyCreateOrg.namePlaceholder")}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("applyCreateOrg.typeLabel")}</label>
                        <input
                            className={styles.formInput}
                            placeholder={t("applyCreateOrg.typePlaceholder")}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("applyCreateOrg.descriptionLabel")}</label>
                        <textarea
                            className={styles.formTextarea}
                            placeholder={t("applyCreateOrg.descriptionPlaceholder")}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>
                </div>

                <div className={styles.panelFooter}>
                    <button className={styles.btnCancel} onClick={handleClose} disabled={submitting}>
                        {t("applyCreateOrg.cancel")}
                    </button>
                    <button className={styles.btnSubmit} onClick={handleSubmit} disabled={submitting}>
                        {submitting ? t("applyCreateOrg.submitting") : t("applyCreateOrg.submit")}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ApplyCreateOrg;

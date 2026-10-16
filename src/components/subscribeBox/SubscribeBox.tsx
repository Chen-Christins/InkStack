import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRss } from "react-icons/fa";
import styles from "./SubscribeBox.module.css";

const SubscribeBox: React.FC = () => {
    const { t } = useTranslation("components");
    const [email, setEmail] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // 邮箱验证正则
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            alert(t("subscribeBox.invalidEmail"));
            return;
        }

        setIsSubmitting(true);
        // 模拟接口请求（实际项目中替换为真实接口）
        setTimeout(() => {
            alert(t("subscribeBox.success", { email }));
            setEmail("");
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className={styles.subscribeBox}>
            <h3 className={styles.panelTitle}>
                <FaRss className={styles.titleIcon} /> {t("subscribeBox.title")}
            </h3>
            <p className={styles.subscribeDesc}>{t("subscribeBox.desc")}</p>
            <form onSubmit={handleSubmit} className={styles.subscribeForm}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("subscribeBox.placeholder")}
                    className={styles.emailInput}
                    required
                    disabled={isSubmitting}
                />
                <button type="submit" className={styles.subscribeBtn} disabled={isSubmitting}>
                    {isSubmitting ? t("subscribeBox.submitting") : t("subscribeBox.submit")}
                </button>
            </form>
        </div>
    );
};

export default SubscribeBox;

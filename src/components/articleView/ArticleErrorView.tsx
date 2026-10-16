import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";
import styles from "./ArticleErrorView.module.css";

interface ArticleErrorViewProps {
    error: string | null;
}

const ArticleErrorView: React.FC<ArticleErrorViewProps> = ({ error }) => {
    const navigate = useNavigate();
    const { t } = useTranslation("article");

    return (
        <div className={styles.container}>
            <div className={styles.icon}>
                <FaExclamationTriangle />
            </div>
            <h2 className={styles.title}>{t("error.title")}</h2>
            <p className={styles.message}>{error || t("error.unknown")}</p>
            <div className={styles.actions}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>
                    <FaArrowLeft /> {t("error.back")}
                </button>
                <button onClick={() => navigate("/")} className={styles.homeBtn}>
                    <FaHome /> {t("backHome")}
                </button>
            </div>
        </div>
    );
};

export default ArticleErrorView;

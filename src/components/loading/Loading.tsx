import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Loading.module.css";

interface LoadingProps {
    size?: "small" | "medium" | "large";
    text?: string;
    overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ size = "medium", text, overlay = false }) => {
    const { t } = useTranslation("components");
    const resolvedText = text ?? t("loading.defaultText");
    const content = (
        <div className={`${styles.loadingContainer} ${styles[size]}`}>
            <div className={styles.spinner}>
                <div className={styles.spinnerCircle}></div>
                <div className={styles.spinnerCircle}></div>
                <div className={styles.spinnerCircle}></div>
                <div className={styles.spinnerCircle}></div>
            </div>
            {resolvedText && <div className={styles.loadingText}>{resolvedText}</div>}
        </div>
    );

    if (overlay) {
        return <div className={styles.loadingOverlay}>{content}</div>;
    }

    return content;
};

export default Loading;

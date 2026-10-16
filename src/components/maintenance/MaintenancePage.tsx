import React from "react";
import { useTranslation } from "react-i18next";
import { FaTools } from "react-icons/fa";
import styles from "./MaintenancePage.module.css";

const MaintenancePage: React.FC = () => {
    const { t } = useTranslation("error");

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.icon}>
                    <FaTools />
                </div>
                <h1 className={styles.title}>{t("maintenance.title")}</h1>
                <p className={styles.description}>{t("maintenance.description")}</p>
            </div>
        </div>
    );
};

export default MaintenancePage;

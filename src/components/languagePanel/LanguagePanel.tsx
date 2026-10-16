import React from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe, FaCheck } from "react-icons/fa";
import { useAppLanguage } from "@/i18n/UseAppLanguage";
import styles from "./LanguagePanel.module.css";

const LanguagePanel: React.FC = () => {
    const { t } = useTranslation("nav");
    const { language, options, setLanguage } = useAppLanguage();

    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                    <FaGlobe className={styles.titleIcon} /> {t("tools.language")}
                </h3>
            </div>
            <div className={styles.optionList}>
                {options.map((option) => {
                    const active = language === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={`${styles.optionItem} ${active ? styles.optionActive : ""}`}
                            onClick={() => setLanguage(option.id)}
                            aria-pressed={active}
                        >
                            <span className={styles.optionName}>{option.label}</span>
                            {active && <FaCheck className={styles.checkIcon} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LanguagePanel;

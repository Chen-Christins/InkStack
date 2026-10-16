import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation("common");

    return (
        <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={theme === "light" ? t("theme.toDark") : t("theme.toLight")}
            title={theme === "light" ? t("theme.toDark") : t("theme.toLight")}
        >
            <div className={styles.toggleContainer}>
                {theme === "light" ? <Moon className={styles.icon} size={18} /> : <Sun className={styles.icon} size={18} />}
            </div>
        </button>
    );
};

export default ThemeToggle;

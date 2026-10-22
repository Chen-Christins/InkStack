import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation("common");
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = useCallback(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        // 以按钮中心为圆心做圆形扩散的明暗切换
        toggleTheme(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
    }, [toggleTheme]);

    return (
        <button
            ref={buttonRef}
            className={styles.themeToggle}
            onClick={handleClick}
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

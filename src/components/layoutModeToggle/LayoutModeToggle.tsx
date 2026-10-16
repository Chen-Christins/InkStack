import React from "react";
import { useTranslation } from "react-i18next";
import { LayoutPanelLeft, PanelTop } from "lucide-react";
import { useLayoutMode } from "@/contexts/LayoutModeContext";
import styles from "./LayoutModeToggle.module.css";

const LayoutModeToggle: React.FC = () => {
    const { t } = useTranslation("components");
    const { mode, toggleMode } = useLayoutMode();
    const MODE_META = {
        appShell: {
            label: t("layoutModeToggle.modes.appShell.label"),
            nextLabel: t("layoutModeToggle.modes.appShell.nextLabel"),
        },
        classic: {
            label: t("layoutModeToggle.modes.classic.label"),
            nextLabel: t("layoutModeToggle.modes.classic.nextLabel"),
        },
    } as const;
    const currentMode = MODE_META[mode];
    const Icon = mode === "appShell" ? LayoutPanelLeft : PanelTop;

    return (
        <button
            type="button"
            className={styles.toggle}
            onClick={toggleMode}
            aria-label={t("layoutModeToggle.ariaLabel", { label: currentMode.label, nextLabel: currentMode.nextLabel })}
            title={t("layoutModeToggle.title", { label: currentMode.label, nextLabel: currentMode.nextLabel })}
        >
            <Icon className={styles.icon} size={16} />
            <span className={styles.label}>{currentMode.label}</span>
        </button>
    );
};

export default LayoutModeToggle;

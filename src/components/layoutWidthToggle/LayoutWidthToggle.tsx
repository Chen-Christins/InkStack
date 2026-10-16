import React from "react";
import { useTranslation } from "react-i18next";
import { StretchHorizontal } from "lucide-react";
import { useLayoutWidth } from "@/contexts/LayoutWidthContext";
import styles from "./LayoutWidthToggle.module.css";

const LayoutWidthToggle: React.FC = () => {
    const { t } = useTranslation("components");
    const { mode, cycleMode } = useLayoutWidth();
    const MODE_META = {
        default: {
            label: t("layoutWidthToggle.modes.default.label"),
            nextLabel: t("layoutWidthToggle.modes.default.nextLabel"),
        },
        wide: {
            label: t("layoutWidthToggle.modes.wide.label"),
            nextLabel: t("layoutWidthToggle.modes.wide.nextLabel"),
        },
        full: {
            label: t("layoutWidthToggle.modes.full.label"),
            nextLabel: t("layoutWidthToggle.modes.full.nextLabel"),
        },
    } as const;
    const currentMode = MODE_META[mode];

    return (
        <button
            type="button"
            className={styles.toggle}
            onClick={cycleMode}
            aria-label={t("layoutWidthToggle.ariaLabel", { label: currentMode.label, nextLabel: currentMode.nextLabel })}
            title={t("layoutWidthToggle.title", { label: currentMode.label, nextLabel: currentMode.nextLabel })}
        >
            <StretchHorizontal className={styles.icon} size={16} />
            <span className={styles.label}>{currentMode.label}</span>
        </button>
    );
};

export default LayoutWidthToggle;

import React from "react";
import { LayoutPanelLeft, PanelTop } from "lucide-react";
import { useLayoutMode } from "@/contexts/LayoutModeContext";
import styles from "./LayoutModeToggle.module.css";

const MODE_META = {
    appShell: { label: "侧栏布局", nextLabel: "顶部布局" },
    classic: { label: "顶部布局", nextLabel: "侧栏布局" },
} as const;

const LayoutModeToggle: React.FC = () => {
    const { mode, toggleMode } = useLayoutMode();
    const currentMode = MODE_META[mode];
    const Icon = mode === "appShell" ? LayoutPanelLeft : PanelTop;

    return (
        <button
            type="button"
            className={styles.toggle}
            onClick={toggleMode}
            aria-label={`当前界面布局：${currentMode.label}，点击切换到${currentMode.nextLabel}`}
            title={`界面布局：${currentMode.label}，点击切换到${currentMode.nextLabel}`}
        >
            <Icon className={styles.icon} size={16} />
            <span className={styles.label}>{currentMode.label}</span>
        </button>
    );
};

export default LayoutModeToggle;

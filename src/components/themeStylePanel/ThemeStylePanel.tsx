import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPalette, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useTheme, type ThemePreset } from "@/contexts/ThemeContext";
import Button from "@/components/button/Button";
import Switch from "@/components/switch/Switch";
import styles from "./ThemeStylePanel.module.css";

const PRESETS: { key: ThemePreset; bg: string; header: string; accent: string }[] = [
    {
        key: "time",
        bg: "#f6f1e7",
        header: "#c8102e",
        accent: "#c8102e",
    },
    {
        key: "monochrome",
        bg: "#fafafa",
        header: "#111111",
        accent: "#111111",
    },
    {
        key: "mint",
        bg: "#f4f7f0",
        header: "#6f9a5e",
        accent: "#a3b88d",
    },
    {
        key: "ocean",
        bg: "#f0f6fb",
        header: "#0e7cb5",
        accent: "#4aa3d8",
    },
    {
        key: "sakura",
        bg: "#fff5f7",
        header: "#e87a9a",
        accent: "#f48fb1",
    },
    {
        key: "cyberpunk",
        bg: "#f4f2ff",
        header: "#7c5cff",
        accent: "#00b8d9",
    },
    {
        key: "gold",
        bg: "#faf6ee",
        header: "#b8860b",
        accent: "#d4a24e",
    },
    {
        key: "lavender",
        bg: "#f7f5ff",
        header: "#7c5cff",
        accent: "#a58aff",
    },
    {
        key: "pi",
        bg: "#ebe7e4",
        header: "#252f3d",
        accent: "#4b607c",
    },
];

const ThemeStylePanel: React.FC = () => {
    const { t } = useTranslation("components");
    const { preset, setPreset, cursorEnabled, setCursorEnabled } = useTheme();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem("theme-style-panel-collapsed") !== "false");
    const visiblePresets = collapsed ? PRESETS.filter((item) => item.key === preset) : PRESETS;

    const toggleCollapsed = () => {
        setCollapsed((current) => {
            const next = !current;
            localStorage.setItem("theme-style-panel-collapsed", String(next));
            return next;
        });
    };

    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                    <FaPalette className={styles.titleIcon} /> {t("themeStylePanel.panelTitle")}
                </h3>
                <Button
                    variant="ghost"
                    size="small"
                    className={styles.collapseButton}
                    onClick={toggleCollapsed}
                    aria-expanded={!collapsed}
                    aria-controls="theme-preset-list"
                    title={collapsed ? t("themeStylePanel.collapseButton.expand") : t("themeStylePanel.collapseButton.collapse")}
                >
                    {collapsed ? <FaChevronDown /> : <FaChevronUp />}
                </Button>
            </div>
            <div id="theme-preset-list" className={`${styles.presetList} ${collapsed ? styles.presetListCollapsed : ""}`}>
                {visiblePresets.map((item) => {
                    const active = preset === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`${styles.presetItem} ${active ? styles.presetActive : ""}`}
                            onClick={() => setPreset(item.key)}
                            aria-pressed={active}
                            title={t(`themeStylePanel.presets.${item.key}.desc`)}
                        >
                            <span className={styles.preview} style={{ backgroundColor: item.bg }}>
                                <span className={styles.previewHeader} style={{ color: item.header }}>
                                    TechHaven
                                </span>
                                <span className={styles.previewBar} style={{ backgroundColor: item.accent }} />
                                <span className={styles.previewLine} style={{ backgroundColor: item.header }} />
                                <span className={styles.previewLine} style={{ backgroundColor: item.header, opacity: 0.45 }} />
                            </span>
                            <span className={styles.presetInfo}>
                                <span className={styles.presetName}>
                                    {t(`themeStylePanel.presets.${item.key}.name`)}
                                    {active && <FaCheck className={styles.checkIcon} />}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className={styles.cursorSetting}>
                <span className={styles.cursorCopy}>
                    <span className={styles.cursorLabel}>{t("themeStylePanel.cursor.label")}</span>
                    <span className={styles.cursorHint}>{t("themeStylePanel.cursor.hint")}</span>
                </span>
                <Switch
                    checked={cursorEnabled}
                    onChange={(checked) => setCursorEnabled(checked)}
                    size="small"
                    aria-label={t("themeStylePanel.cursor.ariaLabel")}
                />
            </div>
        </div>
    );
};

export default ThemeStylePanel;

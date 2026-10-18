import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaPalette, FaCalendarAlt, FaRss, FaGlobe } from "react-icons/fa";
import { StretchHorizontal, LayoutPanelLeft, PanelTop } from "lucide-react";
import styles from "./HomeQuickTools.module.css";
import ThemeStylePanel from "../themeStylePanel/ThemeStylePanel";
import Calendar from "../calendar/Calendar";
import SubscribeBox from "../subscribeBox/SubscribeBox";
import LanguagePanel from "../languagePanel/LanguagePanel";
import { useLayoutWidth, type LayoutWidthMode } from "@/contexts/LayoutWidthContext";
import { useLayoutMode } from "@/contexts/LayoutModeContext";

type ToolKey = "theme" | "calendar" | "subscribe" | "language";
type UtilityKey = "width" | "layoutMode";

interface HomeQuickToolsProps {
    /** 仅展示指定的弹框工具；不传则展示全部 */
    tools?: ToolKey[];
    /** 以图标按钮形式收纳的工具（点击即切换） */
    utilities?: UtilityKey[];
    /** pill：顶栏横向胶囊；stack：侧边菜单纵向列 */
    variant?: "pill" | "stack";
    /** 打开工具面板时的回调（用于关闭移动端菜单） */
    onToolOpen?: () => void;
}

const HomeQuickTools: React.FC<HomeQuickToolsProps> = ({ tools, utilities, variant = "pill", onToolOpen }) => {
    const { t } = useTranslation("nav");
    const [openKey, setOpenKey] = useState<ToolKey | null>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const allTools: { key: ToolKey; label: string; icon: React.ReactNode }[] = [
        { key: "theme", label: t("tools.theme"), icon: <FaPalette /> },
        { key: "calendar", label: t("tools.calendar"), icon: <FaCalendarAlt /> },
        { key: "subscribe", label: t("tools.subscribe"), icon: <FaRss /> },
        { key: "language", label: t("tools.language"), icon: <FaGlobe /> },
    ];

    const widthLabel: Record<LayoutWidthMode, string> = {
        default: t("width.default"),
        wide: t("width.wide"),
        full: t("width.full"),
    };

    // 订阅更新尚未实现，仅开发环境展示
    const availableTools = import.meta.env.DEV ? allTools : allTools.filter((tool) => tool.key !== "subscribe");
    const visibleTools = tools ? availableTools.filter((tool) => tools.includes(tool.key)) : availableTools;

    const { mode: widthMode, cycleMode: cycleWidth } = useLayoutWidth();
    const { mode: layoutMode, toggleMode } = useLayoutMode();

    useEffect(() => {
        if (!openKey) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dockRef.current?.contains(target) || popupRef.current?.contains(target)) {
                return;
            }
            setOpenKey(null);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenKey(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [openKey]);

    const activeTool = allTools.find((tool) => tool.key === openKey);
    const showUtility = (key: UtilityKey) => utilities?.includes(key) ?? false;

    const popup =
        openKey && activeTool ? (
            <div ref={popupRef} className={`${styles.popup} ${variant === "stack" ? styles.stackPopup : ""}`}>
                <div className={styles.popupBody}>
                    {openKey === "theme" && <ThemeStylePanel />}
                    {openKey === "calendar" && <Calendar />}
                    {openKey === "subscribe" && <SubscribeBox />}
                    {openKey === "language" && <LanguagePanel />}
                </div>
            </div>
        ) : null;

    return (
        <div className={`${styles.dock} ${variant === "stack" ? styles.stack : ""}`} ref={dockRef}>
            <div className={styles.group}>
                {visibleTools.map((tool) => (
                    <button
                        key={tool.key}
                        type="button"
                        className={styles.toolBtn}
                        data-active={openKey === tool.key}
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={() => {
                            const next = openKey === tool.key ? null : tool.key;
                            setOpenKey(next);
                            if (next) {
                                onToolOpen?.();
                            }
                        }}
                    >
                        {tool.icon}
                    </button>
                ))}

                {showUtility("width") && (
                    <button
                        type="button"
                        className={`${styles.toolBtn} ${styles.widthTool}`}
                        title={t("width.tooltip", { current: widthLabel[widthMode] })}
                        aria-label={t("width.tooltip", { current: widthLabel[widthMode] })}
                        onClick={cycleWidth}
                    >
                        <StretchHorizontal size={16} />
                    </button>
                )}

                {showUtility("layoutMode") && (
                    <button
                        type="button"
                        className={styles.toolBtn}
                        title={t("layoutMode.tooltip", {
                            current: layoutMode === "appShell" ? t("layoutMode.appShell") : t("layoutMode.classic"),
                        })}
                        aria-label={t("layoutMode.tooltip", {
                            current: layoutMode === "appShell" ? t("layoutMode.appShell") : t("layoutMode.classic"),
                        })}
                        onClick={toggleMode}
                    >
                        {layoutMode === "appShell" ? <LayoutPanelLeft size={16} /> : <PanelTop size={16} />}
                    </button>
                )}
            </div>

            {variant === "stack" && popup
                ? createPortal(
                      <>
                          <div className={styles.stackBackdrop} onClick={() => setOpenKey(null)} />
                          {popup}
                      </>,
                      document.body,
                  )
                : popup}
        </div>
    );
};

export default HomeQuickTools;

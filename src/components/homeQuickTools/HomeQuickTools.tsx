import React, { useEffect, useRef, useState } from "react";
import { FaPalette, FaCalendarAlt, FaRss } from "react-icons/fa";
import { StretchHorizontal, LayoutPanelLeft, PanelTop } from "lucide-react";
import styles from "./HomeQuickTools.module.css";
import ThemeStylePanel from "../themeStylePanel/ThemeStylePanel";
import Calendar from "../calendar/Calendar";
import SubscribeBox from "../subscribeBox/SubscribeBox";
import { useLayoutWidth, type LayoutWidthMode } from "@/contexts/LayoutWidthContext";
import { useLayoutMode } from "@/contexts/LayoutModeContext";

type ToolKey = "theme" | "calendar" | "subscribe";
type UtilityKey = "width" | "layoutMode";

const TOOLS: { key: ToolKey; label: string; icon: React.ReactNode }[] = [
    { key: "theme", label: "主题风格", icon: <FaPalette /> },
    { key: "calendar", label: "站点日历", icon: <FaCalendarAlt /> },
    { key: "subscribe", label: "订阅更新", icon: <FaRss /> },
];

const WIDTH_LABEL: Record<LayoutWidthMode, string> = {
    default: "默认",
    wide: "较宽",
    full: "全宽",
};

interface HomeQuickToolsProps {
    /** 仅展示指定的弹框工具；不传则展示全部 */
    tools?: ToolKey[];
    /** 以图标按钮形式收纳的工具（点击即切换） */
    utilities?: UtilityKey[];
}

const HomeQuickTools: React.FC<HomeQuickToolsProps> = ({ tools, utilities }) => {
    const [openKey, setOpenKey] = useState<ToolKey | null>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const visibleTools = tools ? TOOLS.filter((tool) => tools.includes(tool.key)) : TOOLS;

    const { mode: widthMode, cycleMode: cycleWidth } = useLayoutWidth();
    const { mode: layoutMode, toggleMode } = useLayoutMode();

    useEffect(() => {
        if (!openKey) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
                setOpenKey(null);
            }
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

    const activeTool = TOOLS.find((tool) => tool.key === openKey);
    const showUtility = (key: UtilityKey) => utilities?.includes(key) ?? false;

    return (
        <div className={styles.dock} ref={dockRef}>
            <div className={styles.group}>
                {visibleTools.map((tool) => (
                    <button
                        key={tool.key}
                        type="button"
                        className={styles.toolBtn}
                        data-active={openKey === tool.key}
                        title={tool.label}
                        aria-label={tool.label}
                        onClick={() => setOpenKey(openKey === tool.key ? null : tool.key)}
                    >
                        {tool.icon}
                    </button>
                ))}

                {showUtility("width") && (
                    <button
                        type="button"
                        className={styles.toolBtn}
                        title={`布局宽度：${WIDTH_LABEL[widthMode]}，点击切换`}
                        aria-label={`布局宽度：${WIDTH_LABEL[widthMode]}，点击切换`}
                        onClick={cycleWidth}
                    >
                        <StretchHorizontal size={16} />
                    </button>
                )}

                {showUtility("layoutMode") && (
                    <button
                        type="button"
                        className={styles.toolBtn}
                        title={`界面布局：${layoutMode === "appShell" ? "侧栏布局" : "顶部布局"}，点击切换`}
                        aria-label={`界面布局：${layoutMode === "appShell" ? "侧栏布局" : "顶部布局"}，点击切换`}
                        onClick={toggleMode}
                    >
                        {layoutMode === "appShell" ? <LayoutPanelLeft size={16} /> : <PanelTop size={16} />}
                    </button>
                )}
            </div>

            {openKey && activeTool && (
                <div className={styles.popup}>
                    <div className={styles.popupBody}>
                        {openKey === "theme" && <ThemeStylePanel />}
                        {openKey === "calendar" && <Calendar />}
                        {openKey === "subscribe" && <SubscribeBox />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeQuickTools;

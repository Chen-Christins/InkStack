import React, { useEffect, useRef, useState } from "react";
import { FaPalette, FaCalendarAlt, FaRss } from "react-icons/fa";
import styles from "./HomeQuickTools.module.css";
import ThemeStylePanel from "../themeStylePanel/ThemeStylePanel";
import Calendar from "../calendar/Calendar";
import SubscribeBox from "../subscribeBox/SubscribeBox";

type ToolKey = "theme" | "calendar" | "subscribe";

const TOOLS: { key: ToolKey; label: string; icon: React.ReactNode }[] = [
    { key: "theme", label: "主题风格", icon: <FaPalette /> },
    { key: "calendar", label: "站点日历", icon: <FaCalendarAlt /> },
    { key: "subscribe", label: "订阅更新", icon: <FaRss /> },
];

const HomeQuickTools: React.FC = () => {
    const [openKey, setOpenKey] = useState<ToolKey | null>(null);
    const dockRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className={styles.dock} ref={dockRef}>
            <div className={styles.group}>
                {TOOLS.map((tool) => (
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

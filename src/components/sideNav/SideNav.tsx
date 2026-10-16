import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaBuilding, FaQuestionCircle } from "react-icons/fa";
import styles from "./SideNav.module.css";
import ThemeToggle from "../themeToggle/ThemeToggle";
import LayoutModeToggle from "../layoutModeToggle/LayoutModeToggle";
import Avatar from "../avatar/Avatar";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface SideNavProps {
    open?: boolean;
    onClose?: () => void;
}

interface Indicator {
    top: number;
    height: number;
}

// 跨页面挂载记住上一次激活项，用于切换时的滑动动效
let lastActiveIndex: number | null = null;

const SideNav: React.FC<SideNavProps> = ({ open = false, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings: siteSettings } = useSiteSettings();
    const { t } = useTranslation("nav");

    const navItems = [
        { label: t("home"), icon: <FaHome />, path: "/index" },
        { label: t("organizationsShort"), icon: <FaBuilding />, path: "/organizations/list" },
        { label: t("help"), icon: <FaQuestionCircle />, path: "/help" },
    ];

    const isActive = (path: string) => {
        if (path === "/index") {
            return location.pathname === "/index" || location.pathname === "/";
        }
        if (path === "/organizations/list") {
            return location.pathname.startsWith("/organizations") || location.pathname.startsWith("/organization");
        }
        return location.pathname === path;
    };

    const activeIndex = navItems.findIndex((item) => isActive(item.path));
    const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
    const mountedRef = useRef(false);
    const moveTimer = useRef<number | null>(null);
    const [indicator, setIndicator] = useState<Indicator | null>(null);
    const [moving, setMoving] = useState(false);

    const measure = (index: number): Indicator | null => {
        const el = index >= 0 ? itemRefs.current[index] : null;
        return el ? { top: el.offsetTop, height: el.offsetHeight } : null;
    };

    // 触发一次「水流挤压」动画
    const pulse = () => {
        setMoving(false);
        window.requestAnimationFrame(() => {
            setMoving(true);
            if (moveTimer.current) {
                window.clearTimeout(moveTimer.current);
            }
            moveTimer.current = window.setTimeout(() => setMoving(false), 420);
        });
    };

    useEffect(() => {
        return () => {
            if (moveTimer.current) {
                window.clearTimeout(moveTimer.current);
            }
        };
    }, []);

    useLayoutEffect(() => {
        const next = measure(activeIndex);
        if (!next) {
            setIndicator(null);
            lastActiveIndex = activeIndex;
            return;
        }

        if (!mountedRef.current) {
            mountedRef.current = true;
            // 首次挂载：若上一布局记录了不同的激活项，则先落在旧位置再滑过去
            const prev = lastActiveIndex !== null && lastActiveIndex !== activeIndex ? measure(lastActiveIndex) : null;
            if (prev) {
                setIndicator(prev);
                lastActiveIndex = activeIndex;
                pulse();
                const timer = window.setTimeout(() => setIndicator(next), 20);
                return () => window.clearTimeout(timer);
            }
            setIndicator(next);
            lastActiveIndex = activeIndex;
            return;
        }

        // 同一实例内切换：直接更新，触发平滑滑动 + 挤压
        setIndicator(next);
        pulse();
        lastActiveIndex = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        const handleResize = () => {
            const next = measure(activeIndex);
            if (next) {
                setIndicator(next);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [activeIndex]);

    const handleNav = (path: string) => {
        navigate(path);
        if (onClose) {
            onClose();
        }
    };

    return (
        <>
            <aside className={`${styles.sideNav} ${open ? styles.open : ""}`}>
                {/* 站点品牌：左上角 */}
                <div
                    className={styles.brand}
                    onClick={() => handleNav("/index")}
                    role="button"
                    tabIndex={0}
                    aria-label={t("backToHome")}
                >
                    <Avatar name={siteSettings.siteName} size={28} />
                    <span className={styles.brandName}>{siteSettings.siteName}</span>
                </div>

                {/* 导航胶囊 */}
                <ul className={styles.navList}>
                    {indicator && (
                        <span
                            className={styles.indicator}
                            data-moving={moving}
                            style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
                        >
                            <span className={styles.indicatorInner} />
                        </span>
                    )}
                    {navItems.map((item, index) => (
                        <li
                            key={item.path}
                            className={styles.navItem}
                            ref={(el) => {
                                itemRefs.current[index] = el;
                            }}
                        >
                            <div className={styles.navLink} data-active={isActive(item.path)} onClick={() => handleNav(item.path)}>
                                <span className={styles.linkIcon}>{item.icon}</span>
                                <span className={styles.linkText}>{item.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* 工具胶囊 */}
                <div className={styles.utilities}>
                    <div className={styles.utilitySlot}>
                        <ThemeToggle />
                    </div>
                    <div className={styles.utilitySlot}>
                        <LayoutModeToggle />
                    </div>
                </div>
            </aside>

            <div className={`${styles.overlay} ${open ? styles.overlayShow : ""}`} onClick={onClose} aria-hidden="true" />
        </>
    );
};

export default SideNav;

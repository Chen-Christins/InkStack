import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPen, FaSave, FaFly, FaBars, FaSignOutAlt, FaUserCircle, FaRegComments, FaFlask } from "react-icons/fa";
import styles from "./TopBar.module.css";
import Notification from "../notification/Notification";
import BroadcastMarquee from "../broadcastMarquee/BroadcastMarquee";
import Avatar from "../avatar/Avatar";
import { encodeId } from "@/utils/HashId.ts";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEditorToolbar } from "@/contexts/EditorToolbarContext";
import { isNormalUser, type PlatformRole as PlatformRoleType } from "@/types/Roles.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";

interface TopBarProps {
    onMenuClick?: () => void;
    tools?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, tools }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout, loading } = useAuth();
    const editor = useEditorToolbar();
    const { settings: siteSettings } = useSiteSettings();
    const { t } = useTranslation("nav");
    const { t: tCommon } = useTranslation("common");
    const enums = useEnumLabels();
    const defaultLogo = "/techhaven-logo.svg";

    const [isScrolled, setIsScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [hasBroadcast, setHasBroadcast] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const currentUser = user
        ? {
              name: user.name || user.account || tCommon("user.fallbackName"),
              avatar: user.avatar || "https://picsum.photos/id/64/200",
              role: user.role
                  ? enums.platformRole[user.role as PlatformRoleType] || tCommon("user.fallbackName")
                  : tCommon("user.fallbackName"),
              email: user.email,
          }
        : null;

    const normalUser = isNormalUser(user?.role);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 未登录：直接重定向到登录页
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/auth?redirect=${redirect}`, { replace: true });
        }
    }, [loading, isAuthenticated, navigate]);

    return (
        <header className={`${styles.topBar} ${isScrolled ? styles.topBarScrolled : ""}`}>
            <div className={`${styles.bar} ${hasBroadcast ? styles.barWithBroadcast : ""}`}>
                <div className={styles.leftGroup}>
                    <button className={styles.menuBtn} onClick={onMenuClick} type="button" aria-label={t("openNavMenu")}>
                        <FaBars />
                    </button>
                    <div className={styles.logoPill} onClick={() => navigate("/index")} role="button" tabIndex={0}>
                        <img src={siteSettings.siteLogo || defaultLogo} alt={siteSettings.siteName} className={styles.logoImage} />
                        <span className={styles.siteName}>{siteSettings.siteName}</span>
                    </div>
                </div>

                <div className={styles.marqueeInline}>
                    <BroadcastMarquee onActiveChange={setHasBroadcast} />
                </div>

                <div className={styles.centerGroup}>
                    {editor?.state.active ? (
                        <>
                            <button
                                className={styles.secondaryActionBtn}
                                onClick={() => editor.handlersRef.current?.onSaveDraft()}
                                disabled={editor.state.submitting}
                                type="button"
                            >
                                <FaSave className={styles.actionIcon} />
                                <span>{editor.state.isEdit ? t("saveChanges") : t("saveDraft")}</span>
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={() => editor.handlersRef.current?.onPublish()}
                                disabled={editor.state.submitting}
                                type="button"
                            >
                                <FaFly className={styles.actionIcon} />
                                <span>{editor.state.isEdit ? t("updateArticle") : t("publishArticle")}</span>
                            </button>
                        </>
                    ) : (
                        <button className={styles.actionBtn} onClick={() => navigate("/article/create")} type="button">
                            <FaPen className={styles.actionIcon} />
                            <span>{t("writeArticle")}</span>
                        </button>
                    )}
                </div>

                {tools}

                <div className={styles.rightGroup} ref={userMenuRef}>
                    {import.meta.env.DEV && (
                        <button
                            className={styles.iconBtn}
                            onClick={() => navigate("/test/chunk-upload")}
                            type="button"
                            title={t("testPage")}
                            aria-label={t("testPage")}
                        >
                            <FaFlask />
                        </button>
                    )}

                    {isAuthenticated && <Notification />}

                    {loading ? (
                        <div className={styles.avatarPlaceholder}></div>
                    ) : isAuthenticated && currentUser ? (
                        <>
                            <div className={styles.userArea} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                <Avatar src={currentUser.avatar} name={currentUser.name} size={30} />
                            </div>

                            {userMenuOpen && (
                                <div className={styles.userDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <button
                                            type="button"
                                            className={styles.dropdownAvatarBtn}
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                if (user) {
                                                    navigate(`/profile/${encodeId(user.id, "user")}`);
                                                }
                                            }}
                                            title={t("viewProfile")}
                                            aria-label={t("viewProfile")}
                                        >
                                            <Avatar src={currentUser.avatar} name={currentUser.name} size={48} />
                                        </button>
                                        <div className={styles.dropdownUserInfo}>
                                            <div className={styles.dropdownUserName}>{currentUser.name}</div>
                                            <div className={styles.dropdownUserEmail}>{currentUser.email}</div>
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider}></div>
                                    <div className={styles.dropdownMenu}>
                                        <div
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                navigate("/personal");
                                            }}
                                        >
                                            <FaUserCircle />
                                            {t("personalCenter")}
                                        </div>
                                        {!normalUser && (
                                            <>
                                                <div
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        navigate("/messages");
                                                    }}
                                                >
                                                    <FaRegComments />
                                                    {t("messages")}
                                                </div>
                                                <div className={styles.dropdownDivider}></div>
                                            </>
                                        )}
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                logout();
                                            }}
                                            type="button"
                                        >
                                            <FaSignOutAlt />
                                            {t("logout")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </header>
    );
};

export default TopBar;

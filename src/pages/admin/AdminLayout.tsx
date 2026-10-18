import React, { useState } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    FaHome,
    FaUsers,
    FaFileAlt,
    FaCog,
    FaBars,
    FaTimes,
    FaComments,
    FaTags,
    FaImages,
    FaDatabase,
    FaLock,
    FaClipboardList,
    FaBuilding,
    FaBell,
    FaPaperPlane,
} from "react-icons/fa";
import styles from "./AdminLayout.module.css";
import ThemeToggle from "@/components/themeToggle/ThemeToggle";
import Notification from "@/components/notification/Notification";
import UserDropdown from "@/components/userDropdown/UserDropdown";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/types/Roles.ts";

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    section?: string;
}

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout, isAuthenticated, loading } = useAuth();
    const { t } = useTranslation("admin");

    // 如果正在加载认证状态，显示加载中
    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "16px",
                    color: "var(--text-secondary)",
                }}
            >
                {t("layout.loading")}
            </div>
        );
    }

    // 如果用户未登录，重定向到登录页面
    if (!isAuthenticated || !user) {
        navigate("/auth?redirect=" + encodeURIComponent(location.pathname + location.search));
        return null;
    }

    // 权限校验：非管理员禁止访问
    if (!isAdmin(user.role)) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    padding: "20px",
                }}
            >
                <div
                    style={{
                        fontSize: "64px",
                        color: "#dc3545", // 使用红色表示警告
                        marginBottom: "24px",
                        opacity: 0.9,
                    }}
                >
                    <FaLock />
                </div>
                <h1
                    style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        marginBottom: "12px",
                        color: "var(--text-primary)",
                    }}
                >
                    {t("layout.accessDenied")}
                </h1>
                <p
                    style={{
                        fontSize: "16px",
                        color: "var(--text-secondary)",
                        marginBottom: "32px",
                        textAlign: "center",
                        maxWidth: "480px",
                        lineHeight: "1.6",
                    }}
                >
                    {t("layout.deniedLine1")}
                    <br />
                    {t("layout.deniedLine2")}
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <FaHome /> {t("layout.backHome")}
                    </button>
                    <button
                        onClick={() => logout()}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
                        }}
                    >
                        {t("layout.switchAccount")}
                    </button>
                </div>
            </div>
        );
    }

    if (!user.avatar) {
        user.avatar = "https://picsum.photos/id/64/200"; // 默认头像
    }

    // 处理退出登录
    const handleLogout = () => {
        logout();
    };

    // 导航菜单配置
    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: t("layout.sections.main"),
            items: [
                { id: "dashboard", label: t("layout.nav.dashboard"), icon: <FaHome />, path: "/admin" },
                {
                    id: "users",
                    label: t("layout.nav.users"),
                    icon: <FaUsers />,
                    path: "/admin/users",
                },
                {
                    id: "articles",
                    label: t("layout.nav.articles"),
                    icon: <FaFileAlt />,
                    path: "/admin/articles",
                },
                {
                    id: "assignments",
                    label: t("layout.nav.assignments"),
                    icon: <FaClipboardList />,
                    path: "/admin/assignments",
                },
                {
                    id: "organizations",
                    label: t("layout.nav.organizations"),
                    icon: <FaBuilding />,
                    path: "/admin/organizations",
                },
                {
                    id: "comments",
                    label: t("layout.nav.comments"),
                    icon: <FaComments />,
                    path: "/admin/comments",
                },
                {
                    id: "notifications",
                    label: t("layout.nav.notifications"),
                    icon: <FaBell />,
                    path: "/admin/notifications",
                },
            ],
        },
        {
            title: t("layout.sections.content"),
            items: [
                {
                    id: "categories",
                    label: t("layout.nav.categories"),
                    icon: <FaTags />,
                    path: "/admin/categories",
                },
                ...(import.meta.env.DEV
                    ? [
                          {
                              id: "media",
                              label: t("layout.nav.media"),
                              icon: <FaImages />,
                              path: "/admin/media",
                          },
                      ]
                    : []),
                {
                    id: "database",
                    label: t("layout.nav.database"),
                    icon: <FaDatabase />,
                    path: "/admin/database",
                },
            ],
        },
        {
            title: t("layout.sections.system"),
            items: [
                {
                    id: "settings",
                    label: t("layout.nav.settings"),
                    icon: <FaCog />,
                    path: "/admin/settings",
                },
            ],
        },
        {
            title: t("layout.sections.operation"),
            items: [
                {
                    id: "feedbacks",
                    label: t("layout.nav.feedbacks"),
                    icon: <FaPaperPlane />,
                    path: "/admin/feedbacks",
                },
            ],
        },
    ];

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // 切换移动端菜单
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // 关闭移动端菜单
    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // 显示工具提示
    const showTooltip = (event: React.MouseEvent, text: string) => {
        if (sidebarCollapsed) {
            // 创建或显示tooltip
            let tooltip = document.getElementById("admin-sidebar-tooltip");
            if (!tooltip) {
                tooltip = document.createElement("div");
                tooltip.id = "admin-sidebar-tooltip";
                tooltip.style.cssText = `
                    position: fixed;
                    padding: 8px 12px;
                    background-color: var(--text-primary);
                    color: var(--bg-primary);
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    white-space: nowrap;
                    z-index: 10000;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                    pointer-events: none;
                    opacity: 0;
                    max-width: 200px;
                    text-align: center;
                `;
                document.body.appendChild(tooltip);
            }

            tooltip.textContent = text;
            const rect = event.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 12}px`;
            tooltip.style.top = `${rect.top + rect.height / 2}px`;
            tooltip.style.transform = "translateY(-50%)";

            // 显示tooltip
            setTimeout(() => {
                if (tooltip) {
                    tooltip.style.opacity = "1";
                }
            }, 10);
        }
    };

    // 隐藏工具提示
    const hideTooltip = () => {
        const tooltip = document.getElementById("admin-sidebar-tooltip");
        if (tooltip) {
            tooltip.style.opacity = "0";
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    };

    // 获取面包屑导航
    const getBreadcrumbs = () => {
        const pathSegments = location.pathname.split("/").filter(Boolean);
        const breadcrumbs: { label: string; path: string }[] = [{ label: t("layout.breadcrumbHome"), path: "/admin" }];

        if (pathSegments.length > 1) {
            const currentSection = navSections.find((section) => section.items.some((item) => item.path === location.pathname));

            if (currentSection) {
                const currentItem = currentSection.items.find((item) => item.path === location.pathname);
                if (currentItem) {
                    breadcrumbs.push({
                        label: currentItem.label,
                        path: currentItem.path,
                    });
                }
            }
        } else if (pathSegments.length === 1 && pathSegments[0] === "admin") {
            // 当前在仪表盘页面
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className={styles.adminLayout}>
            {/* 移动端菜单遮罩 */}
            <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.show : ""}`} onClick={closeMobileMenu} />

            <div className={styles.adminContainer}>
                {/* 侧边栏 */}
                <aside
                    className={`${styles.adminSidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileMenuOpen ? styles.mobileOpen : ""}`}
                >
                    {/* Logo区域 */}
                    <div className={styles.adminSidebarHeader}>
                        <div
                            onClick={() => {
                                navigate("/admin");
                            }}
                            className={styles.adminLogo}
                        >
                            <span className={styles.adminLogoIcon}>⚡</span>
                            <span className={styles.adminLogoText}>{t("layout.brand")}</span>
                        </div>
                        <button
                            className={styles.toggleSidebarBtn}
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? t("layout.expandSidebar") : t("layout.collapseSidebar")}
                        >
                            {sidebarCollapsed ? <FaBars /> : <FaTimes />}
                        </button>
                    </div>

                    {/* 导航菜单 */}
                    <nav className={styles.adminNavMenu}>
                        {navSections.map((section) => (
                            <div key={section.title} className={styles.adminNavSection}>
                                <h3 className={styles.adminSectionTitle}>{section.title}</h3>
                                {section.items.map((item) => (
                                    <div key={item.id} className={styles.adminNavItem}>
                                        <div
                                            onClick={() => {
                                                navigate(item.path);
                                                closeMobileMenu();
                                            }}
                                            className={`${styles.adminNavLink} ${location.pathname === item.path ? styles.active : ""}`}
                                            onMouseEnter={(e) => showTooltip(e, item.label)}
                                            onMouseLeave={hideTooltip}
                                        >
                                            <span className={styles.adminNavIcon}>{item.icon}</span>
                                            <span className={styles.adminNavText}>{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* 主内容区域 */}
                <main className={`${styles.adminMainContent} ${sidebarCollapsed ? styles.expanded : ""}`}>
                    {/* 顶部栏 */}
                    <header className={styles.adminTopBar}>
                        <div className={styles.adminTopBarLeft}>
                            {/* 移动端菜单按钮 */}
                            <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label={t("layout.openMenu")}>
                                <FaBars />
                            </button>

                            {/* 面包屑导航 */}
                            <nav className={styles.adminBreadcrumb}>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                                        {index === breadcrumbs.length - 1 ? (
                                            <span className={styles.breadcrumbActive}>{crumb.label}</span>
                                        ) : (
                                            <div onClick={() => navigate(crumb.path)} className={styles.breadcrumbLink}>
                                                {crumb.label}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        {/* 顶部操作区域 */}
                        <div className={styles.adminTopBarActions}>
                            <ThemeToggle />
                            <Notification />

                            {/* 用户信息区域 */}
                            <UserDropdown user={user} onLogout={handleLogout} showAdminLink={false} />
                        </div>
                    </header>

                    {/* 页面内容 */}
                    <div className={styles.adminPageContent}>
                        <Outlet />
                    </div>

                    {/* Footer */}
                    <Footer startYear={2025} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

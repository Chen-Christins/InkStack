import { AGENT_ENABLED } from "@/config/Features";
import { FaRobot } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Outlet, useSearchParams } from "react-router-dom";
import { useRdNavigate } from "@/hooks/UseRdNavigate.ts";
import { encodeId, decodeId } from "@/utils/HashId.ts";
import {
    FaHome,
    FaBars,
    FaTimes,
    FaClipboardList,
    FaBug,
    FaTasks,
    FaTicketAlt,
    FaCode,
    FaLock,
    FaChartLine,
    FaBuilding,
} from "react-icons/fa";
import styles from "./RdLayout.module.css";
import ThemeToggle from "@/components/themeToggle/ThemeToggle";
import Notification from "@/components/notification/Notification";
import UserDropdown from "@/components/userDropdown/UserDropdown";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import AuthRequired from "@/components/auth/AuthRequired";
import OrgSelector from "@/components/orgSelector/OrgSelector";
import RdEntryLoader from "@/components/rdEntryLoader";
import { useAuth } from "@/contexts/AuthContext";
import { RdOrgProvider, useRdOrg } from "@/contexts/RdOrgContext";
import { RdPlatformService } from "@/services/RdPlatformService.ts";

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

const RdLayout: React.FC = () => {
    const navigate = useRdNavigate();
    const { t } = useTranslation("rd");
    const [searchParams] = useSearchParams();
    const rawOrg = searchParams.get("org");
    const urlOrgId = rawOrg ? decodeId(rawOrg, "organization")?.toString() || "" : "";
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout, isAuthenticated, loading } = useAuth();

    // 权限校验：调用后端 check_access 接口
    const [accessChecked, setAccessChecked] = useState(false);
    const [canAccess, setCanAccess] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }
        RdPlatformService.checkAccess()
            .then((result) => {
                setCanAccess(result.canAccess);
            })
            .catch(() => {
                setCanAccess(false);
            })
            .finally(() => setAccessChecked(true));
    }, [user]);

    if (loading) {
        return <RdEntryLoader stage="auth" />;
    }

    if (!isAuthenticated || !user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "transparent",
                }}
            >
                <Navbar />
                <div
                    style={{
                        flex: 1,
                        maxWidth: "var(--page-max-width)",
                        margin: "0 auto",
                        width: "100%",
                        padding: "2rem 1.8rem",
                    }}
                >
                    <AuthRequired message={t("layout.authRequired")}>{null}</AuthRequired>
                </div>
                <Footer startYear={2025} />
            </div>
        );
    }

    if (!accessChecked) {
        return <RdEntryLoader stage="access" />;
    }

    if (!canAccess) {
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
                        color: "#f0a020",
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
                    {t("layout.needOrgTitle")}
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
                    {t("layout.needOrgLine1")}
                    <br />
                    {t("layout.needOrgLine2")}
                </p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                        onClick={() => navigate("/organizations/list")}
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
                        <FaBuilding /> {t("layout.joinOrg")}
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
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
        user.avatar = "https://picsum.photos/id/64/200";
    }

    const handleLogout = () => {
        logout();
    };

    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: t("layout.sections.overview"),
            items: [{ id: "dashboard", label: t("layout.nav.dashboard"), icon: <FaHome />, path: "/rd" }],
        },
        {
            title: t("layout.sections.rdManagement"),
            items: [
                { id: "requirements", label: t("layout.nav.requirements"), icon: <FaClipboardList />, path: "/rd/requirements" },
                { id: "bugs", label: t("layout.nav.bugs"), icon: <FaBug />, path: "/rd/bugs" },
                { id: "tasks", label: t("layout.nav.tasks"), icon: <FaTasks />, path: "/rd/tasks" },
                { id: "reviews", label: t("layout.nav.reviews"), icon: <FaCode />, path: "/rd/reviews" },
            ],
        },
        ...(AGENT_ENABLED
            ? [
                  {
                      title: t("layout.sections.smartCollab"),
                      items: [{ id: "agent", label: t("layout.nav.agent"), icon: <FaRobot />, path: "/rd/agent" }],
                  },
              ]
            : []),
        {
            title: t("layout.sections.analytics"),
            items: [{ id: "trends", label: t("layout.nav.trends"), icon: <FaChartLine />, path: "/rd/trends" }],
        },
        {
            title: t("layout.sections.myRelated"),
            items: [{ id: "myTickets", label: t("layout.nav.myTickets"), icon: <FaTicketAlt />, path: "/rd/my-tickets" }],
        },
    ];

    const orgRoleNames: Record<number, string> = {
        1: t("layout.roles.member"),
        2: t("layout.roles.reporter"),
        3: t("layout.roles.developer"),
        4: t("layout.roles.rdLead"),
        5: t("layout.roles.orgAdmin"),
    };

    const RdHeaderActions: React.FC = () => {
        const { selectedOrgId, currentOrgRole } = useRdOrg();
        const orgRoleName = orgRoleNames[currentOrgRole] || "";
        // 全部组织 → 显示系统角色；具体组织 → 显示组织内角色
        const roleOverride = !selectedOrgId ? String(user?.role || "") : orgRoleName;
        return (
            <div className={styles.rdTopBarActions}>
                <ThemeToggle />
                <Notification />
                <UserDropdown user={user} onLogout={handleLogout} showAdminLink={false} roleOverride={roleOverride} />
            </div>
        );
    };

    const SidebarOrgSelector: React.FC = () => {
        const { orgs, selectedOrgId, setSelectedOrgId } = useRdOrg();
        const [, setSearchParams] = useSearchParams();

        const handleOrgChange = (orgId: string) => {
            setSelectedOrgId(orgId);
            if (orgId) {
                setSearchParams({ org: encodeId(orgId, "organization") }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        };

        return <OrgSelector orgs={orgs} selectedOrgId={selectedOrgId} onChange={handleOrgChange} collapsed={sidebarCollapsed} />;
    };

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const showTooltip = (event: React.MouseEvent, text: string) => {
        if (sidebarCollapsed) {
            let tooltip = document.getElementById("rd-sidebar-tooltip");
            if (!tooltip) {
                tooltip = document.createElement("div");
                tooltip.id = "rd-sidebar-tooltip";
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
            setTimeout(() => {
                if (tooltip) {
                    tooltip.style.opacity = "1";
                }
            }, 10);
        }
    };

    const hideTooltip = () => {
        const tooltip = document.getElementById("rd-sidebar-tooltip");
        if (tooltip) {
            tooltip.style.opacity = "0";
            setTimeout(() => {
                if (tooltip?.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    };

    const getBreadcrumbs = () => {
        const pathSegments = location.pathname.split("/").filter(Boolean);
        const breadcrumbs: { label: string; path: string }[] = [{ label: t("layout.breadcrumbHome"), path: "/rd" }];

        if (pathSegments.length >= 2) {
            const navItems = navSections.flatMap((section) => section.items);
            const currentItem =
                navItems.find((item) => location.pathname === item.path) ??
                navItems
                    .filter((item) => item.path !== "/rd" && location.pathname.startsWith(item.path + "/"))
                    .sort((a, b) => b.path.length - a.path.length)[0];

            if (currentItem && currentItem.path !== "/rd") {
                breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
            }

            // Add context-specific breadcrumb
            if (location.pathname.includes("/create")) {
                breadcrumbs.push({ label: t("layout.breadcrumb.create"), path: location.pathname });
            } else if (location.pathname.includes("/edit")) {
                breadcrumbs.push({ label: t("layout.breadcrumb.edit"), path: location.pathname });
            } else if (pathSegments.length >= 3 && !location.pathname.includes("/create") && !location.pathname.includes("/edit")) {
                breadcrumbs.push({ label: t("layout.breadcrumb.detail"), path: location.pathname });
            }
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // 导航时自动保留 org 参数（由 useRdNavigate hook 处理）

    return (
        <div className={styles.rdLayout}>
            <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.show : ""}`} onClick={closeMobileMenu} />

            <RdOrgProvider initialOrgId={urlOrgId}>
                <div className={styles.rdContainer}>
                    {/* 侧边栏 */}
                    <aside
                        className={`${styles.rdSidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileMenuOpen ? styles.mobileOpen : ""}`}
                    >
                        <div className={styles.rdSidebarHeader}>
                            <div onClick={() => navigate("/rd")} className={styles.rdLogo}>
                                <span className={styles.rdLogoIcon}>⚙</span>
                                <span className={styles.rdLogoText}>{t("layout.brand")}</span>
                            </div>
                            <button
                                className={styles.toggleSidebarBtn}
                                onClick={toggleSidebar}
                                title={sidebarCollapsed ? t("layout.expandSidebar") : t("layout.collapseSidebar")}
                            >
                                {sidebarCollapsed ? <FaBars /> : <FaTimes />}
                            </button>
                        </div>

                        <SidebarOrgSelector />

                        <nav className={styles.rdNavMenu}>
                            {navSections.map((section) => (
                                <div key={section.title} className={styles.rdNavSection}>
                                    <h3 className={styles.rdSectionTitle}>{section.title}</h3>
                                    {section.items.map((item) => (
                                        <div key={item.id} className={styles.rdNavItem}>
                                            <div
                                                onClick={() => {
                                                    navigate(item.path);
                                                    closeMobileMenu();
                                                }}
                                                className={`${styles.rdNavLink} ${location.pathname === item.path || (item.path !== "/rd" && location.pathname.startsWith(item.path)) ? styles.active : ""}`}
                                                onMouseEnter={(e) => showTooltip(e, item.label)}
                                                onMouseLeave={hideTooltip}
                                            >
                                                <span className={styles.rdNavIcon}>{item.icon}</span>
                                                <span className={styles.rdNavText}>{item.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </nav>
                    </aside>

                    <main className={`${styles.rdMainContent} ${sidebarCollapsed ? styles.expanded : ""}`}>
                        <header className={styles.rdTopBar}>
                            <div className={styles.rdTopBarLeft}>
                                <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label={t("layout.openMenu")}>
                                    <FaBars />
                                </button>

                                <nav className={styles.rdBreadcrumb}>
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

                            <RdHeaderActions />
                        </header>

                        <div className={styles.rdPageContent}>
                            <Outlet />
                        </div>

                        <Footer startYear={2025} />
                    </main>
                </div>
            </RdOrgProvider>
        </div>
    );
};

export default RdLayout;

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppShell from "./AppShell";
import HomeQuickTools from "../homeQuickTools/HomeQuickTools";

/**
 * 前台布局：一次挂载 AppShell（SideNav/TopBar/Footer 常驻），
 * 仅切换 <Outlet /> 内容，保证侧栏导航切换动效连续。
 */
const FrontLayout: React.FC = () => {
    const location = useLocation();
    const isHome = location.pathname === "/index" || location.pathname === "/";
    const isHelp = location.pathname === "/help";
    const isEditor = location.pathname.startsWith("/article/create") || location.pathname.startsWith("/article/edit");
    const isOrg = location.pathname.startsWith("/organizations") || location.pathname.startsWith("/organization");

    return (
        <AppShell fit={isHome || isHelp || isEditor || isOrg} topBarTools={isHome ? <HomeQuickTools /> : undefined}>
            <Outlet />
        </AppShell>
    );
};

export default FrontLayout;

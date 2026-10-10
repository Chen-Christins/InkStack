import React, { useState } from "react";
import styles from "./AppShell.module.css";
import SideNav from "../sideNav/SideNav";
import TopBar from "../topBar/TopBar";
import Footer from "../footer/Footer";
import { EditorToolbarProvider } from "@/contexts/EditorToolbarContext";

interface AppShellProps {
    children: React.ReactNode;
    /** 是否让主体占满视口高度、内部滚动（如首页） */
    fit?: boolean;
    /** 顶部工具栏中部的扩展胶囊组 */
    topBarTools?: React.ReactNode;
    /** 附加到内容外壳的类名 */
    className?: string;
}

const AppShell: React.FC<AppShellProps> = ({ children, fit = false, topBarTools, className }) => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <EditorToolbarProvider>
            <div className={styles.index}>
                <SideNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

                <div className={`${styles.pageShell} ${fit ? styles.fit : ""} ${className || ""}`}>
                    <TopBar onMenuClick={() => setMobileNavOpen(true)} tools={topBarTools} />
                    {children}
                    <Footer startYear={2025} className={styles.footer} />
                </div>
            </div>
        </EditorToolbarProvider>
    );
};

export default AppShell;

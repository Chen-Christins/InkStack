import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useLanguageSync } from "./i18n/UseLanguageSync";
import { MessageProvider } from "./components/message/Message";
import { ConfirmProvider } from "./components/confirm/Confirm";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LayoutWidthProvider } from "./contexts/LayoutWidthContext";
import { LayoutModeProvider } from "./contexts/LayoutModeContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import IdleTimeoutHandler from "./components/sessionTimeout/IdleTimeoutHandler";
import RouterConfig from "./router/RouterConfig";
import ThemeBackground from "./components/themeBackground";
import SessionNotifier from "./components/auth/SessionNotifier";
import { usePresenceConnection } from "./hooks/UseOnlineCount.ts";
import { useDevToolsProtection } from "./hooks/UseDevToolsProtection.ts";
import { initErrorCodes } from "./utils/ErrorCodes.ts";
import "./utils/ErrorHandlers.ts"; // 注册业务 errno 处理器（1101 等）

function AppContent() {
    usePresenceConnection();
    useDevToolsProtection();
    useLanguageSync();

    // 启动时立即加载错误码（不依赖 settings）
    useEffect(() => {
        initErrorCodes();
    }, []);

    return (
        <>
            <IdleTimeoutHandler />
            <MessageProvider>
                <ConfirmProvider>
                    <ThemeBackground />
                    <SessionNotifier />
                    <SimpleBar
                        style={{
                            maxHeight: "100vh",
                            width: "100vw",
                            overflowX: "hidden",
                        }}
                        autoHide={false}
                    >
                        <RouterConfig />
                    </SimpleBar>
                </ConfirmProvider>
            </MessageProvider>
        </>
    );
}

function App() {
    return (
        <I18nextProvider i18n={i18n}>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <LayoutWidthProvider>
                            <LayoutModeProvider>
                                <SiteSettingsProvider>
                                    <AppContent />
                                </SiteSettingsProvider>
                            </LayoutModeProvider>
                        </LayoutWidthProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </I18nextProvider>
    );
}

export default App;

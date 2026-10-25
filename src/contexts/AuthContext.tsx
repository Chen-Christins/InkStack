import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService.ts";
import { PasskeyService } from "../services/PasskeyService.ts";
import { sessionEvents } from "../auth/SessionEvents.ts";
import { clearLegacyAuthCookies } from "../auth/CookieHelper.ts";
import { notificationWS, chatWS } from "../services/WsInstances.ts";
import { setFaviconBadge } from "../utils/Favicon.ts";
import { resetNotificationState } from "../utils/NotificationState.ts";
import { canChat } from "../types/Roles.ts";
import i18n from "../i18n";

// 用户信息类型
export interface User {
    id: number | string;
    account: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    website?: string;
    github?: string;
    role: number;
    login_time: number | string;
    status: number | string;
    following_count?: number;
    follower_count?: number;
}

export interface LoginResult {
    requires2fa: boolean;
    tempToken?: string;
}

// 认证上下文类型
interface AuthContextType {
    user: User | null;
    login: (authId: string, password: string) => Promise<LoginResult>;
    verifyTwoFactor: (tempToken: string, code: string) => Promise<void>;
    verifyTwoFactorRecovery: (tempToken: string, recoveryCode: string) => Promise<void>;
    loginWithPasskey: (authId?: string) => Promise<void>;
    recoverWithEmail: (email: string, authCode: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    loginError: string | null;
    clearLoginError: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(data: Record<string, any>): User {
    return {
        ...(data as User),
        role: Number(data.role) || 1,
        account: data.account || data.username || "",
        login_time: data.login_time || new Date().toISOString(),
        status: data.status ?? data.is_deleted ?? 0,
    };
}

function getErrorMessage(error: any, fallback: string): string {
    if (error?.name === "NotAllowedError") {
        return i18n.t("auth:message.passkeyCancelled");
    }
    return error?.msg || error?.message || fallback;
}

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const navigate = useNavigate();
    const authGenerationRef = useRef(0);

    const disconnectWebSockets = useCallback(() => {
        notificationWS.disconnect();
        chatWS.disconnect();
    }, []);

    const clearAuthRuntimeState = useCallback(() => {
        disconnectWebSockets();
        setUser(null);
        resetNotificationState();
        setFaviconBadge(0);
    }, [disconnectWebSockets]);

    const clearAuthStateAndLegacyCookies = useCallback(() => {
        clearAuthRuntimeState();
        clearLegacyAuthCookies();
    }, [clearAuthRuntimeState]);

    const completeLogin = useCallback(async (generation: number) => {
        try {
            const userResponse = await AuthService.getUserInfo(undefined, { skipSessionInvalidation: true });
            if (generation !== authGenerationRef.current) {
                return;
            }
            if (userResponse.errno !== 0 || !userResponse.data) {
                throw new Error(i18n.t("auth:message.userInfoInvalid"));
            }
            setUser(normalizeUser(userResponse.data));
        } catch (error) {
            if (generation === authGenerationRef.current) {
                // 登录接口可能已经设置了 Cookie，但用户信息校验失败；尽量撤销服务端会话，避免半登录。
                try {
                    await AuthService.logout();
                } catch {
                    // 忽略清理失败，调用方会继续处理原始错误
                }
            }
            throw error;
        }
    }, []);

    // 初始化认证状态：只通过 HttpOnly Cookie 判断，不再读取任何 token。
    useEffect(() => {
        const generation = ++authGenerationRef.current;
        const initAuth = async () => {
            try {
                const userResponse = await AuthService.getUserInfo(undefined, { skipSessionInvalidation: true });
                if (generation !== authGenerationRef.current) {
                    return;
                }
                if (userResponse.errno === 0 && userResponse.data) {
                    setUser(normalizeUser(userResponse.data));
                } else {
                    setUser(null);
                }
            } catch (error: any) {
                if (generation === authGenerationRef.current) {
                    setUser(null);
                    if (error?.errno === 1101) {
                        clearLegacyAuthCookies();
                    }
                }
            } finally {
                if (generation === authGenerationRef.current) {
                    setLoading(false);
                }
            }
        };

        void initAuth();
        return () => {
            if (authGenerationRef.current === generation) {
                authGenerationRef.current++;
            }
        };
    }, []);

    // 会话失效（过期 / 被顶下线）→ 清除登录态并跳转登录页
    useEffect(() => {
        const handleSessionInvalidated = () => {
            authGenerationRef.current++;
            clearAuthStateAndLegacyCookies();
            setLoading(false);
            if (!window.location.pathname.startsWith("/auth")) {
                navigate("/auth");
            }
        };
        sessionEvents.addSessionInvalidatedListener(handleSessionInvalidated);
        return () => {
            sessionEvents.removeSessionInvalidatedListener(handleSessionInvalidated);
        };
    }, [clearAuthStateAndLegacyCookies, navigate]);

    // 计算是否已认证（必须在 WebSocket useEffect 之前声明）
    const isAuthenticated = Boolean(user);

    // WebSocket 连接管理 — 浏览器会自动携带同源 SESSIONID Cookie
    useEffect(() => {
        if (isAuthenticated && user) {
            notificationWS.connect(user.id);
            // 普通用户无私信权限，不建立聊天连接（后端同样拒绝，避免重连循环）
            if (canChat(user.role)) {
                chatWS.connect(user.id);
            } else {
                chatWS.disconnect();
            }
        } else {
            notificationWS.disconnect();
            chatWS.disconnect();
            setFaviconBadge(0); // 退出登录或未认证时清除 favicon 角标
        }
    }, [isAuthenticated, user]);

    // WebSocket 错误不负责刷新会话。HTTP 请求收到 1101 时仍由 Http.ts 统一处理。
    useEffect(() => {
        // 聊天 WS 失败（如无权限/账号异常）绝不影响登录态，仅停止重连避免循环。
        const unsubChatError = chatWS.onServerError(() => {
            chatWS.disconnect();
        });
        const unsubError = notificationWS.onServerError((err) => {
            // 账号状态异常（1103），直接按会话失效处理。
            if (err.errno === 1103) {
                sessionEvents.emitSessionInvalidated("expired");
                return;
            }
            // 1101 只代表该 WebSocket 会话被服务端拒绝，不能据此判定 HTTP 会话已失效。
            if (err.errno === 1101) {
                notificationWS.disconnect();
            }
        });
        return () => {
            unsubError();
            unsubChatError();
        };
    }, []);

    const login = async (authId: string, password: string): Promise<LoginResult> => {
        return loginWithRetry(authId, password, false);
    };

    const loginWithRetry = async (authId: string, password: string, retried: boolean): Promise<LoginResult> => {
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            disconnectWebSockets();
            setUser(null);
            resetNotificationState();
            setFaviconBadge(0);

            const response = await AuthService.login(authId, password);
            if (generation !== authGenerationRef.current) {
                return { requires2fa: false };
            }

            const data = response.data;
            if (data?.require_2fa && data.temp_token) {
                return { requires2fa: true, tempToken: data.temp_token };
            }

            await completeLogin(generation);
            return { requires2fa: false };
        } catch (error: any) {
            if (generation !== authGenerationRef.current) {
                return { requires2fa: false };
            }
            // 2010 USER_ALREADY_LOGIN：本设备已有登录态，先登出再重试一次登录
            if (!retried && error?.errno === 2010) {
                try {
                    await AuthService.logout();
                } catch {
                    // 登出失败不阻断重试
                }
                clearAuthStateAndLegacyCookies();
                return loginWithRetry(authId, password, true);
            }
            setLoginError(getErrorMessage(error, i18n.t("auth:message.loginFailed")));
            clearAuthStateAndLegacyCookies();
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    const verifyTwoFactor = async (tempToken: string, code: string) => {
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            await AuthService.verify2fa(tempToken, code);
            await completeLogin(generation);
        } catch (error: any) {
            if (generation === authGenerationRef.current) {
                setLoginError(getErrorMessage(error, i18n.t("auth:message.twoFactorFailed")));
                clearAuthStateAndLegacyCookies();
            }
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    const verifyTwoFactorRecovery = async (tempToken: string, recoveryCode: string) => {
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            await AuthService.verify2faRecovery(tempToken, recoveryCode);
            await completeLogin(generation);
        } catch (error: any) {
            if (generation === authGenerationRef.current) {
                setLoginError(getErrorMessage(error, i18n.t("auth:message.twoFactorFailed")));
                clearAuthStateAndLegacyCookies();
            }
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    const loginWithPasskey = async (authId?: string) => {
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            disconnectWebSockets();
            setUser(null);
            resetNotificationState();
            setFaviconBadge(0);
            await PasskeyService.login(authId);
            await completeLogin(generation);
        } catch (error: any) {
            if (generation === authGenerationRef.current) {
                setLoginError(getErrorMessage(error, i18n.t("auth:message.passkeyLoginFailed")));
                clearAuthStateAndLegacyCookies();
            }
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    const recoverWithEmail = async (email: string, authCode: string) => {
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            disconnectWebSockets();
            setUser(null);
            resetNotificationState();
            setFaviconBadge(0);
            await AuthService.recoverWithEmail(email, authCode);
            await completeLogin(generation);
        } catch (error: any) {
            if (generation === authGenerationRef.current) {
                setLoginError(getErrorMessage(error, i18n.t("auth:message.recoveryFailed")));
                clearAuthStateAndLegacyCookies();
            }
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    // 登出方法
    const logout = async () => {
        const generation = ++authGenerationRef.current;
        try {
            setLoading(true);
            await AuthService.logout();
            if (generation !== authGenerationRef.current) {
                return;
            }
            clearAuthStateAndLegacyCookies();
            setLoginError(null);
        } catch (error) {
            if (generation !== authGenerationRef.current) {
                return;
            }
            console.error("登出失败:", error);
            // 即使后端登出失败，也清除本地状态
            clearAuthStateAndLegacyCookies();
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    // 清除登录错误
    const clearLoginError = () => {
        setLoginError(null);
    };

    const value: AuthContextType = {
        user,
        login,
        verifyTwoFactor,
        verifyTwoFactorRecovery,
        loginWithPasskey,
        recoverWithEmail,
        logout,
        isAuthenticated,
        loading,
        loginError,
        clearLoginError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义hook：使用认证上下文
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth必须在AuthProvider内部使用");
    }
    return context;
};

export default AuthContext;

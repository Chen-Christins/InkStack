import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService.ts";
import { PasskeyService } from "../services/PasskeyService.ts";
import { sessionEvents } from "../auth/SessionEvents.ts";
import { sessionWS } from "../services/WsInstances.ts";
import { setFaviconBadge } from "../utils/Favicon.ts";
import { resetNotificationState } from "../utils/NotificationState.ts";
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
        sessionWS.disconnect();
    }, []);

    const clearAuthRuntimeState = useCallback(() => {
        disconnectWebSockets();
        setUser(null);
        resetNotificationState();
        setFaviconBadge(0);
    }, [disconnectWebSockets]);

    const clearAuthState = useCallback(() => {
        clearAuthRuntimeState();
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
            } catch {
                if (generation === authGenerationRef.current) {
                    setUser(null);
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
            clearAuthState();
            setLoading(false);
            if (!window.location.pathname.startsWith("/auth")) {
                navigate("/auth");
            }
        };
        sessionEvents.addSessionInvalidatedListener(handleSessionInvalidated);
        return () => {
            sessionEvents.removeSessionInvalidatedListener(handleSessionInvalidated);
        };
    }, [clearAuthState, navigate]);

    // 计算是否已认证（必须在 WebSocket useEffect 之前声明）
    const isAuthenticated = Boolean(user);

    // 统一会话 WebSocket 连接管理 — 浏览器会自动携带同源 SESSIONID Cookie
    // 普通用户同样建立连接（接收通知与在线人数），私信帧由后端拒绝。
    useEffect(() => {
        if (isAuthenticated && user) {
            sessionWS.connect(user.id);
        } else {
            sessionWS.disconnect();
            setFaviconBadge(0); // 退出登录或未认证时清除 favicon 角标
        }
    }, [isAuthenticated, user]);

    // 统一会话系统帧：顶号 / 会话失效 / 设备被踢
    useEffect(() => {
        // 同一设备的新连接顶掉当前连接：主动断开且不再重连，避免多标签页互相顶号形成重连循环。
        const unsubReplaced = sessionWS.onMessage("replaced", () => {
            sessionWS.disconnect();
        });
        const unsubExpired = sessionWS.onMessage("session_expired", () => {
            sessionEvents.emitSessionInvalidated("expired");
        });
        const unsubRevoked = sessionWS.onMessage("session_revoked", () => {
            sessionEvents.emitSessionInvalidated("expired");
        });
        const unsubKicked = sessionWS.onMessage("device_kicked", () => {
            sessionEvents.emitSessionInvalidated("kicked");
        });
        return () => {
            unsubReplaced();
            unsubExpired();
            unsubRevoked();
            unsubKicked();
        };
    }, []);

    // WebSocket 错误不负责刷新会话。HTTP 请求收到 1101 时仍由 Http.ts 统一处理。
    useEffect(() => {
        const unsubError = sessionWS.onServerError((err) => {
            // 聊天帧的权限/参数错误只影响该次操作，不影响登录态。
            if (err.channel === "chat") {
                return;
            }
            // 账号状态异常（1103），直接按会话失效处理。
            if (err.errno === 1103) {
                sessionEvents.emitSessionInvalidated("expired");
                return;
            }
            // 1101：连接身份已失效，停止重连并按会话失效处理，避免重连循环。
            if (err.errno === 1101) {
                sessionWS.disconnect();
                sessionEvents.emitSessionInvalidated("expired");
            }
        });
        return () => {
            unsubError();
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
                clearAuthState();
                return loginWithRetry(authId, password, true);
            }
            setLoginError(getErrorMessage(error, i18n.t("auth:message.loginFailed")));
            clearAuthState();
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
                clearAuthState();
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
                clearAuthState();
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
                clearAuthState();
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
                clearAuthState();
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
            clearAuthState();
            setLoginError(null);
        } catch (error) {
            if (generation !== authGenerationRef.current) {
                return;
            }
            console.error("登出失败:", error);
            // 即使后端登出失败，也清除本地状态
            clearAuthState();
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

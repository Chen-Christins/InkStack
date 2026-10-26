import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Eye, EyeOff, Mail, User, Lock, ArrowLeft, Check, AlertCircle, Fingerprint, KeyRound } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AuthPage.module.css"; // 导入 CSS Modules
import Button from "@/components/button/Button";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { AuthService } from "@/services/AuthService.ts";
import { PasskeyService } from "@/services/PasskeyService.ts";

// 定义表单类型
type FormType = "login" | "register" | "forgotPassword" | "recovery";

// 规整登录后回跳地址：仅允许站内相对路径，且不把登录页自身当作目标（避免 /auth?redirect=... 嵌套）
const resolveRedirect = (raw: string | null): string => {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
        return "/index";
    }
    if (raw === "/auth" || raw.startsWith("/auth?") || raw.startsWith("/auth/")) {
        return "/index";
    }
    return raw;
};

// GitHub 图标（lucide-react 已移除品牌图标，使用内联 SVG）
const GithubIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
);

// 表单验证规则
const validateForm = (type: FormType, formData: any, t: TFunction<"auth">) => {
    const errors: Record<string, string> = {};

    if (type === "login") {
        if (!formData.usernameOrEmail) {
            errors.usernameOrEmail = t("validation.usernameOrEmailRequired");
        }
        if (!formData.password) {
            errors.password = t("validation.passwordRequired");
        } else if (formData.password.length < 6) {
            errors.password = t("validation.passwordMin");
        }
    } else if (type === "register") {
        if (!formData.account) {
            errors.account = t("validation.accountRequired");
        } else if (!/^[A-Za-z]/.test(formData.account)) {
            errors.account = t("validation.accountStartLetter");
        } else if (formData.account.length < 5 || formData.account.length > 16) {
            errors.account = t("validation.accountLength");
        } else if (!/^[A-Za-z][0-9A-Za-z\-_\.]{4,15}$/.test(formData.account)) {
            errors.account = t("validation.accountCharset");
        }

        if (!formData.email) {
            errors.email = t("validation.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t("validation.emailInvalid");
        }

        if (!formData.auth_code) {
            errors.auth_code = t("validation.codeRequired");
        } else if (formData.auth_code.length < 4) {
            errors.auth_code = t("validation.codeMin");
        }

        if (!formData.password) {
            errors.password = t("validation.passwordRequired");
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = t("validation.confirmPasswordRequired");
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t("validation.passwordMismatch");
        }
    } else if (type === "forgotPassword") {
        if (!formData.email) {
            errors.email = t("validation.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t("validation.emailInvalid");
        }

        if (!formData.code) {
            errors.code = t("validation.codeRequired");
        } else if (formData.code.length < 4) {
            errors.code = t("validation.codeMin");
        }

        if (!formData.newPassword) {
            errors.newPassword = t("validation.newPasswordRequired");
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = t("validation.newPasswordMin");
        }

        if (!formData.confirmNewPassword) {
            errors.confirmNewPassword = t("validation.confirmNewPasswordRequired");
        } else if (formData.newPassword !== formData.confirmNewPassword) {
            errors.confirmNewPassword = t("validation.passwordMismatch");
        }
    } else if (type === "recovery") {
        if (!formData.email) {
            errors.email = t("validation.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t("validation.emailInvalid");
        }

        if (!formData.auth_code) {
            errors.auth_code = t("validation.codeRequired");
        } else if (formData.auth_code.length < 4) {
            errors.auth_code = t("validation.codeMin");
        }
    }

    return errors;
};

const AuthPage: React.FC = () => {
    // 获取认证状态
    const { login, verifyTwoFactor, verifyTwoFactorRecovery, loginWithPasskey, recoverWithEmail, isAuthenticated } = useAuth();
    const { settings } = useSiteSettings();
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const location = useLocation();
    const passkeySupported = PasskeyService.isSupported();

    // 状态管理
    const [formType, setFormType] = useState<FormType>("login");
    const [formData, setFormData] = useState({
        usernameOrEmail: "",
        account: "",
        email: "",
        auth_code: "",
        code: "", // 保留用于密码重置
        password: "",
        confirmPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [twoFactor, setTwoFactor] = useState<{ tempToken: string; useRecoveryCode: boolean } | null>(null);
    const [twoFactorInput, setTwoFactorInput] = useState("");
    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    // 当注册被禁用时强制切回登录
    useEffect(() => {
        if (!settings.enableRegistration && formType === "register") {
            setFormType("login");
        }
    }, [settings.enableRegistration, formType]);

    // 处理 GitHub 授权回调失败（后端重定向带回 oauth_error）
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (!params.has("oauth_error")) {
            return;
        }
        setMessage({ text: t("message.githubFailed"), type: "error" });
        params.delete("oauth_error");
        const query = params.toString();
        navigate(`${location.pathname}${query ? `?${query}` : ""}`, { replace: true });
    }, [location.pathname, location.search, navigate, t]);

    // GitHub 回调成功后后端已设置 SESSIONID，AuthContext 会恢复用户；落在 /auth 时补一次跳转。
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("oauth") !== "1" || !isAuthenticated) {
            return;
        }
        navigate(resolveRedirect(params.get("redirect")), { replace: true });
    }, [isAuthenticated, location.search, navigate]);

    const goAfterLogin = () => {
        const params = new URLSearchParams(location.search);
        const redirect = resolveRedirect(params.get("redirect"));
        navigate(redirect);
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // 清除对应字段的错误
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // 发送验证码
    const handleSendCode = async () => {
        const email = formData.email;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors((prev) => ({ ...prev, email: t("validation.emailInvalid") }));
            return;
        }

        // 清除邮箱错误
        if (errors.email) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
            });
        }

        try {
            setIsSubmitting(true);

            // 根据表单类型发送对应的验证码
            if (formType === "register") {
                await AuthService.sendRegisterCode(email);
            } else if (formType === "forgotPassword") {
                await AuthService.sendPasswordResetCode(email);
            } else if (formType === "recovery") {
                await AuthService.sendRecoveryCode(email);
            } else {
                throw new Error(t("message.unsupportedCodeType"));
            }

            setCountdown(60);
            setMessage({ text: t("message.codeSent"), type: "success" });
        } catch (error: any) {
            console.error("发送验证码失败:", error);
            setMessage({
                text: error.msg || error.message || t("message.codeSendFailed"),
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证表单
        const newErrors = validateForm(formType, formData, t);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            if (formType === "login") {
                const result = await login(formData.usernameOrEmail, formData.password);
                if (result.requires2fa) {
                    setTwoFactor({ tempToken: result.tempToken ?? "", useRecoveryCode: false });
                    setTwoFactorInput("");
                    return;
                }
                setMessage({ text: t("message.loginSuccess"), type: "success" });
                setTimeout(goAfterLogin, 200);
            } else if (formType === "register") {
                await AuthService.register({
                    account: formData.account,
                    email: formData.email,
                    passwd: formData.password, // AuthService 内部会进行 MD5 加密
                    auth_code: formData.auth_code,
                });
                setMessage({ text: t("message.registerSuccess"), type: "success" });
                setTimeout(() => setFormType("login"), 200);
            } else if (formType === "forgotPassword") {
                await AuthService.forgetPassword(formData.email, formData.newPassword, formData.code);
                setMessage({ text: t("message.resetSuccess"), type: "success" });
                setTimeout(() => setFormType("login"), 200);
            } else if (formType === "recovery") {
                await recoverWithEmail(formData.email, formData.auth_code);
                setMessage({ text: t("message.recoverySuccess"), type: "success" });
                setTimeout(goAfterLogin, 200);
            }
        } catch (error: any) {
            setMessage({
                text:
                    error.msg ||
                    error.message ||
                    (formType === "login"
                        ? t("message.loginFailed")
                        : formType === "register"
                          ? t("message.registerFailed")
                          : formType === "recovery"
                            ? t("message.recoveryFailed")
                            : t("message.resetFailed")),
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 跳转到 GitHub 授权页（整页跳转，由后端处理回调）
    const handleGithubLogin = () => {
        const params = new URLSearchParams(location.search);
        const redirect = resolveRedirect(params.get("redirect"));
        window.location.href = AuthService.githubLoginUrl(redirect);
    };

    const handlePasskeyLogin = async () => {
        setIsSubmitting(true);
        setMessage(null);
        try {
            await loginWithPasskey(formData.usernameOrEmail.trim() || undefined);
            setMessage({ text: t("message.loginSuccess"), type: "success" });
            setTimeout(goAfterLogin, 200);
        } catch (error: any) {
            setMessage({
                text:
                    error?.name === "NotAllowedError"
                        ? t("message.passkeyCancelled")
                        : error.msg || error.message || t("message.passkeyLoginFailed"),
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTwoFactorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!twoFactor) {
            return;
        }
        if (!twoFactorInput.trim()) {
            setMessage({
                text: twoFactor.useRecoveryCode ? t("validation.recoveryCodeRequired") : t("validation.twoFactorCodeRequired"),
                type: "error",
            });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        try {
            if (twoFactor.useRecoveryCode) {
                await verifyTwoFactorRecovery(twoFactor.tempToken, twoFactorInput.trim());
            } else {
                await verifyTwoFactor(twoFactor.tempToken, twoFactorInput.trim());
            }
            setMessage({ text: t("message.loginSuccess"), type: "success" });
            setTimeout(goAfterLogin, 200);
        } catch (error: any) {
            setMessage({
                text: error.msg || error.message || t("message.twoFactorFailed"),
                type: "error",
            });
            // 后端在第一次校验时会消费掉 temp_token，失败后必须重新走密码登录。
            setTwoFactor(null);
            setTwoFactorInput("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const backToPasswordLogin = () => {
        setTwoFactor(null);
        setTwoFactorInput("");
        setMessage(null);
    };

    // 切换表单视图
    const switchForm = (type: FormType) => {
        setFormType(type);
        setErrors({});
        setMessage(null);
        setTwoFactor(null);
        setTwoFactorInput("");
        // 重置相关表单字段
        setFormData((prev) => ({
            ...prev,
            auth_code: "",
            code: "",
            password: "",
            confirmPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        }));
        setCountdown(0);
    };

    // 渲染表单标题
    const renderTitle = () => {
        switch (formType) {
            case "login":
                return t("title.login");
            case "register":
                return t("title.register");
            case "forgotPassword":
                return t("title.forgotPassword");
            case "recovery":
                return t("title.recovery");
            default:
                return "";
        }
    };

    // 渲染表单描述
    const renderDescription = () => {
        switch (formType) {
            case "login":
                return t("description.login");
            case "register":
                return t("description.register");
            case "forgotPassword":
                return t("description.forgotPassword");
            case "recovery":
                return t("description.recovery");
            default:
                return "";
        }
    };

    if (twoFactor) {
        return (
            <div className={styles.authPage}>
                <div className={styles.mainContent}>
                    <div className={styles.authCard}>
                        <div className={styles.topBar}></div>
                        <div className={styles.content}>
                            <button onClick={backToPasswordLogin} className={styles.backButton}>
                                <ArrowLeft size={18} />
                                <span>{t("backToLogin")}</span>
                            </button>

                            <div>
                                <h2 className={styles.title}>{t("title.twoFactor")}</h2>
                                <p className={styles.description}>{t("description.twoFactor")}</p>
                            </div>

                            {message && (
                                <div
                                    className={`${styles.message} ${message.type === "success" ? styles.messageSuccess : styles.messageError}`}
                                >
                                    {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleTwoFactorSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="twoFactorCode" className={styles.label}>
                                        {twoFactor.useRecoveryCode ? t("fields.recoveryCode") : t("fields.twoFactorCode")}
                                    </label>
                                    <div className={styles.formControl}>
                                        <KeyRound size={18} className={styles.icon} />
                                        <input
                                            type="text"
                                            id="twoFactorCode"
                                            name="twoFactorCode"
                                            value={twoFactorInput}
                                            onChange={(event) => setTwoFactorInput(event.target.value)}
                                            className={styles.input}
                                            placeholder={
                                                twoFactor.useRecoveryCode
                                                    ? t("placeholders.recoveryCode")
                                                    : t("placeholders.twoFactorCode")
                                            }
                                            autoComplete="one-time-code"
                                            autoFocus
                                        />
                                    </div>
                                    <p className={styles.hintText}>
                                        {twoFactor.useRecoveryCode ? t("hints.recoveryCode") : t("hints.twoFactorCode")}
                                    </p>
                                </div>

                                <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.primaryBtn}`}>
                                    {isSubmitting ? t("submit.verifying") : t("submit.verify")}
                                </button>

                                <div className={styles.formSwitch}>
                                    <button
                                        type="button"
                                        className={`${styles.btn} ${styles.textBtn}`}
                                        onClick={() => {
                                            setTwoFactor({ ...twoFactor, useRecoveryCode: !twoFactor.useRecoveryCode });
                                            setTwoFactorInput("");
                                            setMessage(null);
                                        }}
                                    >
                                        {twoFactor.useRecoveryCode ? t("links.useTotpCode") : t("links.useRecoveryCode")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <Footer startYear={2025} />
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.mainContent}>
                <div className={styles.authCard}>
                    {/* 顶部装饰条 */}
                    <div className={styles.topBar}></div>

                    {/* 表单内容 */}
                    <div className={styles.content}>
                        {/* 返回按钮（除了登录页） */}
                        {formType !== "login" && (
                            <button onClick={() => switchForm("login")} className={styles.backButton}>
                                <ArrowLeft size={18} />
                                <span>{t("backToLogin")}</span>
                            </button>
                        )}

                        {/* 标题和描述 */}
                        <div>
                            <h2 className={styles.title}>{renderTitle()}</h2>
                            <p className={styles.description}>{renderDescription()}</p>
                        </div>

                        {/* 消息提示 */}
                        {message && (
                            <div
                                className={`${styles.message} ${message.type === "success" ? styles.messageSuccess : styles.messageError}`}
                            >
                                {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* 登录表单字段 */}
                            {formType === "login" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="usernameOrEmail" className={styles.label}>
                                            {t("fields.usernameOrEmail")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="usernameOrEmail"
                                                name="usernameOrEmail"
                                                value={formData.usernameOrEmail}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.usernameOrEmail ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.usernameOrEmail")}
                                            />
                                        </div>
                                        {errors.usernameOrEmail && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.usernameOrEmail}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="password" className={styles.label}>
                                            {t("fields.password")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.password")}
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="outline"
                                        className={styles.githubBtn}
                                        onClick={handlePasskeyLogin}
                                        disabled={!passkeySupported || isSubmitting}
                                        title={!passkeySupported ? t("message.passkeyUnsupported") : undefined}
                                    >
                                        <Fingerprint size={18} />
                                        <span>{t("passkeyLogin")}</span>
                                    </Button>
                                    {!passkeySupported && <p className={styles.hintText}>{t("message.passkeyUnsupported")}</p>}
                                </>
                            )}

                            {/* 注册表单字段 */}
                            {formType === "register" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="account" className={styles.label}>
                                            {t("fields.account")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="account"
                                                name="account"
                                                value={formData.account}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.account ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.account")}
                                            />
                                        </div>
                                        {errors.account && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.account}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="email" className={styles.label}>
                                            {t("fields.email")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.email")}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="auth_code" className={styles.label}>
                                            {t("fields.code")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="auth_code"
                                                name="auth_code"
                                                value={formData.auth_code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.auth_code ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.code")}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? t("sendCode.resend", { seconds: countdown }) : t("sendCode.send")}
                                            </button>
                                        </div>
                                        {errors.auth_code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.auth_code}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="password" className={styles.label}>
                                            {t("fields.password")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.password")}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="confirmPassword" className={styles.label}>
                                            {t("fields.confirmPassword")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.confirmPassword")}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 忘记密码表单字段 */}
                            {formType === "forgotPassword" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="email" className={styles.label}>
                                            {t("fields.email")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.email")}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="code" className={styles.label}>
                                            {t("fields.code")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="code"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.code ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.code")}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? t("sendCode.resend", { seconds: countdown }) : t("sendCode.send")}
                                            </button>
                                        </div>
                                        {errors.code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="newPassword" className={styles.label}>
                                            {t("fields.newPassword")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.newPassword ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.newPassword")}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.newPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="confirmNewPassword" className={styles.label}>
                                            {t("fields.confirmNewPassword")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showConfirmNewPassword ? "text" : "password"}
                                                id="confirmNewPassword"
                                                name="confirmNewPassword"
                                                value={formData.confirmNewPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.confirmNewPassword ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.confirmNewPassword")}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmNewPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.confirmNewPassword}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 邮箱恢复登录字段 */}
                            {formType === "recovery" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="recoveryEmail" className={styles.label}>
                                            {t("fields.email")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="email"
                                                id="recoveryEmail"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.email")}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="recoveryCode" className={styles.label}>
                                            {t("fields.code")}
                                        </label>
                                        <div className={styles.formControl}>
                                            <KeyRound size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="recoveryCode"
                                                name="auth_code"
                                                value={formData.auth_code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.auth_code ? styles.inputError : ""}`}
                                                placeholder={t("placeholders.code")}
                                                autoComplete="one-time-code"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? t("sendCode.resend", { seconds: countdown }) : t("sendCode.send")}
                                            </button>
                                        </div>
                                        {errors.auth_code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.auth_code}
                                            </p>
                                        )}
                                        <p className={styles.hintText}>{t("hints.recoveryWarning")}</p>
                                    </div>
                                </>
                            )}

                            {/* 提交按钮 */}
                            <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.primaryBtn}`}>
                                {isSubmitting ? (
                                    <div className={styles.btnLoading}>
                                        <div className={styles.loadingSpinner}></div>
                                        <span>
                                            {formType === "login"
                                                ? t("submit.loggingIn")
                                                : formType === "register"
                                                  ? t("submit.registering")
                                                  : formType === "recovery"
                                                    ? t("submit.recovering")
                                                    : t("submit.resetting")}
                                        </span>
                                    </div>
                                ) : formType === "login" ? (
                                    t("submit.login")
                                ) : formType === "register" ? (
                                    t("submit.register")
                                ) : formType === "recovery" ? (
                                    t("submit.recovery")
                                ) : (
                                    t("submit.resetPassword")
                                )}
                            </button>

                            {/* GitHub 第三方登录 */}
                            {formType === "login" && (
                                <>
                                    <div className={styles.divider}>
                                        <span>{t("or")}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="outline"
                                        className={styles.githubBtn}
                                        onClick={handleGithubLogin}
                                    >
                                        <GithubIcon size={18} />
                                        <span>{t("githubLogin")}</span>
                                    </Button>
                                </>
                            )}

                            {/* 表单切换链接 */}
                            <div className={styles.formSwitch}>
                                {formType === "login" ? (
                                    <div className={styles.formSwitchRow}>
                                        <span className={styles.formSwitchItem}>
                                            {t("links.forgotPrompt")}
                                            <button
                                                type="button"
                                                onClick={() => switchForm("forgotPassword")}
                                                className={`${styles.btn} ${styles.textBtn}`}
                                            >
                                                {t("links.resetLink")}
                                            </button>
                                        </span>
                                        {settings.enableRegistration && (
                                            <>
                                                <div className={styles.formSwitchDivider}></div>
                                                <span className={styles.formSwitchItem}>
                                                    {t("links.noAccount")}
                                                    <button
                                                        type="button"
                                                        onClick={() => switchForm("register")}
                                                        className={`${styles.btn} ${styles.textBtn}`}
                                                    >
                                                        {t("links.registerNow")}
                                                    </button>
                                                </span>
                                            </>
                                        )}
                                        <div className={styles.formSwitchDivider}></div>
                                        <span className={styles.formSwitchItem}>
                                            {t("links.recoveryPrompt")}
                                            <button
                                                type="button"
                                                onClick={() => switchForm("recovery")}
                                                className={`${styles.btn} ${styles.textBtn}`}
                                            >
                                                {t("links.emailRecovery")}
                                            </button>
                                        </span>
                                    </div>
                                ) : formType === "register" ? (
                                    <div>
                                        {t("links.haveAccount")}
                                        <button
                                            type="button"
                                            onClick={() => switchForm("login")}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            {t("links.loginNow")}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {t("links.rememberPassword")}
                                        <button
                                            type="button"
                                            onClick={() => switchForm("login")}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            {t("links.loginNow")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer startYear={2025} />
        </div>
    );
};

export default AuthPage;

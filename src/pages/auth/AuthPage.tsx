import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, User, Lock, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AuthPage.module.css"; // 导入 CSS Modules
import Button from "@/components/button/Button";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { AuthService } from "@/services/AuthService.ts";

// 定义表单类型
type FormType = "login" | "register" | "forgotPassword";

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
const validateForm = (type: FormType, formData: any) => {
    const errors: Record<string, string> = {};

    if (type === "login") {
        if (!formData.usernameOrEmail) {
            errors.usernameOrEmail = "请输入用户名或邮箱";
        }
        if (!formData.password) {
            errors.password = "请输入密码";
        } else if (formData.password.length < 6) {
            errors.password = "密码长度至少6位";
        }
    } else if (type === "register") {
        if (!formData.account) {
            errors.account = "请输入用户名";
        } else if (!/^[A-Za-z]/.test(formData.account)) {
            errors.account = "用户名必须以字母开头";
        } else if (formData.account.length < 5 || formData.account.length > 16) {
            errors.account = "用户名长度为 5~16 个字符";
        } else if (!/^[A-Za-z][0-9A-Za-z\-_\.]{4,15}$/.test(formData.account)) {
            errors.account = "用户名只能包含字母、数字、-、_、.";
        }

        if (!formData.email) {
            errors.email = "请输入邮箱";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "请输入有效的邮箱地址";
        }

        if (!formData.auth_code) {
            errors.auth_code = "请输入验证码";
        } else if (formData.auth_code.length < 4) {
            errors.auth_code = "验证码长度至少4位";
        }

        if (!formData.password) {
            errors.password = "请输入密码";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "请确认密码";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "两次密码输入不一致";
        }
    } else if (type === "forgotPassword") {
        if (!formData.email) {
            errors.email = "请输入邮箱";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "请输入有效的邮箱地址";
        }

        if (!formData.code) {
            errors.code = "请输入验证码";
        } else if (formData.code.length < 4) {
            errors.code = "验证码长度至少4位";
        }

        if (!formData.newPassword) {
            errors.newPassword = "请输入新密码";
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = "密码长度至少6位";
        }

        if (!formData.confirmNewPassword) {
            errors.confirmNewPassword = "请确认新密码";
        } else if (formData.newPassword !== formData.confirmNewPassword) {
            errors.confirmNewPassword = "两次密码输入不一致";
        }
    }

    return errors;
};

const AuthPage: React.FC = () => {
    // 获取认证状态
    const { login } = useAuth();
    const { settings } = useSiteSettings();
    const navigate = useNavigate();
    const location = useLocation();

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
        setMessage({ text: "GitHub 登录失败或已取消，请重试", type: "error" });
        params.delete("oauth_error");
        const query = params.toString();
        navigate(`${location.pathname}${query ? `?${query}` : ""}`, { replace: true });
    }, [location.pathname, location.search, navigate]);

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
            setErrors((prev) => ({ ...prev, email: "请输入有效的邮箱地址" }));
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
            } else {
                throw new Error("不支持的验证码类型");
            }

            setCountdown(60);
            setMessage({ text: "验证码已发送，请注意查收", type: "success" });
        } catch (error: any) {
            console.error("发送验证码失败:", error);
            setMessage({
                text: error.msg || error.message || "验证码发送失败",
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
        const newErrors = validateForm(formType, formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            if (formType === "login") {
                await login(formData.usernameOrEmail, formData.password);
                setMessage({ text: "登录成功，正在跳转...", type: "success" });
                const params = new URLSearchParams(location.search);
                const redirect = resolveRedirect(params.get("redirect"));
                setTimeout(() => {
                    navigate(redirect);
                }, 200);
            } else if (formType === "register") {
                await AuthService.register({
                    account: formData.account,
                    email: formData.email,
                    passwd: formData.password, // AuthService 内部会进行 MD5 加密
                    auth_code: formData.auth_code,
                });
                setMessage({ text: "注册成功，请登录", type: "success" });
                setTimeout(() => setFormType("login"), 200);
            } else if (formType === "forgotPassword") {
                await AuthService.forgetPassword(formData.email, formData.newPassword, formData.code);
                setMessage({ text: "密码重置成功，请登录", type: "success" });
                setTimeout(() => setFormType("login"), 200);
            }
        } catch (error: any) {
            setMessage({
                text:
                    error.msg ||
                    error.message ||
                    `${formType === "login" ? "登录" : formType === "register" ? "注册" : "重置密码"}失败`,
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

    // 切换表单视图
    const switchForm = (type: FormType) => {
        setFormType(type);
        setErrors({});
        setMessage(null);
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
                return "欢迎回来";
            case "register":
                return "创建账号";
            case "forgotPassword":
                return "重置密码";
            default:
                return "";
        }
    };

    // 渲染表单描述
    const renderDescription = () => {
        switch (formType) {
            case "login":
                return "请输入您的账号信息登录";
            case "register":
                return "创建新账号，开始您的旅程";
            case "forgotPassword":
                return "输入您的邮箱，我们将发送验证码重置密码";
            default:
                return "";
        }
    };

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
                                <span>返回登录</span>
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
                                            用户名或邮箱
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
                                                placeholder="请输入用户名或邮箱"
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
                                            密码
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
                                                placeholder="请输入密码"
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
                                </>
                            )}

                            {/* 注册表单字段 */}
                            {formType === "register" && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="account" className={styles.label}>
                                            用户名
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
                                                placeholder="字母开头，5~16位，可含字母、数字、-、_、."
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
                                            邮箱
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
                                                placeholder="请输入邮箱"
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
                                            验证码
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
                                                placeholder="请输入验证码"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? `${countdown}s后重发` : "获取验证码"}
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
                                            密码
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
                                                placeholder="请输入密码"
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
                                            确认密码
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
                                                placeholder="请确认密码"
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
                                            邮箱
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
                                                placeholder="请输入邮箱"
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
                                            验证码
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
                                                placeholder="请输入验证码"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? `${countdown}s后重发` : "获取验证码"}
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
                                            新密码
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
                                                placeholder="请输入新密码"
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
                                            确认新密码
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
                                                placeholder="请确认新密码"
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

                            {/* 提交按钮 */}
                            <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.primaryBtn}`}>
                                {isSubmitting ? (
                                    <div className={styles.btnLoading}>
                                        <div className={styles.loadingSpinner}></div>
                                        <span>
                                            {formType === "login" ? "登录中..." : formType === "register" ? "注册中..." : "重置中..."}
                                        </span>
                                    </div>
                                ) : formType === "login" ? (
                                    "登录"
                                ) : formType === "register" ? (
                                    "注册"
                                ) : (
                                    "重置密码"
                                )}
                            </button>

                            {/* GitHub 第三方登录 */}
                            {formType === "login" && (
                                <>
                                    <div className={styles.divider}>
                                        <span>或</span>
                                    </div>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="outline"
                                        className={styles.githubBtn}
                                        onClick={handleGithubLogin}
                                    >
                                        <GithubIcon size={18} />
                                        <span>使用 GitHub 登录</span>
                                    </Button>
                                </>
                            )}

                            {/* 表单切换链接 */}
                            <div className={styles.formSwitch}>
                                {formType === "login" ? (
                                    <div className={styles.formSwitchRow}>
                                        <span className={styles.formSwitchItem}>
                                            忘记密码？
                                            <button
                                                type="button"
                                                onClick={() => switchForm("forgotPassword")}
                                                className={`${styles.btn} ${styles.textBtn}`}
                                            >
                                                点击重置
                                            </button>
                                        </span>
                                        {settings.enableRegistration && (
                                            <>
                                                <div className={styles.formSwitchDivider}></div>
                                                <span className={styles.formSwitchItem}>
                                                    还没有账号？
                                                    <button
                                                        type="button"
                                                        onClick={() => switchForm("register")}
                                                        className={`${styles.btn} ${styles.textBtn}`}
                                                    >
                                                        立即注册
                                                    </button>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ) : formType === "register" ? (
                                    <div>
                                        已有账号？
                                        <button
                                            type="button"
                                            onClick={() => switchForm("login")}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            立即登录
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        想起密码了？
                                        <button
                                            type="button"
                                            onClick={() => switchForm("login")}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            立即登录
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

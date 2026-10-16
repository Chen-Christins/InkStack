import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { FaLock, FaSignInAlt, FaArrowLeft } from "react-icons/fa";
import Loading from "../loading/Loading";
import styles from "./AuthRequired.module.css";

interface AuthRequiredProps {
    children: React.ReactNode;
    message?: string;
    title?: string;
    buttonText?: string;
    showBackButton?: boolean;
    backUrl?: string;
    /** 作为布局的直接子级时，撑满可用高度（供胶囊布局锁定视口） */
    fill?: boolean;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({
    children,
    message,
    title,
    buttonText,
    showBackButton = true,
    backUrl,
    fill = false,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation("auth");
    const { isAuthenticated, loading: authLoading } = useAuth();
    const wrapperClass = `${styles.wrapper} ${fill ? styles.fill : ""}`;
    const resolvedMessage = message ?? t("requiredMessage");
    const resolvedTitle = title ?? t("signInPrompt");
    const resolvedButtonText = buttonText ?? t("loginNow");

    // 认证状态加载中
    if (authLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loading size="medium" text={t("verifying")} />
            </div>
        );
    }

    // 已认证 — 透传子内容
    if (isAuthenticated) {
        return <div className={wrapperClass}>{children}</div>;
    }

    // 未认证 — 显示登录引导
    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={wrapperClass}>
            <div className={styles.emptyState}>
                <div className={styles.iconCircle}>
                    <FaLock />
                </div>
                <h2 className={styles.title}>{resolvedTitle}</h2>
                <p className={styles.subtext}>{resolvedMessage}</p>
                <div className={styles.actions}>
                    <button
                        onClick={() =>
                            navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search))
                        }
                        className={styles.loginBtn}
                    >
                        <FaSignInAlt />
                        {resolvedButtonText}
                    </button>
                    {showBackButton && (
                        <button onClick={handleBack} className={styles.backBtn}>
                            <FaArrowLeft style={{ marginRight: 6 }} />
                            {t("back")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthRequired;

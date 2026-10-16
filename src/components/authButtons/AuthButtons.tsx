import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSignInAlt } from "react-icons/fa";
import styles from "./AuthButtons.module.css";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface AuthButtonsProps {
    onButtonClick?: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onButtonClick }) => {
    const { settings } = useSiteSettings();
    const { t } = useTranslation("auth");

    return (
        <div className={styles.authButtons}>
            <Link to="/auth" className={`${styles.authButton} ${styles.loginButton}`} onClick={onButtonClick}>
                <FaSignInAlt className={styles.buttonIcon} />
                <span className={styles.buttonText}>{settings.enableRegistration ? t("loginRegister") : t("login")}</span>
            </Link>
        </div>
    );
};

export default AuthButtons;

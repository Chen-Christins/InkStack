import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export interface FooterLink {
    text: string;
    url: string;
}

export interface SocialLink {
    icon: React.ReactNode;
    url: string;
    label: string;
}

export interface FooterProps {
    /**
     * 公司或组织名称
     */
    companyName?: string;
    /**
     * 作者名称
     */
    authorName?: string;
    /**
     * 起始年份
     */
    startYear?: number;
    /**
     * 自定义版权文本
     */
    copyrightText?: string;
    /**
     * 底部链接
     */
    links?: FooterLink[];
    /**
     * 社交媒体链接
     */
    socialLinks?: SocialLink[];
    /**
     * 底部额外文本
     */
    bottomText?: string;
    /**
     * 自定义类名
     */
    className?: string;
}

const Footer: React.FC<FooterProps> = ({
    companyName: companyNameProp,
    //   authorName = 'Author',
    startYear = new Date().getFullYear(),
    copyrightText,
    className = "",
}) => {
    const { settings } = useSiteSettings();
    const { t } = useTranslation("common");
    const companyName = companyNameProp || settings.siteName || "Blog";
    const currentYear = new Date().getFullYear();
    const yearText = startYear === currentYear ? currentYear.toString() : `${startYear}-${currentYear}`;

    return (
        <footer className={`${styles.footer} ${className}`}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.copyright}>
                        {copyrightText || (
                            <>
                                © {yearText}{" "}
                                <Link to="/" className={styles.companyLink}>
                                    {companyName}
                                </Link>{" "}
                                {t("footer.rights")}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

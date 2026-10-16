import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncResource } from "@/hooks/UseAsyncResource";
import { useNavigate } from "react-router-dom";
import {
    FaQuestionCircle,
    FaSearch,
    FaChevronDown,
    FaBook,
    FaRocket,
    FaShieldAlt,
    FaUsers,
    FaCode,
    FaPaperPlane,
    FaInbox,
    FaLock,
    FaSignInAlt,
    FaArrowLeft,
} from "react-icons/fa";
import styles from "./UserPage.module.css";
import helpStyles from "./HelpCenter.module.css";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import CustomSelect from "@/components/customSelect/CustomSelect";
import message from "@/components/message/Message";
import Loading from "@/components/loading/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useLayoutMode } from "@/contexts/LayoutModeContext";
import type { SelectOption } from "../../types";
import { HelpService, type HelpFaq } from "../../services/HelpService.ts";

const HelpCenter: React.FC = () => {
    const { t } = useTranslation("user");
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { mode } = useLayoutMode();

    const categories = [
        { id: "入门", name: t("helpCenter.categories.gettingStarted"), icon: <FaRocket />, color: "#3b82f6" },
        { id: "账户安全", name: t("helpCenter.categories.accountSecurity"), icon: <FaShieldAlt />, color: "#ef4444" },
        { id: "组织协作", name: t("helpCenter.categories.organization"), icon: <FaUsers />, color: "#22c55e" },
        { id: "研发平台", name: t("helpCenter.categories.devPlatform"), icon: <FaCode />, color: "#a855f7" },
    ];

    const feedbackTypes: SelectOption[] = [
        { id: "bug", name: t("helpCenter.feedback.types.bug"), color: "#ef4444" },
        { id: "feature", name: t("helpCenter.feedback.types.feature"), color: "#3b82f6" },
        { id: "other", name: t("helpCenter.feedback.types.other"), color: "#6c757d" },
    ];

    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);
    const [fbType, setFbType] = useState("bug");
    const [fbContent, setFbContent] = useState("");
    const [fbContact, setFbContact] = useState("");
    const [fbSubmitting, setFbSubmitting] = useState(false);

    const { data: faqs = [], loading: faqLoading } = useAsyncResource<HelpFaq[]>(async () => {
        try {
            const res = await HelpService.getFaqs();
            return res.data || [];
        } catch (err) {
            message.error(t("helpCenter.messages.loadFaqFailed"));
            throw err;
        }
    }, []);

    useEffect(() => {
        if (faqs.length > 0) {
            setOpenId((prev) => prev ?? faqs[0].id);
        }
    }, [faqs]);

    const filtered = useMemo(() => (search ? faqs.filter((f) => f.q.includes(search) || f.a.includes(search)) : faqs), [search, faqs]);

    const submitFeedback = async () => {
        if (!fbContent.trim()) {
            message.warn(t("helpCenter.messages.contentRequired"));
            return;
        }
        setFbSubmitting(true);
        try {
            const res = await HelpService.submitFeedback({
                type: fbType as "bug" | "feature" | "other",
                content: fbContent.trim(),
                contact: fbContact.trim() || undefined,
            });
            if (res.errno === 0) {
                message.success(t("helpCenter.feedback.success"));
                setFbContent("");
                setFbContact("");
            } else {
                message.error(res.msg || t("helpCenter.messages.submitFailed"));
            }
        } catch {
            message.error(t("helpCenter.messages.networkFailed"));
        } finally {
            setFbSubmitting(false);
        }
    };

    const renderContent = () => {
        if (authLoading) {
            return <Loading size="medium" text={t("helpCenter.auth.loading")} />;
        }
        if (!isAuthenticated) {
            return (
                <div className={styles.container}>
                    <div className={helpStyles.authGate}>
                        <div className={helpStyles.authIconCircle}>
                            <FaLock />
                        </div>
                        <h2 className={helpStyles.authTitle}>{t("helpCenter.auth.title")}</h2>
                        <p className={helpStyles.authSubtext}>{t("helpCenter.auth.subtext")}</p>
                        <div className={helpStyles.authActions}>
                            <button
                                onClick={() => navigate("/auth?redirect=" + encodeURIComponent("/help"))}
                                className={helpStyles.authBtn}
                            >
                                <FaSignInAlt />
                                {t("helpCenter.auth.login")}
                            </button>
                            <button onClick={() => navigate(-1)} className={helpStyles.authBackBtn}>
                                <FaArrowLeft />
                                {t("helpCenter.auth.back")}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className={styles.container}>
                <div className={helpStyles.hero}>
                    <FaQuestionCircle className={helpStyles.heroIcon} />
                    <h1 className={helpStyles.heroTitle}>{t("helpCenter.title")}</h1>
                    <p className={helpStyles.heroDesc}>{t("helpCenter.desc")}</p>
                    <div className={helpStyles.heroSearch}>
                        <Input
                            placeholder={t("helpCenter.searchPlaceholder")}
                            value={search}
                            onChange={setSearch}
                            prefix={<FaSearch />}
                            allowClear
                            size="large"
                        />
                    </div>
                </div>

                <div className={helpStyles.catRow}>
                    {categories.map((c) => {
                        const count = faqs.filter((f) => f.cat === c.id).length;
                        return (
                            <div key={c.id} className={helpStyles.catCard} onClick={() => setSearch("")}>
                                <div className={helpStyles.catIcon} style={{ color: c.color, background: `${c.color}1a` }}>
                                    {c.icon}
                                </div>
                                <div className={helpStyles.catName}>{c.name}</div>
                                <div className={helpStyles.catCount}>{t("helpCenter.categoryCount", { value: count })}</div>
                            </div>
                        );
                    })}
                </div>

                <div className={helpStyles.layout}>
                    <div className={`${styles.card} ${helpStyles.faqCard}`} style={{ marginBottom: 0 }}>
                        <h2 className={styles.cardTitle}>
                            <FaBook /> {t("helpCenter.faq.title")}
                        </h2>
                        <div className={helpStyles.faqList}>
                            {filtered.map((f) => (
                                <div key={f.id} className={helpStyles.faqItem}>
                                    <button className={helpStyles.faqQ} onClick={() => setOpenId((id) => (id === f.id ? null : f.id))}>
                                        <span>{f.q}</span>
                                        <FaChevronDown
                                            className={`${helpStyles.faqChevron} ${openId === f.id ? helpStyles.faqOpen : ""}`}
                                        />
                                    </button>
                                    {openId === f.id && <div className={helpStyles.faqA}>{f.a}</div>}
                                </div>
                            ))}
                            {faqLoading && (
                                <div className={helpStyles.faqEmpty}>
                                    <FaQuestionCircle className={helpStyles.faqEmptyIcon} />
                                    <span>{t("helpCenter.faq.loading")}</span>
                                </div>
                            )}
                            {!faqLoading && filtered.length === 0 && (
                                <div className={helpStyles.faqEmpty}>
                                    <FaInbox className={helpStyles.faqEmptyIcon} />
                                    <span>{search ? t("helpCenter.faq.notFound") : t("helpCenter.faq.empty")}</span>
                                    {search && <p className={helpStyles.faqEmptyHint}>{t("helpCenter.faq.emptyHint")}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.card} style={{ marginBottom: 0 }}>
                        <h2 className={styles.cardTitle}>
                            <FaPaperPlane /> {t("helpCenter.feedback.title")}
                        </h2>
                        <p className={styles.cardDesc}>{t("helpCenter.feedback.desc")}</p>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>{t("helpCenter.feedback.type")}</label>
                            <CustomSelect
                                name={t("helpCenter.feedback.type")}
                                options={feedbackTypes}
                                value={feedbackTypes.find((o) => o.id === fbType) || null}
                                onChange={(o) => setFbType((o?.id as string) || "bug")}
                                hideBadge
                            />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>{t("helpCenter.feedback.content")}</label>
                            <textarea
                                className={helpStyles.textarea}
                                placeholder={t("helpCenter.feedback.contentPlaceholder")}
                                value={fbContent}
                                onChange={(e) => setFbContent(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <label className={styles.formLabel}>{t("helpCenter.feedback.contact")}</label>
                            <Input
                                placeholder={t("helpCenter.feedback.contactPlaceholder")}
                                value={fbContact}
                                onChange={setFbContact}
                                size="large"
                            />
                        </div>
                        <Button color="primary" onClick={submitFeedback} loading={fbSubmitting}>
                            <FaPaperPlane style={{ marginRight: 6 }} /> {t("helpCenter.feedback.submit")}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // 经典布局：沿用旧版容器，无外层卡片
    if (mode === "classic") {
        return <div className={styles.page}>{renderContent()}</div>;
    }

    return <div className={helpStyles.pageCard}>{renderContent()}</div>;
};

export default HelpCenter;

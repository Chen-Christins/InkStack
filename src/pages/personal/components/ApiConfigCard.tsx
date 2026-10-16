import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaRobot, FaKey, FaGlobe, FaCogs } from "react-icons/fa";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import type { SelectOption } from "@/types";
import { message } from "@/components/message/Message";
import { AuthService } from "@/services/AuthService.ts";
import styles from "../PersonalCenter.module.css";

type ApiType = "openai" | "claude" | "glm";

const DEFAULTS: Record<ApiType, { url: string; keyPlaceholder: string; defaultModel: string }> = {
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        keyPlaceholder: "sk-...",
        defaultModel: "gpt-4o",
    },
    claude: {
        url: "https://api.anthropic.com/v1/messages",
        keyPlaceholder: "sk-ant-...",
        defaultModel: "claude-sonnet-4-6",
    },
    glm: {
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        keyPlaceholder: "xxx.xxxxxxxxxxxxxxxx",
        defaultModel: "glm-4.7-flash",
    },
};

const ApiConfigCard: React.FC = () => {
    const { t } = useTranslation("personal");
    const [apiType, setApiType] = useState<ApiType>("openai");
    const [url, setUrl] = useState(DEFAULTS.openai.url);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("");
    const [maxTokens, setMaxTokens] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const maskedKeyRef = useRef("");
    const keyTouchedRef = useRef(false);
    // 保存从后端加载的原始配置，切类型时恢复
    const savedConfigRef = useRef<{ type: ApiType; url: string; api_key: string; model: string; max_tokens: string } | null>(null);

    const current = DEFAULTS[apiType];

    const protocolOptions: SelectOption[] = [
        { id: "openai", name: t("apiConfig.protocol.openai"), color: "#10a37f" },
        { id: "claude", name: t("apiConfig.protocol.claude"), color: "#d97706" },
        { id: "glm", name: t("apiConfig.protocol.glm"), color: "#4a6cf7" },
    ];

    const applyConfig = (config: { type: ApiType; url: string; api_key: string; model: string; max_tokens: string }) => {
        setApiType(config.type);
        setUrl(config.url);
        setApiKey(config.api_key);
        maskedKeyRef.current = config.api_key;
        setModel(config.model);
        setMaxTokens(config.max_tokens);
    };

    useEffect(() => {
        AuthService.getAiConfig()
            .then((config) => {
                if (config) {
                    const type: ApiType = config.type === "claude" || config.type === "glm" ? config.type : "openai";
                    const saved = {
                        type,
                        url: config.url || DEFAULTS[type].url,
                        api_key: config.api_key || "",
                        model: config.model || "",
                        max_tokens: config.max_tokens ? String(config.max_tokens) : "",
                    };
                    savedConfigRef.current = saved;
                    applyConfig(saved);
                }
            })
            .catch((err) => {
                console.error("加载 AI 配置失败:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleTypeChange = (type: ApiType) => {
        const prevDefault = DEFAULTS[apiType].url;
        setApiType(type);
        // 如果 URL 还是旧协议的默认地址，自动切到新协议默认地址
        if (url === prevDefault || url.trim() === "") {
            setUrl(DEFAULTS[type].url);
        }
        // key / model / max_tokens 保持不变，因为用户只有一个配置
    };

    const handleSave = async () => {
        if (!url.trim()) {
            message.warn(t("apiConfig.messages.urlRequired"));
            return;
        }
        if (!apiKey.trim()) {
            message.warn(t("apiConfig.messages.keyRequired"));
            return;
        }
        if (apiType === "claude" && !maxTokens.trim()) {
            message.warn(t("apiConfig.messages.maxTokensRequired"));
            return;
        }

        setSaving(true);
        try {
            const keyToSend = keyTouchedRef.current ? apiKey.trim() : "";
            await AuthService.saveAiConfig({
                type: apiType,
                url: url.trim(),
                api_key: keyToSend,
                model: model.trim() || undefined,
                max_tokens: maxTokens.trim() ? Number(maxTokens) : undefined,
            });
            // 更新本地缓存，防止切走再切回来时丢失刚保存的配置
            savedConfigRef.current = {
                type: apiType,
                url: url.trim(),
                api_key: keyToSend,
                model: model.trim(),
                max_tokens: maxTokens.trim(),
            };
            if (keyTouchedRef.current) {
                maskedKeyRef.current = apiKey.trim();
            }
            keyTouchedRef.current = false;
            message.success(t("apiConfig.messages.saveSuccess"));
        } catch (err: any) {
            message.error(err?.message || t("apiConfig.messages.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <div className={styles.editCard}>
            <div className={styles.editCardHeader}>
                <FaRobot className={styles.editCardIcon} />
                <span>{t("apiConfig.title")}</span>
            </div>
            <div className={styles.editCardBody}>
                {/* 协议类型 */}
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>{t("apiConfig.protocol.label")}</label>
                    <CustomSelect
                        name={t("apiConfig.protocol.name")}
                        options={protocolOptions}
                        value={protocolOptions.find((o) => o.id === apiType) || null}
                        onChange={(option) => {
                            if (option) {
                                handleTypeChange(option.id as ApiType);
                            }
                        }}
                        hideBadge
                        placeholder={t("apiConfig.protocol.placeholder")}
                    />
                    <span className={styles.editHint}>{t("apiConfig.protocol.hint")}</span>
                </div>

                {/* 第二步：通用配置 */}
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaGlobe size={12} style={{ marginRight: 4 }} />
                        {t("apiConfig.url.label")}
                    </label>
                    <Input value={url} onChange={(v) => setUrl(v)} placeholder={current.url} size="large" />
                    <span className={styles.editHint}>
                        {apiType === "openai"
                            ? t("apiConfig.url.hintOpenai")
                            : apiType === "claude"
                              ? t("apiConfig.url.hintClaude")
                              : t("apiConfig.url.hintGlm")}
                    </span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaKey size={12} style={{ marginRight: 4 }} />
                        {t("apiConfig.apiKey.label")}
                    </label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(v) => {
                            setApiKey(v);
                            keyTouchedRef.current = true;
                        }}
                        placeholder={current.keyPlaceholder}
                        size="large"
                    />
                    <span className={styles.editHint}>
                        {maskedKeyRef.current ? t("apiConfig.apiKey.hintSaved") : t("apiConfig.apiKey.hintNew")}
                    </span>
                </div>

                {/* 第三步：附加配置 */}
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaCogs size={12} style={{ marginRight: 4 }} />
                        {t("apiConfig.model.label")}
                    </label>
                    <Input
                        value={model}
                        onChange={(v) => setModel(v)}
                        placeholder={t("apiConfig.model.placeholder", { model: current.defaultModel })}
                        size="large"
                    />
                    <span className={styles.editHint}>{t("apiConfig.model.hint", { model: current.defaultModel })}</span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        {t("apiConfig.maxTokens.label")}
                        {apiType === "claude" && (
                            <span style={{ color: "#ef4444", marginLeft: 4 }}>{t("apiConfig.maxTokens.requiredMark")}</span>
                        )}
                        {(apiType === "openai" || apiType === "glm") && (
                            <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>
                                {t("apiConfig.maxTokens.optionalMark")}
                            </span>
                        )}
                    </label>
                    <Input
                        type="number"
                        value={maxTokens}
                        onChange={(v) => setMaxTokens(v)}
                        placeholder={
                            apiType === "claude"
                                ? t("apiConfig.maxTokens.placeholderRequired")
                                : t("apiConfig.maxTokens.placeholderOptional")
                        }
                        size="large"
                    />
                    <span className={styles.editHint}>
                        {apiType === "claude" ? t("apiConfig.maxTokens.hintRequired") : t("apiConfig.maxTokens.hintOptional")}
                    </span>
                </div>

                <button className={styles.editSaveBtn} onClick={handleSave} disabled={saving}>
                    <FaKey />
                    {saving ? t("apiConfig.actions.saving") : t("apiConfig.actions.save")}
                </button>
            </div>
        </div>
    );
};

export default ApiConfigCard;

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { FaRobot, FaKey, FaGlobe, FaCogs } from "react-icons/fa";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import type { SelectOption } from "@/types";
import { message } from "@/components/message/Message";
import { agentAiConfigService } from "@/services/AgentAiConfigService.ts";
import styles from "../personal/PersonalCenter.module.css";
import ErrorState from "@/components/errorState/ErrorState";

type ApiType = "openai" | "claude" | "glm";
type ServiceProvider = "openai" | "anthropic" | "zhipu" | "custom";
type ResponseType = "responses" | "chat_completions" | "messages";

interface ProviderPreset {
    type: ApiType;
    responseType: ResponseType;
    url: string;
    keyPlaceholder?: string;
    defaultModel: string;
}

const getProviderOptions = (t: TFunction<"rd">): SelectOption[] => [
    { id: "openai", name: "OpenAI", color: "#10a37f" },
    { id: "anthropic", name: "Anthropic", color: "#d97706" },
    { id: "zhipu", name: t("agentConfig.provider.optionZhipu"), color: "#4a6cf7" },
    { id: "custom", name: t("agentConfig.provider.optionCustom"), color: "#64748b" },
];

const getProtocolOptions = (t: TFunction<"rd">): SelectOption[] => [
    { id: "openai", name: t("agentConfig.protocol.optionOpenai"), color: "#10a37f" },
    { id: "claude", name: t("agentConfig.protocol.optionClaude"), color: "#d97706" },
    { id: "glm", name: t("agentConfig.protocol.optionGlm"), color: "#4a6cf7" },
];

const RESPONSE_OPTIONS: Record<ApiType, SelectOption[]> = {
    openai: [
        { id: "responses", name: "Responses API (/responses)", color: "#10a37f" },
        { id: "chat_completions", name: "Chat Completions (/chat/completions)", color: "#0ea5e9" },
    ],
    claude: [{ id: "messages", name: "Messages API (/messages)", color: "#d97706" }],
    glm: [{ id: "chat_completions", name: "Chat Completions (/chat/completions)", color: "#4a6cf7" }],
};

const DEFAULTS: Record<ServiceProvider, ProviderPreset> = {
    openai: {
        type: "openai",
        responseType: "responses",
        url: "https://api.openai.com/v1/responses",
        keyPlaceholder: "sk-...",
        defaultModel: "gpt-4o",
    },
    anthropic: {
        type: "claude",
        responseType: "messages",
        url: "https://api.anthropic.com/v1/messages",
        keyPlaceholder: "sk-ant-...",
        defaultModel: "claude-sonnet-4-6",
    },
    zhipu: {
        type: "glm",
        responseType: "chat_completions",
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        keyPlaceholder: "xxx.xxxxxxxxxxxxxxxx",
        defaultModel: "glm-4.7-flash",
    },
    custom: {
        type: "openai",
        responseType: "chat_completions",
        url: "https://api.example.com/v1/chat/completions",
        defaultModel: "gpt-4o",
    },
};

const DEFAULT_PROVIDER_BY_TYPE: Record<ApiType, ServiceProvider> = {
    openai: "openai",
    claude: "anthropic",
    glm: "zhipu",
};

function defaultResponseType(type: ApiType): ResponseType {
    return type === "claude" ? "messages" : "chat_completions";
}

function inferProvider(type: ApiType, rawUrl: string): ServiceProvider {
    try {
        const host = new URL(rawUrl).hostname.toLowerCase();
        if (type === "openai" && host === "api.openai.com") {
            return "openai";
        }
        if (type === "claude" && host === "api.anthropic.com") {
            return "anthropic";
        }
        if (type === "glm" && host === "open.bigmodel.cn") {
            return "zhipu";
        }
    } catch {
        // URL 的具体错误由保存校验统一提示；这里仅用于兼容旧配置的 UI 推断。
    }
    return "custom";
}

function inferResponseType(type: ApiType, rawUrl: string): ResponseType {
    if (/\/responses\/?$/i.test(rawUrl)) {
        return compatibleResponseType(type, "responses");
    }
    if (/\/messages\/?$/i.test(rawUrl)) {
        return compatibleResponseType(type, "messages");
    }
    if (/\/chat\/completions\/?$/i.test(rawUrl)) {
        return compatibleResponseType(type, "chat_completions");
    }
    return defaultResponseType(type);
}

function compatibleResponseType(type: ApiType, value: unknown): ResponseType {
    if (type === "openai" && (value === "responses" || value === "chat_completions")) {
        return value;
    }
    if (type === "claude" && value === "messages") {
        return value;
    }
    if (type === "glm" && value === "chat_completions") {
        return value;
    }
    return defaultResponseType(type);
}

function replaceEndpointSuffix(raw: string, responseType: ResponseType): string {
    const suffix = responseType === "responses" ? "/responses" : responseType === "messages" ? "/messages" : "/chat/completions";
    return raw.replace(/\/(?:responses|messages|chat\/completions)\/?$/, suffix);
}

/**
 * 各协议在 dsh runtime 中落到的字段。
 * provider 经 TECHHAVEN_DSH_PROVIDER_* 映射为 dsh 的 provider route；
 * model / maxTokens 对应 dsh InitializeParams 同名参数；
 * 凭据与 base URL 以环境变量注入隔离子进程（Gateway 只注入这三项，不继承其他环境密钥）。
 * 见 services/techhaven-gateway/.env.example 与 src/aiConfig.ts。
 */
const DSH_FIELD: Record<ApiType, { key: string; baseUrl: string; provider: string }> = {
    openai: { key: "OPENAI_API_KEY", baseUrl: "OPENAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_OPENAI" },
    claude: { key: "ANTHROPIC_API_KEY", baseUrl: "ANTHROPIC_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_CLAUDE" },
    glm: { key: "ZHIPUAI_API_KEY", baseUrl: "ZHIPUAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_GLM" },
};

/**
 * 与 Gateway `src/aiConfig.ts` 的失败关闭规则对齐：
 * 这些情况原本要到创建会话时才报 412，这里提前到表单拦截。
 */
function validateUrl(raw: string, t: TFunction<"rd">): string | null {
    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        return t("agentConfig.validation.urlIncomplete");
    }
    if (parsed.username || parsed.password) {
        return t("agentConfig.validation.urlCredentials");
    }
    if (parsed.search || parsed.hash) {
        return t("agentConfig.validation.urlQueryHash");
    }
    const host = parsed.hostname;
    const isLoopback = host === "localhost" || host === "::1" || host === "[::1]" || host.startsWith("127.");
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
        return t("agentConfig.validation.urlHttps");
    }
    return null;
}

function validateApiKey(raw: string, t: TFunction<"rd">): string | null {
    if (raw.length > 8192) {
        return t("agentConfig.validation.keyTooLong");
    }
    if (/[*•]/.test(raw)) {
        return t("agentConfig.validation.keyMasked");
    }
    if (!/^[\x21-\x7e]+$/.test(raw)) {
        return t("agentConfig.validation.keyCharset");
    }
    return null;
}

function validateMaxTokens(raw: string, t: TFunction<"rd">): string | null {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return t("agentConfig.validation.maxTokensPositive");
    }
    if (parsed > 1_000_000) {
        return t("agentConfig.validation.maxTokensRange");
    }
    return null;
}

function validateReasoningEffort(raw: string, t: TFunction<"rd">): string | null {
    if (!/^[\x21-\x7e]{1,64}$/.test(raw)) {
        return t("agentConfig.validation.reasoningEffort");
    }
    return null;
}

const AgentApiConfigCard: React.FC = () => {
    const { t } = useTranslation("rd");
    const [provider, setProvider] = useState<ServiceProvider>("openai");
    const [apiType, setApiType] = useState<ApiType>("openai");
    const [responseType, setResponseType] = useState<ResponseType>("responses");
    const [url, setUrl] = useState(DEFAULTS.openai.url);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("");
    const [reasoningEffort, setReasoningEffort] = useState("");
    const [maxTokens, setMaxTokens] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);

    const maskedKeyRef = useRef("");
    const keyTouchedRef = useRef(false);
    // 保存从后端加载的原始配置，切类型时恢复
    const savedConfigRef = useRef<{
        type: ApiType;
        provider: ServiceProvider;
        response_type: ResponseType;
        url: string;
        api_key: string;
        model: string;
        reasoning_effort: string;
        max_tokens: string;
    } | null>(null);

    const current = DEFAULTS[provider];
    const dsh = DSH_FIELD[apiType];
    const responseOptions = RESPONSE_OPTIONS[apiType];
    const providerOptions = getProviderOptions(t);
    const protocolOptions = getProtocolOptions(t);

    const applyConfig = (config: {
        type: ApiType;
        provider: ServiceProvider;
        response_type: ResponseType;
        url: string;
        api_key: string;
        model: string;
        reasoning_effort: string;
        max_tokens: string;
    }) => {
        setProvider(config.provider);
        setApiType(config.type);
        setResponseType(config.response_type);
        setUrl(config.url);
        setApiKey(config.api_key);
        maskedKeyRef.current = config.api_key;
        setModel(config.model);
        setReasoningEffort(config.reasoning_effort);
        setMaxTokens(config.max_tokens);
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError(null);
        agentAiConfigService
            .getAiConfig()
            .then((config) => {
                if (!active) {
                    return;
                }
                if (config) {
                    const t: ApiType = config.type === "claude" || config.type === "glm" ? config.type : "openai";
                    const p: ServiceProvider =
                        config.provider === "openai" ||
                        config.provider === "anthropic" ||
                        config.provider === "zhipu" ||
                        config.provider === "custom"
                            ? config.provider
                            : inferProvider(t, config.url || DEFAULTS[DEFAULT_PROVIDER_BY_TYPE[t]].url);
                    const r = compatibleResponseType(t, config.response_type ?? inferResponseType(t, config.url || ""));
                    const saved = {
                        type: t,
                        provider: p,
                        response_type: r,
                        url: config.url || DEFAULTS[p].url,
                        api_key: config.api_key || "",
                        model: config.model || "",
                        reasoning_effort: config.reasoning_effort || "",
                        max_tokens: config.max_tokens ? String(config.max_tokens) : "",
                    };
                    savedConfigRef.current = saved;
                    applyConfig(saved);
                }
            })
            .catch((err) => {
                if (active) {
                    setLoadError(err instanceof Error ? err.message : t("agentConfig.loadErrorFallback"));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [retry]);

    const handleProviderChange = (nextProvider: ServiceProvider) => {
        const preset = DEFAULTS[nextProvider];
        setProvider(nextProvider);
        setApiType(preset.type);
        setResponseType(preset.responseType);
        setUrl(preset.url);
        setModel("");
    };

    const handleTypeChange = (type: ApiType) => {
        const nextResponseType = defaultResponseType(type);
        setApiType(type);
        setProvider("custom");
        setResponseType(nextResponseType);
        setUrl(replaceEndpointSuffix(url, nextResponseType));
        // key / model / max_tokens 保持不变，因为用户只有一个配置
    };

    const handleResponseTypeChange = (nextResponseType: ResponseType) => {
        setResponseType(nextResponseType);
        setUrl(replaceEndpointSuffix(url, nextResponseType));
    };

    const handleSave = async () => {
        // 与 Gateway 失败关闭规则对齐：这些错误原本要到创建会话时才以 412 暴露，这里提前拦截
        if (!url.trim()) {
            message.warn(t("agentConfig.warnings.urlRequired"));
            return;
        }
        const urlError = validateUrl(url.trim(), t);
        if (urlError) {
            message.warn(urlError);
            return;
        }
        if (keyTouchedRef.current && !apiKey.trim()) {
            // 用户改过但清空了字段：按「沿用已保存密钥」语义放行（提交空串即保留），提示而非拦截
            message.warn(t("agentConfig.warnings.keyCleared"));
        } else if (keyTouchedRef.current) {
            const keyError = validateApiKey(apiKey.trim(), t);
            if (keyError) {
                message.warn(keyError);
                return;
            }
        } else if (!maskedKeyRef.current) {
            message.warn(t("agentConfig.warnings.keyRequired"));
            return;
        }
        if (maxTokens.trim()) {
            const tokensError = validateMaxTokens(maxTokens.trim(), t);
            if (tokensError) {
                message.warn(tokensError);
                return;
            }
        } else if (apiType === "claude") {
            message.warn(t("agentConfig.warnings.maxTokensRequiredClaude"));
            return;
        }
        if (reasoningEffort.trim()) {
            const effortError = validateReasoningEffort(reasoningEffort.trim(), t);
            if (effortError) {
                message.warn(effortError);
                return;
            }
        }

        setSaving(true);
        try {
            const keyToSend = keyTouchedRef.current ? apiKey.trim() : "";
            await agentAiConfigService.saveAiConfig({
                type: apiType,
                provider,
                response_type: responseType,
                url: url.trim(),
                api_key: keyToSend,
                model: model.trim() || undefined,
                reasoning_effort: reasoningEffort.trim() || undefined,
                max_tokens: maxTokens.trim() ? Number(maxTokens) : undefined,
            });
            // 更新本地缓存，防止切走再切回来时丢失刚保存的配置
            savedConfigRef.current = {
                type: apiType,
                provider,
                response_type: responseType,
                url: url.trim(),
                api_key: keyToSend,
                model: model.trim(),
                reasoning_effort: reasoningEffort.trim(),
                max_tokens: maxTokens.trim(),
            };
            if (keyTouchedRef.current) {
                maskedKeyRef.current = apiKey.trim();
            }
            keyTouchedRef.current = false;
            message.success(t("agentConfig.success.saved"));
        } catch (err: any) {
            message.error(err?.message || t("agentConfig.error.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p role="status">{t("agentConfig.loading")}</p>;
    }
    if (loadError)
        return (
            <ErrorState
                title={t("agentConfig.errorTitle")}
                message={loadError}
                actionText={t("agentConfig.retry")}
                onAction={() => setRetry((value) => value + 1)}
            />
        );

    return (
        <div className={styles.editCard}>
            <div className={styles.editCardHeader}>
                <FaRobot className={styles.editCardIcon} />
                <span>{t("agentConfig.title")}</span>
            </div>
            <div className={styles.editCardBody}>
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>{t("agentConfig.provider.label")}</label>
                    <CustomSelect
                        name={t("agentConfig.provider.label")}
                        options={providerOptions}
                        value={providerOptions.find((o) => o.id === provider) || null}
                        onChange={(option) => {
                            if (option) {
                                handleProviderChange(option.id as ServiceProvider);
                            }
                        }}
                        hideBadge
                        placeholder={t("agentConfig.provider.placeholder")}
                    />
                    <span className={styles.editHint}>{t("agentConfig.provider.hint")}</span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>{t("agentConfig.protocol.label")}</label>
                    <CustomSelect
                        name={t("agentConfig.protocol.label")}
                        options={protocolOptions}
                        value={protocolOptions.find((o) => o.id === apiType) || null}
                        onChange={(option) => {
                            if (option) {
                                handleTypeChange(option.id as ApiType);
                            }
                        }}
                        hideBadge
                        placeholder={t("agentConfig.protocol.placeholder")}
                    />
                    <span className={styles.editHint}>
                        {t("agentConfig.protocol.hintPrefix")} <span className={styles.editHintCode}>{dsh.provider}</span>{" "}
                        {t("agentConfig.protocol.hintSuffix")}
                    </span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>{t("agentConfig.response.label")}</label>
                    <CustomSelect
                        name={t("agentConfig.response.label")}
                        options={responseOptions}
                        value={responseOptions.find((o) => o.id === responseType) || null}
                        onChange={(option) => {
                            if (option) {
                                handleResponseTypeChange(option.id as ResponseType);
                            }
                        }}
                        hideBadge
                        placeholder={t("agentConfig.response.placeholder")}
                    />
                    <span className={styles.editHint}>
                        {t("agentConfig.response.hintResponses")} <span className={styles.editHintCode}>POST /responses</span>
                        {t("agentConfig.response.hintChat")} <span className={styles.editHintCode}>POST /chat/completions</span>
                        {t("agentConfig.response.hintMessages")} <span className={styles.editHintCode}>POST /messages</span>
                        {t("agentConfig.response.hintSuffix")}
                    </span>
                </div>

                {/* 第二步：通用配置 */}
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaGlobe size={12} style={{ marginRight: 4 }} />
                        {t("agentConfig.url.label")}
                    </label>
                    <Input value={url} onChange={(v) => setUrl(v)} placeholder={current.url} size="large" />
                    <span className={styles.editHint}>
                        {t("agentConfig.url.hintPrefix")} <span className={styles.editHintCode}>{dsh.baseUrl}</span>{" "}
                        {t("agentConfig.url.hintSuffix")}
                    </span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaKey size={12} style={{ marginRight: 4 }} />
                        {t("agentConfig.key.label")}
                    </label>
                    <Input
                        type="password"
                        autoComplete="new-password"
                        maxLength={8192}
                        value={apiKey}
                        onChange={(v) => {
                            setApiKey(v);
                            keyTouchedRef.current = true;
                        }}
                        placeholder={current.keyPlaceholder ?? t("agentConfig.key.placeholder")}
                        size="large"
                    />
                    <span className={styles.editHint}>
                        {maskedKeyRef.current ? t("agentConfig.key.hintSaved") : t("agentConfig.key.hintEmpty")}
                        {t("agentConfig.key.hintMiddle")} <span className={styles.editHintCode}>{dsh.key}</span>{" "}
                        {t("agentConfig.key.hintSuffix")}
                    </span>
                </div>

                {/* 第三步：附加配置 */}
                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        <FaCogs size={12} style={{ marginRight: 4 }} />
                        {t("agentConfig.model.label")}
                    </label>
                    <Input
                        value={model}
                        onChange={(v) => setModel(v)}
                        placeholder={t("agentConfig.model.placeholder", { value: current.defaultModel })}
                        maxLength={256}
                        size="large"
                    />
                    <span className={styles.editHint}>{t("agentConfig.model.hint", { value: current.defaultModel })}</span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>{t("agentConfig.reasoning.label")}</label>
                    <Input
                        value={reasoningEffort}
                        onChange={(v) => setReasoningEffort(v)}
                        placeholder={t("agentConfig.reasoning.placeholder")}
                        maxLength={64}
                        size="large"
                    />
                    <span className={styles.editHint}>{t("agentConfig.reasoning.hint")}</span>
                </div>

                <div className={styles.editFormGroup}>
                    <label className={styles.editLabel}>
                        {t("agentConfig.maxTokens.label")}
                        {apiType === "claude" && (
                            <span style={{ color: "#ef4444", marginLeft: 4 }}>{t("agentConfig.maxTokens.required")}</span>
                        )}
                        {(apiType === "openai" || apiType === "glm") && (
                            <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>{t("agentConfig.maxTokens.optional")}</span>
                        )}
                    </label>
                    <Input
                        type="number"
                        value={maxTokens}
                        onChange={(v) => setMaxTokens(v)}
                        placeholder={
                            apiType === "claude"
                                ? t("agentConfig.maxTokens.placeholderClaude")
                                : t("agentConfig.maxTokens.placeholderOptional")
                        }
                        size="large"
                    />
                    <span className={styles.editHint}>
                        {apiType === "claude" ? t("agentConfig.maxTokens.hintClaude") : t("agentConfig.maxTokens.hintOptional")}
                        {t("agentConfig.maxTokens.hintSuffix")}
                    </span>
                </div>

                <button className={styles.editSaveBtn} onClick={handleSave} disabled={saving}>
                    <FaKey />
                    {saving ? t("agentConfig.button.saving") : t("agentConfig.button.save")}
                </button>
            </div>
        </div>
    );
};

export default AgentApiConfigCard;

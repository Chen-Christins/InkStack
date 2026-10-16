import React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Sparkles, RotateCw, AlertCircle } from "lucide-react";
import styles from "./AiSummary.module.css";
import useAiSummary from "@/hooks/UseAiSummary.ts";

interface AiSummaryProps {
    /** 文章 ID，用于请求后端 AI 总结 */
    articleId?: string | number;
}

const AiSummary: React.FC<AiSummaryProps> = ({ articleId }) => {
    const { t } = useTranslation("article");
    const { text, isStreaming, isCompleted, error, start, reset } = useAiSummary(articleId);

    const handleGenerate = () => {
        start();
    };

    const handleRegenerate = () => {
        reset();
        // 延迟一帧再启动，让 reset 的状态先渲染，保证动画重新触发
        requestAnimationFrame(() => {
            start();
        });
    };

    return (
        <div className={styles.container}>
            {/* 头部 */}
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Sparkles className={styles.aiIcon} />
                </div>
                <span className={styles.title}>{t("ai.title")}</span>
                {!isStreaming && !isCompleted && !error && (
                    <button className={styles.generateBtn} onClick={handleGenerate} disabled={articleId == null}>
                        <Sparkles size={14} />
                        {t("ai.generate")}
                    </button>
                )}
                {isStreaming && (
                    <button className={styles.generateBtn} disabled>
                        <span className={styles.spinner} />
                        {t("ai.generating")}
                    </button>
                )}
                {isCompleted && !error && text && (
                    <button className={styles.generateBtn} onClick={handleRegenerate}>
                        <RotateCw size={14} />
                        {t("ai.regenerate")}
                    </button>
                )}
                {(error || (isCompleted && !text)) && (
                    <button className={styles.generateBtn} onClick={handleRegenerate}>
                        <RotateCw size={14} />
                        {t("ai.retry")}
                    </button>
                )}
            </div>

            {/* 内容区域 */}
            {error ? (
                <div className={styles.errorContent}>
                    <AlertCircle size={14} className={styles.errorIcon} />
                    <span>{error}</span>
                </div>
            ) : text ? (
                <div className={styles.content}>
                    <ReactMarkdown>{text}</ReactMarkdown>
                    {isStreaming && <span className={styles.cursor} />}
                </div>
            ) : isStreaming ? (
                <div className={styles.contentPlaceholder}>{t("ai.placeholderGenerating")}</div>
            ) : isCompleted ? (
                <div className={styles.errorContent}>
                    <AlertCircle size={14} className={styles.errorIcon} />
                    <span>{t("ai.failed")}</span>
                </div>
            ) : (
                <div className={styles.contentPlaceholder}>{articleId == null ? t("ai.waiting") : t("ai.intro")}</div>
            )}

            {/* 完成后的底部免责声明 */}
            {isCompleted && !error && text && (
                <div className={styles.footer}>
                    <span className={styles.disclaimer}>{t("ai.disclaimer")}</span>
                </div>
            )}
        </div>
    );
};

export default AiSummary;

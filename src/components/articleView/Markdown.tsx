import type { ComponentType, ReactNode } from "react";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import i18n from "@/i18n";
import MermaidComponent from "../mermaid/MermaidComponent";

export const articleMarkdownPlugins = { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] };

interface RenderOptions {
    styles: Record<string, string>;
    paragraph: Components["p"];
    heading: (level: number) => ComponentType<any>;
    onCopy: (text: string, label: string) => void;
    renderCode?: (code: string, language: string) => ReactNode;
    mermaidCopyLabel?: string;
    trimMermaidCopy?: boolean;
    trimCode?: boolean;
    unwrapPre?: boolean;
}

/** Existing article markup shared by the editor, examples and reader. */
export function articleMarkdownComponents({
    styles,
    paragraph,
    heading,
    onCopy,
    renderCode,
    mermaidCopyLabel,
    trimMermaidCopy = true,
    trimCode = false,
    unwrapPre = false,
}: RenderOptions): Components {
    const copyLabel = mermaidCopyLabel ?? i18n.t("article:code.copy");
    return {
        ...(paragraph ? { p: paragraph } : {}),
        h1: heading(1),
        h2: heading(2),
        h3: heading(3),
        h4: heading(4),
        h5: heading(5),
        h6: heading(6),
        ...(unwrapPre ? { pre: ({ children }: { children?: ReactNode }) => <>{children}</> } : {}),
        code: ({ className, children }) => {
            const raw = String(children || "");
            const code = trimCode ? raw.replace(/\n$/, "") : raw;
            const language = className?.replace("language-", "") || "";
            if (!className) {
                return <code className={styles.inlineCode}>{code}</code>;
            }
            const mermaid = language === "mermaid";
            return (
                <div className={mermaid ? styles.mermaidWrapper : styles.codeBlockWrapper}>
                    <div className={styles.codeHeader}>
                        <span className={styles.languageTag}>{mermaid ? i18n.t("article:code.mermaidChart") : language}</span>
                        <button
                            className={styles.copyButton}
                            onClick={() =>
                                onCopy(
                                    mermaid && trimMermaidCopy ? code.trim() : code,
                                    mermaid ? i18n.t("article:code.copyMermaid") : i18n.t("article:code.copyLanguage", { language }),
                                )
                            }
                        >
                            {mermaid ? copyLabel : i18n.t("article:code.copy")}
                        </button>
                    </div>
                    {mermaid ? (
                        <MermaidComponent code={code.trim()} />
                    ) : renderCode ? (
                        renderCode(code, language)
                    ) : (
                        <pre className={styles.codeBlock}>
                            <code>{code}</code>
                        </pre>
                    )}
                </div>
            );
        },
    };
}

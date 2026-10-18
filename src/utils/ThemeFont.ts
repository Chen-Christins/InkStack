/** 读取当前主题实际生效的正文字体，供 Canvas 类渲染（如 ECharts）使用 */
export function getThemeFontFamily(): string {
    if (typeof document === "undefined") {
        return "sans-serif";
    }

    return getComputedStyle(document.body).fontFamily || "sans-serif";
}

import ThemeStylePanel from "../components/themeStylePanel/ThemeStylePanel";
import ThemeToggle from "../components/themeToggle/ThemeToggle";
import LayoutWidthToggle from "../components/layoutWidthToggle/LayoutWidthToggle";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

function SampleThemeStylePanel() {
    const { t } = useTranslation("sample");
    const { preset } = useTheme();

    const presetNames: Record<string, string> = {
        default: t("themeStylePanel.presets.default"),
        time: t("themeStylePanel.presets.time"),
        monochrome: t("themeStylePanel.presets.monochrome"),
        mint: t("themeStylePanel.presets.mint"),
        ocean: t("themeStylePanel.presets.ocean"),
        sakura: t("themeStylePanel.presets.sakura"),
        cyberpunk: t("themeStylePanel.presets.cyberpunk"),
        gold: t("themeStylePanel.presets.gold"),
        lavender: t("themeStylePanel.presets.lavender"),
        pi: t("themeStylePanel.presets.pi"),
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: "20px",
                    maxWidth: "560px",
                }}
            >
                <h2>{t("themeStylePanel.title")}</h2>
                <p style={{ color: "var(--text-secondary)" }}>
                    {t("themeStylePanel.currentStyle", { style: presetNames[preset] || preset })}
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <ThemeToggle />
                    <LayoutWidthToggle />
                </div>
                <ThemeStylePanel />
                <div
                    style={{
                        padding: "1.2rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-primary)",
                        backgroundColor: "var(--card-bg)",
                    }}
                >
                    <h3 style={{ marginBottom: "8px" }}>{t("themeStylePanel.titlePreview")}</h3>
                    <p style={{ color: "var(--text-secondary)" }}>{t("themeStylePanel.bodyPreview")}</p>
                </div>
            </div>
        </>
    );
}

export default SampleThemeStylePanel;

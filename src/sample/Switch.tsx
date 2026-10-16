import Switch from "../components/switch/Switch";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SampleSwitch() {
    const { t } = useTranslation("sample");
    const [isEnabled, setIsEnabled] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    return (
        <>
            <div style={{ padding: "20px", maxWidth: "400px" }}>
                <h2>{t("switch.title")}</h2>

                {/* 基础用法 */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>{t("switch.basicTitle")}</h3>
                    <Switch checked={isEnabled} onChange={(checked) => setIsEnabled(checked)} style={{ marginRight: "10px" }} />
                    <span>{t("switch.status", { status: isEnabled ? t("switch.on") : t("switch.off") })}</span>
                </div>

                {/* 不同尺寸 */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>{t("switch.sizeTitle")}</h3>
                    <Switch size="small" defaultChecked style={{ marginRight: "10px" }} />
                    <Switch size="default" defaultChecked style={{ marginRight: "10px" }} />
                    <Switch size="large" defaultChecked />
                </div>

                {/* 自定义颜色 */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>{t("switch.colorTitle")}</h3>
                    <Switch onColor="#52c41a" offColor="#f5222d" defaultChecked style={{ marginRight: "10px" }} />
                    <Switch onColor="#faad14" offColor="#722ed1" defaultChecked style={{ marginRight: "10px" }} />
                </div>

                {/* 禁用状态 */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>{t("switch.disabledTitle")}</h3>
                    <Switch disabled defaultChecked style={{ marginRight: "10px" }} />
                    <Switch disabled style={{ marginRight: "10px" }} />
                </div>

                {/* 实际应用场景 */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>{t("switch.appTitle")}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span>{t("switch.autoSave")}</span>
                            <Switch checked={autoSave} onChange={setAutoSave} onColor="#52c41a" />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span>{t("switch.darkMode")}</span>
                            <Switch checked={darkMode} onChange={setDarkMode} onColor="#1890ff" />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span>{t("switch.notifications")}</span>
                            <Switch defaultChecked onColor="#faad14" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SampleSwitch;

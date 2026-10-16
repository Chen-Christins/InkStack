import { useTranslation } from "react-i18next";
import Button from "../components/button/Button";

function SampleButton() {
    const { t } = useTranslation("sample");

    return (
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "20px",
                }}
            >
                <h2>{t("button.title")}</h2>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Button size="small" color="primary" variant="solid">
                        {t("button.primary")}
                    </Button>
                    <Button size="small" color="secondary" variant="solid">
                        {t("button.secondary")}
                    </Button>
                    <Button size="small" color="success" variant="solid">
                        {t("button.success")}
                    </Button>
                    <Button size="small" color="warning" variant="solid">
                        {t("button.warning")}
                    </Button>
                    <Button size="small" color="error" variant="solid">
                        {t("button.error")}
                    </Button>
                    <Button size="small" color="info" variant="solid">
                        {t("button.info")}
                    </Button>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Button size="small" color="warning" variant="solid">
                        {t("button.solidWarning")}
                    </Button>
                    <Button size="small" color="warning" variant="outline">
                        {t("button.outlineWarning")}
                    </Button>
                    <Button size="small" color="warning" variant="ghost">
                        {t("button.ghostWarning")}
                    </Button>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Button size="small" disabled>
                        {t("button.disabled")}
                    </Button>
                    <Button size="small" loading>
                        {t("button.loading")}
                    </Button>
                    <Button size="small" color="error" disabled>
                        {t("button.disabledError")}
                    </Button>
                </div>
            </div>
        </>
    );
}

export default SampleButton;

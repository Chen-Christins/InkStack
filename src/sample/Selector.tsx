import Selector from "../components/selector/Selector";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SampleSelector() {
    const { t } = useTranslation("sample");
    const [isLoading] = useState(false);

    const [selectedValue] = useState("");
    const [multipleValue] = useState([]);
    const options = [
        { label: t("selector.option1"), value: "1" },
        { label: t("selector.option2"), value: "2" },
        { label: t("selector.option3"), value: "3", disabled: true },
        { label: t("selector.option4"), value: "4" },
        { label: t("selector.option5"), value: "5" },
    ];

    return (
        <>
            <div style={{ padding: "20px", maxWidth: "400px" }}>
                <h2>{t("selector.title")}</h2>
                {/* 基础单选 */}
                <Selector
                    options={options}
                    value={selectedValue}
                    placeholder={t("selector.placeholder")}
                    allowClear
                    style={{ marginBottom: "16px" }}
                />

                {/* 多选模式 */}
                <Selector
                    options={options}
                    value={multipleValue}
                    mode="multiple"
                    placeholder={t("selector.multiplePlaceholder")}
                    allowClear
                    style={{ marginBottom: "16px" }}
                />

                {/* 带搜索功能 */}
                <Selector
                    options={options}
                    showSearch
                    placeholder={t("selector.searchPlaceholder")}
                    size="large"
                    loading={isLoading}
                    style={{ marginBottom: "16px" }}
                />

                {/* 禁用状态 */}
                <Selector
                    options={options}
                    placeholder={t("selector.disabledPlaceholder")}
                    disabled
                    style={{ marginBottom: "16px" }}
                />

                {/* 不同尺寸 */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <Selector options={options} placeholder={t("selector.smallPlaceholder")} size="small" style={{ width: "120px" }} />
                    <Selector options={options} placeholder={t("selector.defaultPlaceholder")} style={{ width: "150px" }} />
                    <Selector options={options} placeholder={t("selector.largePlaceholder")} size="large" style={{ width: "180px" }} />
                </div>
            </div>
        </>
    );
}

export default SampleSelector;

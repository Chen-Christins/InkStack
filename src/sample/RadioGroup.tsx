import Radio from "../components/radio/Radio";
import RadioGroup from "../components/radioGroup/RadioGroup";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SampleRadioGroup() {
    const { t } = useTranslation("sample");
    const [selectedValue, setSelectedValue] = useState("");
    const options = [
        { label: t("radioGroup.option1"), value: "1" },
        { label: t("radioGroup.option2"), value: "2" },
        { label: t("radioGroup.option3"), value: "3", disabled: true },
        { label: t("radioGroup.option4"), value: "4" },
        { label: t("radioGroup.option5"), value: "5" },
    ];

    const [groupValue] = useState("2");

    return (
        <>
            <div style={{ padding: "20px", maxWidth: "600px" }}>
                <h2>{t("radioGroup.title")}</h2>

                {/* 使用 RadioGroup 组件 */}
                <div style={{ marginBottom: "24px" }}>
                    <h3>{t("radioGroup.basicTitle")}</h3>
                    <RadioGroup
                        options={options}
                        value={groupValue}
                        name="example-group"
                        layout="vertical"
                        style={{ marginBottom: "16px" }}
                    />
                    <p>{t("radioGroup.currentValue", { value: groupValue })}</p>
                </div>

                {/* 使用单个 Radio 组件 */}
                <div style={{ marginBottom: "24px" }}>
                    <h3>{t("radioGroup.singleTitle")}</h3>
                    <div>
                        <Radio
                            value="option1"
                            checked={selectedValue === "option1"}
                            onChange={(checked) => checked && setSelectedValue("option1")}
                            name="single"
                        >
                            {t("radioGroup.option1")}
                        </Radio>
                        <Radio
                            value="option2"
                            checked={selectedValue === "option2"}
                            onChange={(checked) => checked && setSelectedValue("option2")}
                            name="single"
                            style={{ marginLeft: "16px" }}
                        >
                            {t("radioGroup.option2")}
                        </Radio>
                    </div>
                    <p>{t("radioGroup.currentValue", { value: selectedValue })}</p>
                </div>

                {/* 不同尺寸 */}
                <div style={{ marginBottom: "24px" }}>
                    <h3>{t("radioGroup.sizeTitle")}</h3>
                    <RadioGroup options={options.slice(0, 3)} size="small" layout="horizontal" style={{ marginBottom: "12px" }} />
                    <RadioGroup options={options.slice(0, 3)} size="default" layout="horizontal" style={{ marginBottom: "12px" }} />
                    <RadioGroup options={options.slice(0, 3)} size="large" layout="horizontal" />
                </div>

                {/* 禁用状态 */}
                <div style={{ marginBottom: "24px" }}>
                    <h3>{t("radioGroup.disabledTitle")}</h3>
                    <RadioGroup options={options} defaultValue="1" disabled layout="vertical" />
                </div>

                {/* 水平布局 */}
                <div>
                    <h3>{t("radioGroup.horizontalTitle")}</h3>
                    <RadioGroup options={options} defaultValue="1" layout="horizontal" />
                </div>
            </div>
        </>
    );
}

export default SampleRadioGroup;

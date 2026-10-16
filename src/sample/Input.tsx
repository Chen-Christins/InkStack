import Input from "../components/input/Input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch, FaUser } from "react-icons/fa";

function SampleInput() {
    const { t } = useTranslation("sample");
    const [value, setValue] = useState("");
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = () => {
        setIsLoading(true);
        // 模拟异步操作
        setTimeout(() => setIsLoading(false), 2000);
        // console.log('搜索:', searchText);
    };

    return (
        <>
            <div style={{ padding: "20px", maxWidth: "400px" }}>
                <h2>{t("input.title")}</h2>
                {/* 基础用法 */}
                <Input
                    placeholder={t("input.placeholder")}
                    value={value}
                    onChange={(value) => setValue(value)}
                    allowClear
                    style={{ marginBottom: "16px" }}
                />

                {/* 带前后缀和回车事件的搜索框 */}
                <Input
                    placeholder={t("input.searchPlaceholder")}
                    value={searchText}
                    onChange={(val) => setSearchText(val)}
                    onPressEnter={handleSearch}
                    prefix={<FaSearch />}
                    allowClear
                    loading={isLoading}
                    size="large"
                    style={{ marginBottom: "16px" }}
                />

                {/* 禁用状态 */}
                <Input
                    placeholder={t("input.disabledPlaceholder")}
                    value={t("input.disabledValue")}
                    disabled
                    prefix={<FaUser />}
                    style={{ marginBottom: "16px" }}
                />

                {/* 不同尺寸 */}
                <Input placeholder={t("input.smallPlaceholder")} size="small" style={{ marginRight: "8px", width: "120px" }} />
                <Input placeholder={t("input.defaultPlaceholder")} style={{ marginRight: "8px", width: "150px" }} />
                <Input placeholder={t("input.largePlaceholder")} size="large" style={{ width: "180px" }} />
            </div>
        </>
    );
}

export default SampleInput;

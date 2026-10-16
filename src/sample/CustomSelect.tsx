import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/customSelect/CustomSelect";
import type { SelectOption } from "../types";

const SampleCustomSelect: React.FC = () => {
    const { t } = useTranslation("sample");
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);

    const categories: SelectOption[] = [
        { id: 1, name: t("customSelect.tech"), color: "#4361ee" },
        { id: 2, name: t("customSelect.life"), color: "#3a0ca3" },
        { id: 3, name: t("customSelect.travel"), color: "#7209b7" },
        { id: 4, name: t("customSelect.food"), color: "#f72585" },
    ];

    const handleCategoryChange = (selectedOption: SelectOption | null, _selectedIndex: number, _oldIndex: number) => {
        setSelectedCategory(selectedOption);
        // console.log('选择变化:', { selectedOption, selectedIndex, oldIndex });
    };

    return (
        <div className="form-section">
            <div className="form-section-title">{t("customSelect.title")}</div>
            <CustomSelect
                name={t("customSelect.name")}
                options={categories}
                value={selectedCategory}
                onChange={handleCategoryChange}
                showDate={false}
            />
        </div>
    );
};

export default SampleCustomSelect;

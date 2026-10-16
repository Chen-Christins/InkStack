import React from "react";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchArticle.module.css";
import SearchBox from "../searchBox/SearchBox";

interface SearchPanelProps {
    onSearch?: (keyword: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch }) => {
    const { t } = useTranslation("components");
    const handleSearch = (value: string) => {
        onSearch?.(value.trim());
    };

    return (
        <div className={styles.SearchArticlePanel}>
            <h3 className={styles.panelTitle}>
                <FaSearch className={styles.titleIcon} /> {t("searchArticle.title")}
            </h3>
            <SearchBox placeholder={t("searchArticle.placeholder")} onSearch={handleSearch} />
        </div>
    );
};

export default SearchPanel;

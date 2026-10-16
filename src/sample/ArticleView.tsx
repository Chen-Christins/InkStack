// ExampleUsage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import ArticleView from "../pages/article/ArticleView";
import Footer from "../components/footer/Footer";
import Navbar from "../components/navbar/Navbar";
import BackToTop from "../components/backToTop/BackToTop";

const ExampleUsage: React.FC = () => {
    const { t } = useTranslation("sample");

    return (
        <div>
            <Navbar />
            <ArticleView
                title={t("articleView.title")}
                pushlish_time="2025-10-26 19:19:19"
                author="Christins"
                views={0}
                praises={0}
                update_time="2025-10-26 19:19:19"
                content={t("articleView.markdownContent")}
            />
            <Footer startYear={2025} />
            <BackToTop />
        </div>
    );
};

export default ExampleUsage;

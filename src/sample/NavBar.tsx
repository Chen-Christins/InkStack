import { useTranslation } from "react-i18next";
import Navbar from "../components/navbar/Navbar";

function SampleNavBar() {
    const { t } = useTranslation("sample");

    return (
        <div style={{ padding: "20px" }}>
            <h2>{t("navBar.title")}</h2>
            <Navbar />
        </div>
    );
}

export default SampleNavBar;

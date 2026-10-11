import React from "react";
import Navbar from "../navbar/Navbar";
import Footer from "../footer/Footer";
import styles from "./ClassicLayout.module.css";

const ClassicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className={styles.shell}>
            <Navbar />
            {children}
            <Footer startYear={2025} />
        </div>
    );
};

export default ClassicLayout;

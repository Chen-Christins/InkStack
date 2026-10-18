import React, { useEffect, useRef, useState } from "react";
import styles from "./NotFound404.module.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RobotMascot from "@/components/robotMascot";

const UFO_SOUND = "https://cdn.pixabay.com/audio/2022/10/16/audio_12b2b7e2b2.mp3";

const NotFound404: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation("error");
    const [showUfo, setShowUfo] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // UFO appears after 1.5s
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowUfo(true);
            audioRef.current?.play();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.code}>404</div>
            <div className={styles.illustration}>
                <RobotMascot className={styles.robot} />
                {/* UFO Easter Egg */}
                {showUfo && (
                    <div className={styles.ufoWrap}>
                        <svg
                            width="80"
                            height="60"
                            viewBox="0 0 80 60"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={styles.ufo}
                        >
                            <ellipse cx="40" cy="30" rx="32" ry="12" fill="#b3e5fc" />
                            <ellipse cx="40" cy="24" rx="18" ry="8" fill="#4f8ef7" />
                            <ellipse cx="40" cy="20" rx="8" ry="4" fill="#fff" />
                            <rect x="36" y="32" width="8" height="18" rx="4" fill="url(#beam)" opacity="0.7" />
                            <defs>
                                <linearGradient id="beam" x1="40" y1="32" x2="40" y2="50" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#b3e5fc" stopOpacity="0.7" />
                                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                )}
                <audio ref={audioRef} src={UFO_SOUND} preload="auto" />
            </div>
            <div className={styles.title}>{t("notFound.title")}</div>
            <div className={styles.desc}>
                {t("notFound.descriptionLine1")}
                <br />
                {t("notFound.descriptionLine2")}
            </div>
            <button className={styles.homeBtn} onClick={() => navigate("/index")}>
                {t("notFound.backHome")}
            </button>
        </div>
    );
};

export default NotFound404;

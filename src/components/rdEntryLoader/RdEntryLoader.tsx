import React from "react";
import { useTranslation } from "react-i18next";
import { FaBuilding, FaShieldAlt, FaUserShield } from "react-icons/fa";
import type { IconType } from "react-icons";
import RobotMascot from "@/components/robotMascot";
import styles from "./RdEntryLoader.module.css";

export type RdEntryStage = "auth" | "access" | "org";

interface RdEntryLoaderProps {
    stage: RdEntryStage;
}

const STAGES: RdEntryStage[] = ["auth", "access", "org"];

const STAGE_ICONS: Record<RdEntryStage, IconType> = {
    auth: FaUserShield,
    access: FaShieldAlt,
    org: FaBuilding,
};

const RdEntryLoader: React.FC<RdEntryLoaderProps> = ({ stage }) => {
    const { t } = useTranslation("rd");
    const Icon = STAGE_ICONS[stage];
    const currentIndex = STAGES.indexOf(stage);

    return (
        <div className={styles.container} data-stage={stage} role="status" aria-live="polite" aria-busy="true">
            <div className={styles.ambient} aria-hidden="true" />

            <div className={styles.mascotWrap} data-stage={stage}>
                <span className={styles.orbit} aria-hidden="true" />
                <span className={styles.scanRing} aria-hidden="true" />
                <span className={styles.badge} key={stage} aria-hidden="true">
                    <Icon className={styles.badgeIcon} />
                </span>
                <RobotMascot className={styles.robot} size={128} />
            </div>

            <div className={styles.textBlock} key={stage}>
                <span className={styles.stageLabel}>{t(`entryLoader.stages.${stage}`)}</span>
                <h2 className={styles.title}>{t("entryLoader.title")}</h2>
                <p className={styles.description}>{t(`entryLoader.descriptions.${stage}`)}</p>
            </div>

            <div className={styles.steps} aria-hidden="true">
                {STAGES.map((item, index) => (
                    <span
                        key={item}
                        className={`${styles.step} ${index < currentIndex ? styles.stepDone : ""} ${item === stage ? styles.stepActive : ""}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default RdEntryLoader;

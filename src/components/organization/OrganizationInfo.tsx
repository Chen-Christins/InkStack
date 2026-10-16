import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBuilding, FaCheckCircle, FaLock, FaUserFriends, FaArrowLeft, FaPlus, FaUser, FaUserAlt, FaGithub } from "react-icons/fa";
import type { OrganizationDetail, MemberStats } from "@/types/Organization.ts";
import { OrgMembershipStatus } from "@/types/Enums.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import styles from "./Organization.module.css";

interface OrganizationInfoProps {
    org: OrganizationDetail | null;
    stats: MemberStats;
    repoCount: number;
    onJoin: () => void;
}

const OrganizationInfo: React.FC<OrganizationInfoProps> = ({ org, stats, repoCount, onJoin }) => {
    const navigate = useNavigate();
    const enums = useEnumLabels();
    const { t } = useTranslation("organization");

    if (!org) {
        return null;
    }

    return (
        <>
            <div className={styles.cardHeader}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    <FaArrowLeft /> {t("info.back")}
                </button>
                <div className={styles.headerContent}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>
                            <FaBuilding /> {org.name}
                        </h1>
                        <span className={styles.orgType}>{org.type}</span>
                    </div>
                    <div className={styles.headerRight}>
                        <span className={org.status === "active" ? styles.statusActive : styles.statusInactive}>
                            {org.status === "active" ? <FaCheckCircle /> : <FaLock />}
                            {org.status === "active" ? t("info.status.active") : t("info.status.inactive")}
                        </span>
                        {org.user_in_org === OrgMembershipStatus.JOINED || org.user_in_org === OrgMembershipStatus.PENDING ? (
                            <span className={styles.joined}>{enums.orgMembershipStatus[org.user_in_org]}</span>
                        ) : (
                            <button
                                className={styles.joinBtn}
                                onClick={onJoin}
                                disabled={org.status !== "active"}
                                title={org.status !== "active" ? t("info.joinDisabled") : ""}
                            >
                                <FaPlus /> {org.user_in_org === OrgMembershipStatus.LEFT ? t("info.rejoin") : t("info.applyJoin")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.description}>{org.description}</div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaUserFriends />
                    </div>
                    <div className={styles.statValue}>{stats.totalMembers}</div>
                    <div className={styles.statLabel}>{t("info.stats.totalMembers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statValue}>{stats.activeMembers}</div>
                    <div className={styles.statLabel}>{t("info.stats.activeMembers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaUser />
                    </div>
                    <div className={styles.statValue}>{stats.orgAdminMembers}</div>
                    <div className={styles.statLabel}>{t("info.stats.orgAdmins")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaUserAlt />
                    </div>
                    <div className={styles.statValue}>{stats.regularMembers}</div>
                    <div className={styles.statLabel}>{t("info.stats.regularMembers")}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.info}`}>
                        <FaGithub />
                    </div>
                    <div className={styles.statValue}>{repoCount}</div>
                    <div className={styles.statLabel}>{t("info.stats.repos")}</div>
                </div>
            </div>
        </>
    );
};

export default OrganizationInfo;

import React, { useState, useEffect } from "react";
import { FaUsers, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { encodeId } from "@/utils/HashId.ts";
import Loading from "@/components/loading/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { OrganizationService } from "@/services/OrganizationService.ts";
import { formatToChinaTime } from "@/utils/Utils.ts";
import type { PersonalOrganization } from "@/types/Organization.ts";
import { OrgRole } from "@/types/Roles.ts";
import { useEnumLabels } from "@/i18n/UseEnumLabels";
import styles from "../PersonalCenter.module.css";

const MyOrganizationsTab: React.FC = () => {
    const { t } = useTranslation("personal");
    const navigate = useNavigate();
    const { user } = useAuth();
    const enums = useEnumLabels();
    const userId = user?.id;
    const [organizations, setOrganizations] = useState<PersonalOrganization[]>([]);
    const [organizationsLoading, setOrganizationsLoading] = useState(false);

    useEffect(() => {
        const fetchPersonalOrganizations = async () => {
            setOrganizationsLoading(true);
            if (!userId) {
                setOrganizations([]);
                setOrganizationsLoading(false);
                return;
            }

            try {
                // 使用最新接口获取用户加入的组织列表
                const res = await OrganizationService.userOrganizationLists();
                const orgs: PersonalOrganization[] = (res.list || []).map((org: any) => ({
                    id: String(org.org_id),
                    name: org.org_name || t("organizations.unknownOrg"),
                    type: org.type || t("organizations.unknownType"),
                    description: org.org_description || t("organizations.noDescription"),
                    memberCount: org.count ?? 0,
                    role: (Number(org.role) || OrgRole.MEMBER) as OrgRole,
                    createTime: org.join_time ? formatToChinaTime(org.join_time) : t("organizations.unknownTime"),
                    status: "active", // 该接口无状态字段，默认 active
                    avatar: undefined, // 该接口无头像字段
                }));
                setOrganizations(orgs);
            } catch (err) {
                console.error("获取个人组织失败:", err);
                setOrganizations([]);
            } finally {
                setOrganizationsLoading(false);
            }
        };

        fetchPersonalOrganizations();
    }, [userId, t]);

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>{t("organizations.title")}</h2>
                <button className={styles.addButton} onClick={() => navigate("/organizations/list")}>
                    <FaPlus />
                    {t("organizations.browse")}
                </button>
            </div>

            {organizationsLoading ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <Loading size="small" text={t("organizations.loading")} />
                </div>
            ) : organizations.length === 0 ? (
                <div className={styles.emptyState}>
                    <FaUsers className={styles.emptyIcon} />
                    <h3>{t("organizations.emptyTitle")}</h3>
                    <p>{t("organizations.emptyDescription")}</p>
                </div>
            ) : (
                <div className={styles.organizationsGrid}>
                    {organizations.map((org) => (
                        <div
                            key={org.id}
                            className={styles.orgCard}
                            onClick={() => navigate(`/organization/detail/${encodeId(org.id, "organization")}`)}
                        >
                            <div className={styles.orgHeader}>
                                <div className={styles.orgAvatar}>
                                    {org.avatar ? (
                                        <img src={org.avatar} alt={org.name} />
                                    ) : (
                                        <div className={styles.orgInitials}>{org.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className={styles.orgInfo}>
                                    <h3>{org.name}</h3>
                                    <p className={styles.orgType}>{org.type}</p>
                                </div>
                            </div>
                            <p className={styles.orgDescription}>{org.description}</p>
                            <div className={styles.orgStats}>
                                <span>{t("organizations.memberCount", { value: org.memberCount })}</span>
                                <span>{t("organizations.roleLabel", { role: enums.orgRole[org.role as OrgRole] || org.role })}</span>
                            </div>
                            <div className={styles.orgTime}>{t("organizations.joinedAt", { date: org.createTime ?? "" })}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrganizationsTab;

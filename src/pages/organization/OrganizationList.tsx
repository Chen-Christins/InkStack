import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Assuming react-router-dom is used
import { useTranslation } from "react-i18next";
import { encodeId } from "@/utils/HashId.ts";
import { FaBuilding, FaCheckCircle, FaUserFriends, FaLock, FaClipboardList, FaArrowRight, FaPlus, FaFlask } from "react-icons/fa";
import Skeleton from "@/components/skeleton/Skeleton";
import ApplyCreateOrg from "@/components/orgApply/ApplyCreateOrg";
import styles from "./OrganizationList.module.css";
import OrganizationService from "@/services/OrganizationService.ts";
import RdPlatformService from "@/services/RdPlatformService.ts";
import message from "@/components/message/Message";
import AuthRequired from "@/components/auth/AuthRequired";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
    id: string;
    name: string;
    type: string;
    status: "active" | "inactive";
    description?: string;
    memberCount: number;
}

const OrganizationList: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation("organization");
    const { user: currentUser } = useAuth();
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [applyVisible, setApplyVisible] = useState(false);
    // 用户拥有研发平台访问权限的组织 ID，用于按组织展示「研发」入口
    const [rdOrgIds, setRdOrgIds] = useState<Set<string>>(new Set());
    const [rdReady, setRdReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setRdReady(false);
        if (!currentUser) {
            setRdOrgIds(new Set());
            setRdReady(true);
            return;
        }
        RdPlatformService.getMyOrganizations()
            .then((list) => {
                if (!cancelled) {
                    setRdOrgIds(new Set(list.map((item) => item.orgId)));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setRdOrgIds(new Set());
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setRdReady(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [currentUser]);

    useEffect(() => {
        const fetchOrgs = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                let statusParam: number | undefined = undefined;
                if (filter === "active") {
                    statusParam = 1;
                }
                if (filter === "inactive") {
                    statusParam = 0;
                }
                const res = await OrganizationService.getOrganizationLists(statusParam !== undefined ? { status: statusParam } : {});
                const mapped = (res.list || []).map((item: any) => ({
                    id: String(item.id),
                    name: item.name,
                    type: item.type,
                    status: item.status === 1 ? "active" : ("inactive" as "active" | "inactive"),
                    description: item.description,
                    memberCount: item.count || 0, // 如果接口有成员数字段
                }));
                setOrganizations(mapped);
            } catch (e) {
                message.error(t("list.fetchFailed"));
            } finally {
                setLoading(false);
            }
        };
        fetchOrgs();
    }, [filter, currentUser]);

    const filteredOrganizations = organizations.filter((org) => {
        if (filter === "all") {
            return true;
        }
        return org.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        <FaCheckCircle /> {t("list.status.active")}
                    </span>
                );
            case "inactive":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusInactive}`}>
                        <FaLock /> {t("list.status.inactive")}
                    </span>
                ); // Using FaLock for inactive
            default:
                return null;
        }
    };

    return (
        <>
            <div className={styles.mainContent}>
                <AuthRequired message={t("list.authRequired")}>
                    <>
                        <div className={styles.pageHeader}>
                            <div className={styles.pageHeaderTop}>
                                <h1 className={styles.pageTitle}>
                                    <FaBuilding /> {t("list.title")}
                                </h1>
                                <button className={styles.applyBtn} onClick={() => setApplyVisible(true)}>
                                    <FaPlus /> {t("list.applyCreate")}
                                </button>
                            </div>
                            <div className={styles.filterBar}>
                                <button
                                    className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                                    onClick={() => setFilter("all")}
                                >
                                    {t("list.filter.all")}
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "active" ? styles.active : ""}`}
                                    onClick={() => setFilter("active")}
                                >
                                    {t("list.filter.active")}
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "inactive" ? styles.active : ""}`}
                                    onClick={() => setFilter("inactive")}
                                >
                                    {t("list.filter.inactive")}
                                </button>
                            </div>
                        </div>

                        {loading || !rdReady ? (
                            <div className={styles.grid}>
                                {/* 骨架屏加载状态 */}
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <Skeleton variant="rectangular" width={100} height={24} style={{ borderRadius: "6px" }} />
                                            <Skeleton variant="rounded" width={80} height={24} style={{ borderRadius: "30px" }} />
                                        </div>

                                        <div style={{ margin: "1rem 0" }}>
                                            <Skeleton variant="text" width="80%" height={28} style={{ marginBottom: "0.5rem" }} />
                                            <Skeleton variant="text" lines={2} />
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div style={{ width: "120px" }}>
                                                <Skeleton variant="text" width="100%" />
                                            </div>
                                            <Skeleton variant="rectangular" width={100} height={36} style={{ borderRadius: "8px" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrganizations.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredOrganizations.map((org) => (
                                    <div key={org.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.courseBadge}>{org.type}</span>
                                            {getStatusBadge(org.status)}
                                        </div>

                                        <h3 className={styles.cardTitle}>{org.name}</h3>
                                        <p className={styles.cardDesc}>{org.description}</p>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.cardMetric}>
                                                <FaUserFriends />
                                                {t("list.memberCount", { value: org.memberCount })}
                                            </div>
                                            <div className={styles.cardActions}>
                                                {rdOrgIds.has(org.id) && (
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.btnSecondary}`}
                                                        onClick={() => navigate(`/rd?org=${encodeId(org.id, "organization")}`)}
                                                    >
                                                        <FaFlask />
                                                        {t("list.rd")}
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.actionBtn} ${styles.btnPrimary}`}
                                                    onClick={() =>
                                                        navigate(`/organization/detail/${encodeId(org.id, "organization")}`)
                                                    }
                                                >
                                                    {t("list.viewDetail")}
                                                    <FaArrowRight />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaClipboardList className={styles.emptyIcon} />
                                <h3 className={styles.emptyText}>{t("list.empty.title")}</h3>
                                <p className={styles.emptySubtext}>{t("list.empty.subtitle")}</p>
                            </div>
                        )}
                    </>
                </AuthRequired>
            </div>

            <ApplyCreateOrg visible={applyVisible} onClose={() => setApplyVisible(false)} />
        </>
    );
};

export default OrganizationList;

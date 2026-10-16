import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decodeId } from "@/utils/HashId.ts";
import {
    FaCloudUploadAlt,
    FaFileAlt,
    FaTrash,
    FaArrowLeft,
    FaClock,
    FaInfoCircle,
    FaCheckCircle,
    FaExclamationCircle,
    FaBookOpen,
} from "react-icons/fa";
import message from "@/components/message/Message";
import AuthRequired from "@/components/auth/AuthRequired";
import AssignmentSubmitSkeleton from "./AssignmentSubmitSkeleton";
import AssignmentService from "@/services/AssignmentService.ts";
import FileService from "@/services/FileService.ts";
import ErrorState from "@/components/errorState/ErrorState";
import styles from "./AssignmentSubmit.module.css";

interface Assignment {
    id: string | number;
    name: string;
    description: string;
    subject_name: string;
    end_time: number;
    status: string;
    priority: number;
    file_size: number;
    file_type: string;
}

const STATUS_MAP: { [key: string]: string } = {
    "0": "pending", // 进行中
    "1": "open", // 已提交
    "2": "closed", // 已逾期
};

const AssignmentSubmit: React.FC = () => {
    const { id: encodedId } = useParams();
    const id = encodedId ? decodeId(encodedId, "assignment") : null;
    const navigate = useNavigate();
    const { t } = useTranslation("assignment");
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAssignmentDetail = async () => {
            if (!id) {
                message.error(t("submit.messages.idRequired"));
                navigate("/assignments");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await AssignmentService.getAssignmentDetail({ id });
                setAssignment(response);
            } catch (err: any) {
                setError(err.message || t("submit.messages.fetchFailed"));
                // 如果不是资源不存在才弹窗提示
                if (!err.message || !/不存在|not found|404/i.test(err.message)) {
                    message.error(err.message || t("submit.messages.fetchFailed"));
                }
                // 延迟跳转，让用户看到错误信息
                setTimeout(() => {
                    navigate("/assignments");
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetail();
    }, [id, navigate, t]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndAddFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            validateAndAddFiles(selectedFiles);
        }
    };

    const validateAndAddFiles = (newFiles: File[]) => {
        if (!assignment) {
            return;
        }

        const validFiles: File[] = [];
        const maxFileSize = assignment.file_size; // API返回的文件大小（MB）

        newFiles.forEach((file) => {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > maxFileSize) {
                message.error(t("submit.messages.fileSizeExceeded", { name: file.name, max: maxFileSize }));
                return;
            }

            // 检查文件类型（根据API返回的file_type字段进行验证）
            const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
            const allowedTypes = assignment.file_type.split(",").map((type) => type.trim());

            if (!allowedTypes.includes(fileExtension)) {
                message.error(t("submit.messages.fileTypeUnsupported", { name: file.name, types: assignment.file_type }));
                return;
            }

            validFiles.push(file);
        });

        setFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            message.warn(t("submit.messages.noFile"));
            return;
        }

        if (!assignment) {
            message.error(t("submit.messages.assignmentMissing"));
            return;
        }

        setSubmitting(true);
        setUploadProgress(0);
        try {
            // 只支持单文件分块上传（如需多文件可循环）
            const file = files[0];
            const result = await FileService.uploadFileByChunks({
                dir_name: `${assignment.name}`,
                biz_type: "assignment_submission",
                biz_id: String(assignment.id),
                file,
                onProgress: (progress) => {
                    setUploadProgress(progress);
                },
            });

            if (result.success) {
                message.success(t("submit.messages.submitSuccess"));
                navigate("/assignments");
            } else {
                message.error(result.error || t("submit.messages.submitFailed"));
            }
        } catch (error: any) {
            console.error("提交失败:", error);
            const errorMessage = error.response?.data?.message || error.message || t("submit.messages.submitFailed");
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) {
            return "0 B";
        }
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${h}:${min}`;
    };

    const PRIORITY_NUMBER_MAP_STR: Record<number, string> = {
        1: "low",
        2: "medium",
        3: "high",
        4: "urgent",
    };

    const getPriorityBadge = (priority: number) => {
        const priorityStr = PRIORITY_NUMBER_MAP_STR[priority] || "medium";
        switch (priorityStr) {
            case "urgent":
                return <span className={`${styles.priorityBadge} ${styles.priorityUrgent}`}>{t("submit.priority.urgent")}</span>;
            case "high":
                return <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>{t("submit.priority.high")}</span>;
            case "medium":
                return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>{t("submit.priority.medium")}</span>;
            case "low":
                return <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>{t("submit.priority.low")}</span>;
            default:
                return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>{t("submit.priority.medium")}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusString = STATUS_MAP[status] || "pending";
        switch (statusString) {
            case "open":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> {t("submit.status.open")}
                    </span>
                );
            case "closed":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                        <FaExclamationCircle /> {t("submit.status.closed")}
                    </span>
                );
            default:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                        <FaClock /> {t("submit.status.pending")}
                    </span>
                );
        }
    };

    const isAssignmentOpen = () => {
        const statusString = STATUS_MAP[assignment?.status || "0"] || "pending";
        return statusString !== "closed";
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <AuthRequired message={t("submit.authRequired")}>
                        <AssignmentSubmitSkeleton />
                    </AuthRequired>
                </div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <AuthRequired message={t("submit.authRequired")}>
                        <ErrorState
                            title={t("submit.errorState.title")}
                            message={error || t("submit.errorState.notFound")}
                            icon={<FaExclamationCircle />}
                            actionText={t("submit.errorState.backAction")}
                            onAction={() => navigate("/assignments")}
                        />
                    </AuthRequired>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <AuthRequired message={t("submit.authRequired")}>
                    <div className={styles.card}>
                        <div
                            style={{
                                marginBottom: "2rem",
                                paddingBottom: "0.6rem",
                                borderBottom: "1px solid var(--border-secondary)",
                            }}
                        >
                            <button className={styles.backButton} onClick={() => navigate(-1)}>
                                <FaArrowLeft /> {t("submit.header.back")}
                            </button>
                            <div className={styles.headerContent}>
                                <div className={styles.titleGroup}>
                                    <h1 className={styles.pageTitle}>{assignment.name}</h1>
                                    <div className={styles.courseName}>
                                        <FaBookOpen /> {assignment.subject_name}
                                    </div>
                                </div>
                                {getStatusBadge(assignment.status)}
                            </div>
                        </div>

                        <div style={{ marginBottom: "2rem" }}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <FaInfoCircle />
                                </div>
                                <h2 className={styles.sectionTitle}>{t("submit.detail.title")}</h2>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>{t("submit.detail.deadline")}</span>
                                    <span className={`${styles.infoValue} ${styles.deadlineValue}`}>
                                        {formatDate(assignment.end_time)}
                                    </span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>{t("submit.detail.priority")}</span>
                                    <span className={styles.infoValue}>{getPriorityBadge(assignment.priority)}</span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>{t("submit.detail.sizeLimit")}</span>
                                    <span className={styles.infoValue}>{Math.round(assignment.file_size)} MB</span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>{t("submit.detail.fileTypes")}</span>
                                    <span className={styles.infoValue}>{assignment.file_type}</span>
                                </div>
                            </div>

                            <div className={styles.description}>{assignment.description}</div>
                        </div>

                        <div>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <FaCloudUploadAlt />
                                </div>
                                <h2 className={styles.sectionTitle}>{t("submit.submitSection.title")}</h2>
                            </div>

                            <div className={styles.uploadContainer}>
                                <div
                                    className={`${styles.uploadArea} ${isDragging ? styles.active : ""} ${!isAssignmentOpen() ? styles.disabled : ""}`}
                                    onDragEnter={isAssignmentOpen() ? handleDragEnter : undefined}
                                    onDragLeave={isAssignmentOpen() ? handleDragLeave : undefined}
                                    onDragOver={isAssignmentOpen() ? handleDragOver : undefined}
                                    onDrop={isAssignmentOpen() ? handleDrop : undefined}
                                    onClick={isAssignmentOpen() ? () => fileInputRef.current?.click() : undefined}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        multiple
                                        onChange={handleFileSelect}
                                        disabled={!isAssignmentOpen()}
                                    />
                                    <div className={styles.uploadContent}>
                                        <div className={styles.uploadIconWrapper}>
                                            <FaCloudUploadAlt />
                                        </div>
                                        <div className={styles.uploadTitle}>
                                            {isAssignmentOpen() ? t("submit.upload.openTitle") : t("submit.upload.closedTitle")}
                                        </div>
                                        <div className={styles.uploadDesc}>
                                            {isAssignmentOpen()
                                                ? t("submit.upload.openDesc", { types: assignment.file_type })
                                                : t("submit.upload.closedDesc")}
                                        </div>
                                        <div className={styles.uploadLimit}>
                                            {t("submit.upload.limit", { size: Math.round(assignment.file_size) })}
                                        </div>
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <div className={styles.fileList}>
                                        {files.map((file, index) => (
                                            <div key={index} className={styles.fileItem}>
                                                <div className={styles.fileLeft}>
                                                    <div className={styles.fileTypeIcon}>
                                                        <FaFileAlt />
                                                    </div>
                                                    <div className={styles.fileDetails}>
                                                        <div className={styles.fileName}>{file.name}</div>
                                                        <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => removeFile(index)}
                                                    title={t("submit.file.remove")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.actionBar}>
                                <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => navigate(-1)}
                                    disabled={submitting}
                                >
                                    {t("submit.actions.cancel")}
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={handleSubmit}
                                    disabled={submitting || files.length === 0 || !isAssignmentOpen()}
                                >
                                    {submitting
                                        ? uploadProgress > 0 && uploadProgress < 100
                                            ? t("submit.actions.uploading", { progress: uploadProgress })
                                            : t("submit.actions.submitting")
                                        : !isAssignmentOpen()
                                          ? t("submit.actions.closed")
                                          : t("submit.actions.confirm")}
                                </button>
                                {/* 上传进度条 */}
                                {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className={styles.progressBarWrapper}>
                                        <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                                        <span className={styles.progressText}>{uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AuthRequired>
            </div>
        </div>
    );
};

export default AssignmentSubmit;

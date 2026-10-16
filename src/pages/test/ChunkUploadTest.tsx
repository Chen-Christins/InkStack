import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import FileService from "@/services/FileService.ts";
import message from "@/components/message/Message";
import styles from "./ChunkUploadTest.module.css";

interface ChunkStatus {
    index: number;
    status: "pending" | "uploading" | "uploaded" | "error";
}

const ChunkUploadTest: React.FC = () => {
    const { t } = useTranslation("sample");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [uploadResult, setUploadResult] = useState<any>(null);

    const addLog = (message: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // 计算分块数量
            const chunkSize = 2 * 1024 * 1024; // 2MB
            const chunkCount = Math.ceil(file.size / chunkSize);

            // 初始化分块状态
            const statuses: ChunkStatus[] = [];
            for (let i = 0; i < chunkCount; i++) {
                statuses.push({ index: i, status: "pending" });
            }
            setChunkStatuses(statuses);

            setLogs([]);
            setUploadResult(null);
            setProgress(0);

            addLog(
                t("chunkUpload.log.selectedFile", {
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2),
                    chunks: chunkCount,
                }),
            );
        }
    };

    const updateChunkStatus = (chunkIndex: number, status: ChunkStatus["status"]) => {
        setChunkStatuses((prev) => prev.map((chunk) => (chunk.index === chunkIndex ? { ...chunk, status } : chunk)));
    };

    const handleUpload = async () => {
        if (!selectedFile || uploading) {
            return;
        }

        setUploading(true);
        setProgress(0);
        setLogs([]);
        setUploadResult(null);

        addLog(t("chunkUpload.log.startUpload"));

        try {
            const result = await FileService.uploadFileByChunks({
                dir_name: "test",
                biz_type: "test",
                biz_id: "1",
                file: selectedFile,
                chunkSize: 2 * 1024 * 1024, // 2MB
                maxRetries: 3,
                onProgress: (progress) => {
                    setProgress(progress);
                    addLog(t("chunkUpload.log.progress", { progress }));
                },
                onChunkUploaded: (chunkIndex, totalChunks) => {
                    updateChunkStatus(chunkIndex, "uploaded");
                    addLog(t("chunkUpload.log.chunkUploaded", { current: chunkIndex + 1, total: totalChunks }));
                },
            });

            setUploadResult(result);

            if (result.success) {
                message.success(t("chunkUpload.message.success"));
                addLog(t("chunkUpload.log.uploadSuccess", { path: result.filePath ?? "" }));
            } else {
                message.error(result.error || t("chunkUpload.message.uploadFailed"));
                addLog(t("chunkUpload.log.uploadFailed", { error: result.error ?? "" }));
            }
        } catch (error: any) {
            message.error(error.message || t("chunkUpload.message.uploadError"));
            addLog(t("chunkUpload.log.uploadError", { error: error.message }));
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);

            // 计算分块数量
            const chunkSize = 2 * 1024 * 1024; // 2MB
            const chunkCount = Math.ceil(file.size / chunkSize);

            // 初始化分块状态
            const statuses: ChunkStatus[] = [];
            for (let i = 0; i < chunkCount; i++) {
                statuses.push({ index: i, status: "pending" });
            }
            setChunkStatuses(statuses);

            setLogs([]);
            setUploadResult(null);
            setProgress(0);

            addLog(
                t("chunkUpload.log.droppedFile", {
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2),
                    chunks: chunkCount,
                }),
            );
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

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className={styles.container}>
            <h1>{t("chunkUpload.title")}</h1>
            <p>{t("chunkUpload.description")}</p>

            <div className={styles.uploadArea} onDragOver={handleDragOver} onDrop={handleDrop}>
                <input type="file" id="fileInput" onChange={handleFileSelect} className={styles.fileInput} />
                <label htmlFor="fileInput" className={styles.uploadLabel}>
                    <div className={styles.uploadIcon}>📁</div>
                    <p>{t("chunkUpload.dropZone")}</p>
                </label>
            </div>

            {selectedFile && (
                <div className={styles.fileInfo}>
                    <h3>{t("chunkUpload.fileInfo.title")}</h3>
                    <p>
                        <strong>{t("chunkUpload.fileInfo.name")}</strong> {selectedFile.name}
                    </p>
                    <p>
                        <strong>{t("chunkUpload.fileInfo.size")}</strong> {formatFileSize(selectedFile.size)}
                    </p>
                    <p>
                        <strong>{t("chunkUpload.fileInfo.chunkCount")}</strong> {chunkStatuses.length}
                    </p>
                    <p>
                        <strong>{t("chunkUpload.fileInfo.chunkSize")}</strong> 2MB
                    </p>
                </div>
            )}

            <div className={styles.buttonGroup}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleUpload} disabled={!selectedFile || uploading}>
                    {uploading ? t("chunkUpload.actions.uploading") : t("chunkUpload.actions.startUpload")}
                </button>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={clearLogs}>
                    {t("chunkUpload.actions.clearLogs")}
                </button>
            </div>

            {(uploading || progress > 0) && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                            {progress}%
                        </div>
                    </div>
                </div>
            )}

            {chunkStatuses.length > 0 && (
                <div className={styles.chunkInfo}>
                    <h3>{t("chunkUpload.status.title")}</h3>
                    <div className={styles.chunkGrid}>
                        {chunkStatuses.map((chunk) => (
                            <div
                                key={chunk.index}
                                className={`${styles.chunkItem} ${styles[`chunk${chunk.status.charAt(0).toUpperCase() + chunk.status.slice(1)}`]}`}
                            >
                                {t("chunkUpload.status.chunk", { index: chunk.index })}
                                {chunk.status === "uploaded" && " ✓"}
                                {chunk.status === "uploading" && " ..."}
                                {chunk.status === "error" && " ✗"}
                            </div>
                        ))}
                    </div>
                    <div className={styles.legend}>
                        <span className={`${styles.legendItem} ${styles.legendPending}`}>{t("chunkUpload.legend.pending")}</span>
                        <span className={`${styles.legendItem} ${styles.legendUploading}`}>{t("chunkUpload.legend.uploading")}</span>
                        <span className={`${styles.legendItem} ${styles.legendUploaded}`}>{t("chunkUpload.legend.uploaded")}</span>
                        <span className={`${styles.legendItem} ${styles.legendError}`}>{t("chunkUpload.legend.error")}</span>
                    </div>
                </div>
            )}

            <div className={styles.logContainer}>
                <h3>{t("chunkUpload.log.title")}</h3>
                <div className={styles.log}>
                    {logs.length === 0 ? (
                        <div className={styles.emptyLog}>{t("chunkUpload.log.empty")}</div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className={styles.logEntry}>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {uploadResult && (
                <div className={`${styles.result} ${uploadResult.success ? styles.success : styles.error}`}>
                    <h3>{t("chunkUpload.result.title")}</h3>
                    <p>
                        <strong>{t("chunkUpload.result.status")}</strong>{" "}
                        {uploadResult.success ? t("chunkUpload.result.success") : t("chunkUpload.result.failure")}
                    </p>
                    {uploadResult.success && (
                        <p>
                            <strong>{t("chunkUpload.result.filePath")}</strong> {uploadResult.filePath}
                        </p>
                    )}
                    {uploadResult.uploadId && (
                        <p>
                            <strong>Upload ID:</strong> {uploadResult.uploadId}
                        </p>
                    )}
                    {uploadResult.error && (
                        <p>
                            <strong>{t("chunkUpload.result.errorMessage")}</strong> {uploadResult.error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChunkUploadTest;

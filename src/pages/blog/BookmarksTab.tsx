import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaFolder, FaBookmark, FaRegClock, FaRegEye, FaRegUser, FaTrash, FaCheck, FaRegBookmark } from "react-icons/fa";
import styles from "./BlogPage.module.css";
import bmStyles from "./Bookmarks.module.css";
import message from "@/components/message/Message";
import { getMockArticles, type BlogArticle } from "./MockBlog";

type FolderNameKey = "folders.all" | "folders.fe" | "folders.sec";

interface Folder {
    id: string;
    name: FolderNameKey;
    articleIds: string[];
}

const MOCK_FOLDERS: Folder[] = [
    { id: "all", name: "folders.all", articleIds: ["1", "2", "4", "5"] },
    { id: "fe", name: "folders.fe", articleIds: ["1", "4"] },
    { id: "sec", name: "folders.sec", articleIds: ["2", "7"] },
];

interface ReadLater extends BlogArticle {
    addedAt: string;
    read: boolean;
}

type Tab = "collections" | "readlater";

const BookmarksTab: React.FC = () => {
    const { t, i18n } = useTranslation("blog");
    const [tab, setTab] = useState<Tab>("collections");
    const [activeFolder, setActiveFolder] = useState("all");
    const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
    const [readLater, setReadLater] = useState<ReadLater[]>(() => {
        const mock = getMockArticles();
        return [
            { ...mock[2], addedAt: "2026-07-11", read: false },
            { ...mock[5], addedAt: "2026-07-09", read: false },
            { ...mock[7], addedAt: "2026-07-05", read: true },
        ];
    });

    const folderArticles = useMemo(() => {
        const f = folders.find((x) => x.id === activeFolder);
        if (!f) {
            return [];
        }
        return getMockArticles().filter((a) => f.articleIds.includes(a.id));
    }, [folders, activeFolder, i18n.language]);

    const removeFromFolder = (articleId: string) => {
        setFolders((prev) => prev.map((f) => ({ ...f, articleIds: f.articleIds.filter((id) => id !== articleId) })));
        message.success(t("message.removedFromFolder"));
    };

    const toggleRead = (id: string) => {
        setReadLater((prev) => prev.map((r) => (r.id === id ? { ...r, read: !r.read } : r)));
    };

    const removeReadLater = (id: string) => {
        setReadLater((prev) => prev.filter((r) => r.id !== id));
        message.success(t("message.removed"));
    };

    return (
        <div className={styles.tabWrap}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === "collections" ? styles.tabActive : ""}`}
                    onClick={() => setTab("collections")}
                >
                    <FaFolder style={{ marginRight: 6 }} /> {t("bookmarksTab")}
                </button>
                <button className={`${styles.tab} ${tab === "readlater" ? styles.tabActive : ""}`} onClick={() => setTab("readlater")}>
                    <FaBookmark style={{ marginRight: 6 }} /> {t("readLaterTab")}
                    <span className={styles.tabCount}>{readLater.filter((r) => !r.read).length}</span>
                </button>
            </div>

            {tab === "collections" && (
                <div className={bmStyles.layout}>
                    <aside className={bmStyles.folderList}>
                        {folders.map((f) => (
                            <button
                                key={f.id}
                                className={`${bmStyles.folderItem} ${activeFolder === f.id ? bmStyles.folderActive : ""}`}
                                onClick={() => setActiveFolder(f.id)}
                            >
                                <FaFolder />
                                <span className={bmStyles.folderName}>{t(f.name)}</span>
                                <span className={bmStyles.folderCount}>{f.articleIds.length}</span>
                            </button>
                        ))}
                    </aside>
                    <div className={styles.articleList}>
                        {folderArticles.map((a) => (
                            <div key={a.id} className={bmStyles.row}>
                                <div className={bmStyles.rowMain}>
                                    <h3 className={styles.articleTitle}>{a.title}</h3>
                                    <p className={styles.articleSummary}>{a.summary}</p>
                                    <div className={styles.articleMeta}>
                                        <span className={styles.metaItem}>
                                            <FaRegUser /> {a.author}
                                        </span>
                                        <span className={styles.metaItem}>{a.date}</span>
                                        <span className={styles.metaItem}>
                                            <FaRegEye /> {a.views}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className={bmStyles.iconBtn}
                                    title={t("removeFromFolder")}
                                    onClick={() => removeFromFolder(a.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {folderArticles.length === 0 && (
                            <div className={styles.empty}>
                                <div className={styles.emptyIcon}>
                                    <FaRegBookmark />
                                </div>
                                {t("emptyFolder")}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === "readlater" && (
                <div className={styles.articleList}>
                    {readLater.map((r) => (
                        <div key={r.id} className={`${bmStyles.row} ${r.read ? bmStyles.rowRead : ""}`}>
                            <div className={bmStyles.rowMain}>
                                <h3 className={styles.articleTitle}>{r.title}</h3>
                                <p className={styles.articleSummary}>{r.summary}</p>
                                <div className={styles.articleMeta}>
                                    <span className={styles.metaItem}>
                                        <FaRegClock /> {t("addedAt", { date: r.addedAt })}
                                    </span>
                                    {r.read && <span className={bmStyles.readTag}>{t("read")}</span>}
                                </div>
                            </div>
                            <div className={bmStyles.rowActions}>
                                <button
                                    className={`${bmStyles.iconBtn} ${r.read ? bmStyles.iconActive : ""}`}
                                    title={r.read ? t("markUnread") : t("markRead")}
                                    onClick={() => toggleRead(r.id)}
                                >
                                    <FaCheck />
                                </button>
                                <button className={bmStyles.iconBtn} title={t("remove")} onClick={() => removeReadLater(r.id)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                    {readLater.length === 0 && (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>
                                <FaBookmark />
                            </div>
                            {t("emptyReadLater")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookmarksTab;

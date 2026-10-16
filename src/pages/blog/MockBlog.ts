import i18n from "@/i18n";

export interface BlogArticle {
    id: string;
    title: string;
    summary: string;
    author: string;
    category: string;
    tags: string[];
    date: string;
    views: number;
    likes: number;
    cover?: string;
}

export const getMockArticles = (): BlogArticle[] => [
    {
        id: "1",
        title: i18n.t("blog:mock.a1.title"),
        summary: i18n.t("blog:mock.a1.summary"),
        author: i18n.t("blog:mock.a1.author"),
        category: i18n.t("blog:mock.a1.category"),
        tags: [i18n.t("blog:mock.a1.tags.t1"), i18n.t("blog:mock.a1.tags.t2")],
        date: "2026-07-10",
        views: 1284,
        likes: 96,
    },
    {
        id: "2",
        title: i18n.t("blog:mock.a2.title"),
        summary: i18n.t("blog:mock.a2.summary"),
        author: i18n.t("blog:mock.a2.author"),
        category: i18n.t("blog:mock.a2.category"),
        tags: [i18n.t("blog:mock.a2.tags.t1"), i18n.t("blog:mock.a2.tags.t2")],
        date: "2026-07-06",
        views: 987,
        likes: 143,
    },
    {
        id: "3",
        title: i18n.t("blog:mock.a3.title"),
        summary: i18n.t("blog:mock.a3.summary"),
        author: i18n.t("blog:mock.a3.author"),
        category: i18n.t("blog:mock.a3.category"),
        tags: [i18n.t("blog:mock.a3.tags.t1"), i18n.t("blog:mock.a3.tags.t2")],
        date: "2026-07-02",
        views: 642,
        likes: 51,
    },
    {
        id: "4",
        title: i18n.t("blog:mock.a4.title"),
        summary: i18n.t("blog:mock.a4.summary"),
        author: i18n.t("blog:mock.a4.author"),
        category: i18n.t("blog:mock.a4.category"),
        tags: [i18n.t("blog:mock.a4.tags.t1"), i18n.t("blog:mock.a4.tags.t2")],
        date: "2026-06-28",
        views: 733,
        likes: 62,
    },
    {
        id: "5",
        title: i18n.t("blog:mock.a5.title"),
        summary: i18n.t("blog:mock.a5.summary"),
        author: i18n.t("blog:mock.a5.author"),
        category: i18n.t("blog:mock.a5.category"),
        tags: [i18n.t("blog:mock.a5.tags.t1"), i18n.t("blog:mock.a5.tags.t2")],
        date: "2026-06-20",
        views: 1102,
        likes: 88,
    },
    {
        id: "6",
        title: i18n.t("blog:mock.a6.title"),
        summary: i18n.t("blog:mock.a6.summary"),
        author: i18n.t("blog:mock.a6.author"),
        category: i18n.t("blog:mock.a6.category"),
        tags: [i18n.t("blog:mock.a6.tags.t1"), i18n.t("blog:mock.a6.tags.t2")],
        date: "2026-05-30",
        views: 856,
        likes: 70,
    },
    {
        id: "7",
        title: i18n.t("blog:mock.a7.title"),
        summary: i18n.t("blog:mock.a7.summary"),
        author: i18n.t("blog:mock.a7.author"),
        category: i18n.t("blog:mock.a7.category"),
        tags: [i18n.t("blog:mock.a7.tags.t1"), i18n.t("blog:mock.a7.tags.t2")],
        date: "2026-05-18",
        views: 521,
        likes: 44,
    },
    {
        id: "8",
        title: i18n.t("blog:mock.a8.title"),
        summary: i18n.t("blog:mock.a8.summary"),
        author: i18n.t("blog:mock.a8.author"),
        category: i18n.t("blog:mock.a8.category"),
        tags: [i18n.t("blog:mock.a8.tags.t1"), i18n.t("blog:mock.a8.tags.t2")],
        date: "2026-04-25",
        views: 690,
        likes: 55,
    },
];

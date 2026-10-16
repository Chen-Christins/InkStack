const section = {
    folders: {
        articlesImages: { name: "文章图片" },
        userAvatars: { name: "用户头像" },
        videoAssets: { name: "视频素材" },
        documents: { name: "文档资料" },
        backups: { name: "备份文件" },
    },
    files: {
        reactLogo: {
            name: "react-logo.png",
            authorName: "管理员",
            description: "React官方标志图片",
            alt: "React Logo",
        },
        tutorialVideo: {
            name: "tutorial-video.mp4",
            authorName: "内容创作者",
            description: "React完整教程视频",
        },
        userAvatar: {
            name: "user-avatar-1.jpg",
            authorName: "张三",
            alt: "用户头像",
        },
        backgroundMusic: {
            name: "background-music.mp3",
            authorName: "管理员",
            description: "背景音乐文件",
        },
        projectDocumentation: {
            name: "project-documentation.pdf",
            authorName: "技术文档编写者",
            description: "项目API文档第二版",
        },
        websiteBackup: {
            name: "website-backup.zip",
            authorName: "管理员",
            description: "网站完整备份文件",
        },
        chartData: {
            name: "chart-data.xlsx",
            authorName: "数据分析师",
            description: "11月份数据报告表格",
        },
        codeSnippet: {
            name: "code-snippet.js",
            authorName: "前端开发",
            description: "常用工具函数代码片段",
        },
        presentation: {
            name: "presentation.pptx",
            authorName: "市场部",
            description: "公司介绍演示文稿",
        },
        productImage: {
            name: "product-image.jpg",
            authorName: "设计师",
            description: "产品展示横幅图片",
            alt: "产品横幅图片",
        },
        introVideo: {
            name: "intro-video.webm",
            authorName: "视频制作师",
            description: "网站开场动画视频",
        },
        iconSet: {
            name: "icon-set.svg",
            authorName: "UI设计师",
            description: "完整的UI图标集合SVG文件",
            alt: "UI图标集合",
        },
        podcastEpisode: {
            name: "podcast-episode.mp3",
            authorName: "播客主播",
            description: "技术播客第42期",
        },
        databaseBackup: {
            name: "database-backup.sql",
            authorName: "管理员",
            description: "生产数据库备份文件",
        },
        fontFamily: {
            name: "font-family.woff2",
            authorName: "字体设计师",
            description: "自定义字体文件",
        },
    },
} as const;

export default section;

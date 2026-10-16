const section = {
    title: "仪表盘",
    description: "欢迎回到管理后台！这里是您的数据中心，可以快速了解系统运行状况。",
    loading: "加载仪表盘中...",
    stats: {
        totalUsers: "总用户数",
        totalArticles: "文章总数",
        totalComments: "评论总数",
        todayActivity: "今日活动",
        newUsers: "新增用户",
        activityHint: "活动量 = 今日新增用户 + 文章 + 评论",
    },
    chart: {
        title: "活动趋势",
        subtitle: "（活动量 = 新增用户 + 文章 + 评论）",
        seriesName: "活动量",
        tooltipNote: "（新增用户 + 文章 + 评论）",
        activityHint: "活动量 = 新增用户 + 文章 + 评论",
        summary: {
            total: "总活动量",
            avg: "日均活动量",
            peak: "峰值",
            peakHint: "活动量峰值",
        },
    },
    range: {
        days7: "7天",
        days30: "30天",
        days90: "90天",
    },
    quickActions: {
        title: "快速操作",
        createArticle: {
            title: "创建文章",
            description: "撰写新的博客文章",
        },
        addUser: {
            title: "添加用户",
            description: "邀请新用户加入",
        },
        systemSettings: {
            title: "系统设置",
            description: "配置系统参数",
        },
        viewAnalytics: {
            title: "查看统计",
            description: "查看详细数据分析",
        },
    },
    recentActivity: {
        title: "最近活动",
    },
    recentUsers: {
        title: "最近用户",
    },
} as const;

export default section;

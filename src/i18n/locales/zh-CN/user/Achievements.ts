const section = {
    loading: "加载中...",
    messages: {
        loadFailed: "加载成就数据失败",
    },
    stats: {
        totalContributions: "总贡献",
        publishedArticles: "已发布文章",
        totalLikes: "获得点赞",
        unlockedBadges: "解锁徽章",
    },
    heatmap: {
        title: "贡献热力图",
        desc: "过去一年共 {{total}} 次贡献",
        level: "贡献等级 {{level}}",
        less: "少",
        more: "多",
    },
    months: {
        jan: "1月",
        feb: "2月",
        mar: "3月",
        apr: "4月",
        may: "5月",
        jun: "6月",
        jul: "7月",
        aug: "8月",
        sep: "9月",
        oct: "10月",
        nov: "11月",
        dec: "12月",
    },
    weekdays: {
        mon: "一",
        wed: "三",
        fri: "五",
    },
    badges: {
        title: "荣誉徽章",
        unlocked: "已解锁",
    },
} as const;

export default section;

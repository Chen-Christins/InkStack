const section = {
    authRequired: "您需要登录后才能查看和管理您的作业列表。",
    pageTitle: "我的任务",
    loadFailed: "加载失败",
    fetchFailed: "获取作业列表失败",
    backToList: "返回作业列表",
    deadline: "{{value}} 截止",
    viewSubmissions: "查看提交详情",
    viewDetails: "查看详情",
    goSubmit: "去提交",
    filter: {
        all: "全部",
        open: "开启中",
        closed: "已关闭",
    },
    status: {
        open: "开启中",
        closed: "已关闭",
    },
    empty: {
        title: "暂无作业",
        subtext: "当前筛选条件下没有找到相关作业",
    },
} as const;

export default section;

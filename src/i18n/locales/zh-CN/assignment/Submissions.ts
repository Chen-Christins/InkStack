const section = {
    authRequired: "您需要登录后才能查看作业提交详情。",
    back: "返回上一页",
    loadFailed: "加载失败",
    backToList: "返回作业列表",
    assignmentNotFound: "未找到该作业",
    description: "作业描述",
    submissionsTitle: "提交详情",
    deadline: "截止 {{value}}",
    submittedCount: "{{value}} 人提交",
    score: "{{value}} 分",
    empty: {
        title: "暂无提交",
        subtext: "还没有学生提交作业",
    },
    status: {
        late: "迟交",
        submitted: "已提交",
        pending: "未提交",
    },
    fileCount: "{{value}} 个文件",
    totalSize: "总大小:",
    fileList: "文件列表 ({{value}})",
    fileFeedback: "文件评语",
    teacherFeedback: "教师评语",
    download: "下载",
    downloading: "下载中...",
    downloadAll: "打包下载",
    packaging: "打包中...",
    expand: "展开",
    collapse: "收起",
    prevPage: "上一页",
    nextPage: "下一页",
    errors: {
        idRequired: "作业ID不能为空",
        fetchFailed: "获取数据失败",
    },
    messages: {
        downloadFailed: "下载失败",
        downloadAllFailed: "打包下载失败",
    },
} as const;

export default section;

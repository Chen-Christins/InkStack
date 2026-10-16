const section = {
    authRequired: "您需要登录后才能查看作业详情和提交作业。",
    messages: {
        idRequired: "作业ID不能为空",
        fetchFailed: "获取作业详情失败",
        fileSizeExceeded: "文件 {{name}} 超过大小限制 ({{max}}MB)",
        fileTypeUnsupported: "文件 {{name}} 格式不支持，仅支持 {{types}}",
        noFile: "请至少上传一个文件",
        assignmentMissing: "作业信息获取失败，请刷新页面重试",
        submitSuccess: "作业提交成功！",
        submitFailed: "提交失败，请重试",
    },
    priority: {
        urgent: "紧急",
        high: "高优先级",
        medium: "中优先级",
        low: "低优先级",
    },
    status: {
        open: "开启中",
        closed: "已关闭",
        pending: "进行中",
    },
    errorState: {
        title: "加载失败",
        notFound: "未找到该作业",
        backAction: "返回作业列表",
    },
    header: {
        back: "返回上一页",
    },
    detail: {
        title: "任务详情",
        deadline: "截止时间",
        priority: "优先级",
        sizeLimit: "文件大小限制",
        fileTypes: "允许文件格式",
    },
    submitSection: {
        title: "任务提交",
    },
    upload: {
        openTitle: "点击或拖拽文件到此处上传",
        closedTitle: "任务已关闭，无法上传文件",
        openDesc: "支持 {{types}} 格式文件",
        closedDesc: "请联系管理员重新开启作业提交",
        limit: "单个文件不超过 {{size}}MB",
    },
    file: {
        remove: "移除文件",
    },
    actions: {
        cancel: "取消",
        uploading: "上传中...{{progress}}%",
        submitting: "提交中...",
        closed: "作业已关闭",
        confirm: "确认提交",
    },
} as const;

export default section;

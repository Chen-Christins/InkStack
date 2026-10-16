const section = {
    title: "我的文章",
    newArticle: "新建文章",
    searchPlaceholder: "搜索文章标题、摘要或分类...",
    status: {
        all: "全部状态",
        label: "状态",
    },
    type: {
        original: "原创",
        reprint: "转载",
    },
    untitled: "无标题",
    notPublished: "暂未发布",
    uncategorized: "未分类",
    table: {
        headers: {
            title: "标题",
            category: "分类",
            status: "状态",
            data: "数据",
            publishTime: "发布时间",
            actions: "操作",
        },
    },
    loading: "加载中...",
    empty: "暂无数据",
    action: {
        view: "查看",
        edit: "编辑",
        withdrawReview: "撤回审核",
        setPrivate: "设为私密",
        publish: "发布文章",
        resubmit: "重新提交",
        delete: "删除",
    },
    delete: {
        title: "确认删除",
        content: "确定要删除这篇文章吗？删除后无法恢复。",
        confirm: "删除",
        cancel: "取消",
        success: "文章删除成功",
        failed: "删除文章失败，请重试",
    },
    message: {
        publishSuccessPrefix: "文章「",
        publishSuccessSuffix: "」发布成功，等待管理员审核",
        setPrivateSuccess: "文章已设为私密",
        toggleFailed: "切换文章状态失败，请重试",
    },
    pagination: {
        info: "显示 {{start}} - {{end}} 条， 共 {{total}} 篇文章",
        first: "首页",
        prev: "上一页",
        next: "下一页",
        last: "末页",
    },
} as const;

export default section;

const section = {
    title: "帮助中心",
    desc: "查找常见问题，或向我们反馈",
    searchPlaceholder: "搜索问题，如“如何发布文章”",
    categoryCount: "{{value}} 个问题",
    categories: {
        gettingStarted: "入门",
        accountSecurity: "账户安全",
        organization: "组织协作",
        devPlatform: "研发平台",
    },
    auth: {
        loading: "验证登录状态...",
        title: "请先登录",
        subtext: "您需要登录后才能查看帮助中心。",
        login: "立即登录",
        back: "返回上一页",
    },
    faq: {
        title: "常见问题",
        loading: "加载中...",
        notFound: "未找到相关问题",
        empty: "暂无常见问题",
        emptyHint: "试试其他关键词，或提交反馈告诉我们",
    },
    feedback: {
        title: "提交反馈",
        desc: "没找到答案？把问题告诉我们",
        type: "反馈类型",
        content: "详细描述",
        contentPlaceholder: "请描述你遇到的问题或建议...",
        contact: "联系方式（选填）",
        contactPlaceholder: "邮箱或其他联系方式",
        submit: "提交反馈",
        success: "反馈已提交，感谢你的建议！",
        types: {
            bug: "问题反馈",
            feature: "功能建议",
            other: "其他",
        },
    },
    messages: {
        loadFaqFailed: "加载常见问题失败",
        contentRequired: "请填写反馈内容",
        submitFailed: "提交失败，请稍后再试",
        networkFailed: "提交失败，请检查网络",
    },
} as const;

export default section;

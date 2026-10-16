const common = {
    language: {
        label: "语言",
        placeholder: "选择语言",
    },
    actions: {
        confirm: "确认",
        cancel: "取消",
        save: "保存",
        edit: "编辑",
        delete: "删除",
        search: "搜索",
        close: "关闭",
        back: "返回",
        retry: "重试",
        loading: "加载中...",
        noData: "暂无数据",
    },
    user: {
        fallbackName: "用户",
    },
    theme: {
        toDark: "切换到暗色主题",
        toLight: "切换到浅色主题",
    },
    footer: {
        rights: "版权所有。",
    },
    time: {
        justNow: "刚刚",
        minutesAgo: "{{value}} 分钟前",
        hoursAgo: "{{value}} 小时前",
        daysAgo: "{{value}} 天前",
        monthsAgo: "{{value}} 个月前",
        yearsAgo: "{{value}} 年前",
    },
    errors: {
        unknown: "未知错误",
    },
    unknown: "未知",
} as const;

export default common;

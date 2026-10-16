const section = {
    authRequired: "您需要登录后才能查看和管理组织列表。",
    title: "组织列表",
    applyCreate: "申请创建组织",
    fetchFailed: "获取组织列表失败",
    filter: {
        all: "全部",
        active: "正常",
        inactive: "停用",
    },
    status: {
        active: "正常",
        inactive: "停用",
    },
    memberCount: "{{value}} 成员",
    rd: "研发",
    viewDetail: "查看详情",
    empty: {
        title: "暂无组织",
        subtitle: "当前筛选条件下没有找到相关组织",
    },
} as const;

export default section;

const section = {
    fetchFailed: "获取仓库列表失败",
    empty: "暂无仓库",
    deleteConfirm: {
        title: "确认删除",
        before: '确定要删除仓库 "',
        after: '" 吗？删除后无法恢复。',
        confirm: "删除",
        cancel: "取消",
    },
    deleteSuccess: "仓库已删除",
    deleteFailed: "删除仓库失败",
    deleteTitle: "删除仓库",
    tokenRequired: "请输入 GitHub Token",
    tokenSaved: "Token 已保存",
    saveFailed: "保存失败",
    syncFailed: "同步失败",
    tokenConfigured: "已配置 Token",
    tokenNotConfigured: "未配置 Token，点击配置",
    syncStatus: {
        idle: "未同步",
        syncing: "同步中...",
        success: "已同步",
        failed: "同步失败",
    },
    tokenModal: {
        title: "配置 Token",
        titleWithRepo: "配置 Token - {{name}}",
        overwriteHint: "该仓库已配置 Token，输入新值将覆盖旧值。",
        hint: "为该仓库配置 GitHub Personal Access Token，用于拉取仓库元数据（Star 数、描述、语言等）。",
        cancel: "取消",
        save: "保存",
        saving: "保存中...",
    },
} as const;

export default section;

const section = {
    hero: {
        title: "每一次执行，都清晰可控。",
        description: "分开观察 Runner 执行权限与产品写提案，在真实写入前完成服务端审批，并保留可回放的生命周期轨迹。",
        modeAria: "选择 Agent 运行模式",
        modeLabel: "运行模式",
        modeMock: "本地演示",
        modeGateway: "Gateway 联调",
        apiConfig: "API 配置",
    },
    panel: {
        ariaLabel: "Agent 会话运行面板",
    },
    session: {
        title: "工单协作会话",
        sidPlaceholder: "正在创建会话…",
        restart: "重新运行",
    },
    context: {
        ariaLabel: "会话概况",
        driverLabel: "运行驱动",
        eventCount: "事件数量",
        lastUpdated: "最后更新",
        waiting: "等待中",
    },
    stream: {
        ariaLabel: "会话事件流",
        gatewayLoading: "Gateway 正在返回事件…",
        localLoading: "本地引擎正在输出…",
    },
    footer: {
        gatewayNote: "Gateway 验证模式：BFF/开发代理注入管理凭据与可信 actor；浏览器不持有 token。",
        localNote: "演示模式：分别模拟 Runner 权限和产品 proposal，不会对真实工单写入。追加 ?driver=gateway 可切换本机 Gateway。",
    },
    message: {
        approvedToolCall: "已批准工具调用，会话继续执行",
        rejectedToolCall: "已拒绝工具调用，会话即将取消",
        proposalApproved: "产品写提案已批准，等待 MCP worker 重新校验并应用",
        proposalRejected: "产品写提案已拒绝，工单状态不会改变",
        proposalFailed: "产品写提案审批失败，请查看事件流中的错误信息",
    },
    event: {
        toolCall: "工具调用",
        toolSuccess: "工具执行成功",
        toolFailed: "工具执行失败",
    },
    permission: {
        eyebrow: "Runner 执行权限",
        question: "是否允许引擎发起工具调用",
        hint: "这里只控制 runner 执行权限；产品数据写入仍需经过下方独立的产品提案审批。",
        approvedGateway: "已批准 · Gateway 会话继续",
        approvedLocal: "已批准 · 本地会话继续",
        rejected: "已拒绝 Runner 权限 · 会话已取消",
        allow: "允许 Runner 调用",
        deny: "拒绝 Runner 调用",
    },
    proposal: {
        eyebrow: "产品写提案 · 服务端权威",
        expires: "到期 {{time}}",
        approve: "批准产品写入",
        reject: "拒绝产品写入",
        hint: "批准只推进 proposal；实际写入仍由 MCP worker 重新读取域状态、校验状态机并幂等执行。",
    },
    status: {
        transition: "状态迁移 → {{status}}",
    },
    config: {
        title: "Agent API 配置",
        noticeTitle: "密钥由站点后端保存",
        noticeBody:
            "这里复用个人 AI 接口配置，不写入浏览器存储。部署启用用户配置解析后，Gateway 会按当前用户在服务端注入隔离的运行凭据；浏览器不会获得供应商密钥或 Gateway 管理令牌。",
    },
} as const;

export default section;

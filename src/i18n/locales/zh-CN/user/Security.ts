const section = {
    options: {
        title: "安全选项",
        twoFactor: {
            name: "两步验证（2FA）",
            hint: "登录时需额外输入动态验证码，大幅提升账户安全",
            enabled: "已开启两步验证（演示）",
            disabled: "已关闭两步验证",
        },
        loginAlert: {
            name: "异地登录提醒",
            hint: "检测到新设备或异地登录时通过站内信提醒",
        },
    },
    devices: {
        title: "登录设备",
        count: "当前共有 {{total}} 台设备登录",
        loading: "正在加载设备列表...",
        errorTitle: "设备列表加载失败",
        reload: "重新加载",
        empty: "暂无其他设备登录",
        current: "当前设备",
        loginAt: "登录于 {{loginTime}} · 最近活跃 {{activeTime}}",
        revoking: "下线中...",
        revoke: "下线",
    },
    unknownDevice: "未知设备",
    revoke: {
        title: "下线设备",
        contentPrefix: '确定要将 "',
        contentSuffix: '" 强制下线吗？',
        confirm: "下线",
        cancel: "取消",
    },
    messages: {
        devicesFetchFailed: "设备列表获取失败",
        revokeSuccess: "设备已下线",
        revokeFailed: "设备下线失败",
    },
} as const;

export default section;

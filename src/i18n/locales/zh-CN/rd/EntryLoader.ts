const section = {
    title: "正在进入研发平台",
    stages: {
        auth: "初始化",
        access: "权限校验",
        org: "组织加载",
    },
    descriptions: {
        auth: "正在确认登录状态，请稍候…",
        access: "正在校验研发平台访问权限…",
        org: "正在加载组织与角色信息…",
    },
} as const;

export default section;

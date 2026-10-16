const section = {
    panelTitle: "主题风格",
    collapseButton: {
        expand: "展开主题列表",
        collapse: "收起主题列表",
    },
    presets: {
        time: {
            name: "时代周刊",
            desc: "纸刊衬线风",
        },
        monochrome: {
            name: "极简黑白",
            desc: "黑白高级风",
        },
        mint: {
            name: "护眼豆绿",
            desc: "柔和护眼",
        },
        ocean: {
            name: "海洋蓝",
            desc: "蓝白清新",
        },
        sakura: {
            name: "樱花粉",
            desc: "粉白少女感",
        },
        cyberpunk: {
            name: "赛博朋克",
            desc: "霓虹科技感",
        },
        gold: {
            name: "暗金奢华",
            desc: "黑金低调",
        },
        lavender: {
            name: "薰衣草紫",
            desc: "紫白柔和",
        },
        pi: {
            name: "Pi 极客",
            desc: "纸格终端风",
        },
    },
    cursor: {
        label: "主题鼠标",
        hint: "跟随当前主题切换鼠标样式",
        ariaLabel: "使用主题鼠标样式",
    },
} as const;

export default section;

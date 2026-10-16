const error = {
    notFound: {
        title: "哎呀，页面迷路了！",
        descriptionLine1: "你访问的页面不在地球上，可能被外星人带走了。",
        descriptionLine2: "别担心，带你回家！",
        backHome: "返回首页",
    },
    maintenance: {
        title: "系统维护中",
        description: "站点正在维护，暂时无法访问。请稍后再来。",
    },
} as const;

export default error;

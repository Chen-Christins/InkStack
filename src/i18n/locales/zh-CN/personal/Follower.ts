const section = {
    title: "我的粉丝",
    peopleCount: "{{value}} 人",
    loading: "加载中...",
    empty: "暂无粉丝",
    joinedAt: "@{{account}} · {{date}} 加入",
    followingCount: "{{value}} 关注",
    followerCount: "{{value}} 粉丝",
    paginationInfo: "显示 {{start}} - {{end}} 条，共 {{total}} 条",
    firstPage: "首页",
    prevPage: "上一页",
    nextPage: "下一页",
    lastPage: "末页",
} as const;

export default section;

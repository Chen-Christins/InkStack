const blog = {
    bookmarksTab: "收藏夹",
    readLaterTab: "稍后读",
    emptyFolder: "该收藏夹暂无文章",
    emptyReadLater: "稍后读列表为空",
    removeFromFolder: "移出收藏夹",
    addedAt: "加入于 {{date}}",
    read: "已读",
    markUnread: "标记未读",
    markRead: "标记已读",
    remove: "移除",
    folders: {
        all: "全部收藏",
        fe: "前端进阶",
        sec: "安全",
    },
    message: {
        removedFromFolder: "已移出收藏夹",
        removed: "已移除",
    },
    mock: {
        a1: {
            title: "深入理解 React 19 的并发渲染",
            summary: "从 useTransition 到 Suspense，剖析并发特性如何提升交互流畅度与感知性能。",
            author: "陈明",
            category: "前端",
            tags: {
                t1: "React",
                t2: "性能",
            },
        },
        a2: {
            title: "内存态 Token 认证：告别 localStorage",
            summary: "为什么敏感数据不该落地浏览器存储，以及如何用内存 + HttpOnly Cookie 构建安全认证。",
            author: "林悦",
            category: "安全",
            tags: {
                t1: "认证",
                t2: "安全",
            },
        },
        a3: {
            title: "用 echarts 打造研发燃尽图",
            summary: "从数据建模到图表配置，手把手实现 Sprint 燃尽可视化。",
            author: "王磊",
            category: "可视化",
            tags: {
                t1: "echarts",
                t2: "研发",
            },
        },
        a4: {
            title: "CSS Modules 与主题变量最佳实践",
            summary: "如何用 data-theme 驱动明暗主题，并保持组件样式隔离。",
            author: "赵天",
            category: "前端",
            tags: {
                t1: "CSS",
                t2: "样式",
            },
        },
        a5: {
            title: "WebSocket 实时通知的重连与心跳",
            summary: "单例连接、指数退避重连与生命周期绑定的完整方案。",
            author: "陈明",
            category: "后端",
            tags: {
                t1: "WebSocket",
                t2: "实时",
            },
        },
        a6: {
            title: "Vite 8 构建优化实战",
            summary: "代码分割、依赖预构建与产物瘦身，让首屏更快。",
            author: "林悦",
            category: "工程化",
            tags: {
                t1: "Vite",
                t2: "性能",
            },
        },
        a7: {
            title: "Markdown 渲染中的 XSS 防护",
            summary: "rehype-sanitize 与自定义组件如何兼顾富文本与安全。",
            author: "赵天",
            category: "安全",
            tags: {
                t1: "Markdown",
                t2: "安全",
            },
        },
        a8: {
            title: "从零搭建组织协作模块",
            summary: "成员、角色、权限与申请流程的前端设计。",
            author: "王磊",
            category: "产品",
            tags: {
                t1: "协作",
                t2: "权限",
            },
        },
    },
} as const;

export default blog;

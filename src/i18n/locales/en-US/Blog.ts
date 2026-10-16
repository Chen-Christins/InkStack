const blog = {
    bookmarksTab: "Bookmarks",
    readLaterTab: "Read Later",
    emptyFolder: "No articles in this folder",
    emptyReadLater: "Your read later list is empty",
    removeFromFolder: "Remove from folder",
    addedAt: "Added {{date}}",
    read: "Read",
    markUnread: "Mark as unread",
    markRead: "Mark as read",
    remove: "Remove",
    folders: {
        all: "All Bookmarks",
        fe: "Frontend Advanced",
        sec: "Security",
    },
    message: {
        removedFromFolder: "Removed from folder",
        removed: "Removed",
    },
    mock: {
        a1: {
            title: "Deep Dive into React 19 Concurrent Rendering",
            summary:
                "From useTransition to Suspense, analyzing how concurrent features improve interaction smoothness and perceived performance.",
            author: "Chen Ming",
            category: "Frontend",
            tags: {
                t1: "React",
                t2: "Performance",
            },
        },
        a2: {
            title: "In-Memory Token Authentication: Farewell to localStorage",
            summary:
                "Why sensitive data should not persist in browser storage, and how to build secure authentication with memory plus HttpOnly Cookies.",
            author: "Lin Yue",
            category: "Security",
            tags: {
                t1: "Authentication",
                t2: "Security",
            },
        },
        a3: {
            title: "Building a Development Burndown Chart with echarts",
            summary: "From data modeling to chart configuration, a hands-on guide to visualizing Sprint burndown.",
            author: "Wang Lei",
            category: "Visualization",
            tags: {
                t1: "echarts",
                t2: "Development",
            },
        },
        a4: {
            title: "Best Practices for CSS Modules and Theme Variables",
            summary: "How to drive light and dark themes with data-theme while keeping component styles isolated.",
            author: "Zhao Tian",
            category: "Frontend",
            tags: {
                t1: "CSS",
                t2: "Styling",
            },
        },
        a5: {
            title: "Reconnection and Heartbeat for WebSocket Real-Time Notifications",
            summary: "A complete solution for singleton connections, exponential backoff reconnection, and lifecycle binding.",
            author: "Chen Ming",
            category: "Backend",
            tags: {
                t1: "WebSocket",
                t2: "Real-Time",
            },
        },
        a6: {
            title: "Hands-On Vite 8 Build Optimization",
            summary: "Code splitting, dependency pre-bundling, and bundle slimming to make the first screen faster.",
            author: "Lin Yue",
            category: "Engineering",
            tags: {
                t1: "Vite",
                t2: "Performance",
            },
        },
        a7: {
            title: "XSS Protection in Markdown Rendering",
            summary: "How rehype-sanitize and custom components balance rich text with security.",
            author: "Zhao Tian",
            category: "Security",
            tags: {
                t1: "Markdown",
                t2: "Security",
            },
        },
        a8: {
            title: "Building an Organization Collaboration Module from Scratch",
            summary: "Frontend design for members, roles, permissions, and the application workflow.",
            author: "Wang Lei",
            category: "Product",
            tags: {
                t1: "Collaboration",
                t2: "Permissions",
            },
        },
    },
} as const;

export default blog;

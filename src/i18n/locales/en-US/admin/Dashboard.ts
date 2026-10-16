const section = {
    title: "Dashboard",
    description:
        "Welcome back to the admin console! This is your data center where you can quickly review how the system is performing.",
    loading: "Loading dashboard...",
    stats: {
        totalUsers: "Total Users",
        totalArticles: "Total Articles",
        totalComments: "Total Comments",
        todayActivity: "Today's Activity",
        newUsers: "New Users",
        activityHint: "Activity = New users today + Articles + Comments",
    },
    chart: {
        title: "Activity Trend",
        subtitle: "(Activity = New users + Articles + Comments)",
        seriesName: "Activity",
        tooltipNote: "(New users + Articles + Comments)",
        activityHint: "Activity = New users + Articles + Comments",
        summary: {
            total: "Total Activity",
            avg: "Daily Average Activity",
            peak: "Peak",
            peakHint: "Peak Activity",
        },
    },
    range: {
        days7: "7 days",
        days30: "30 days",
        days90: "90 days",
    },
    quickActions: {
        title: "Quick Actions",
        createArticle: {
            title: "Create Article",
            description: "Write a new blog post",
        },
        addUser: {
            title: "Add User",
            description: "Invite new users to join",
        },
        systemSettings: {
            title: "System Settings",
            description: "Configure system parameters",
        },
        viewAnalytics: {
            title: "View Analytics",
            description: "View detailed data analysis",
        },
    },
    recentActivity: {
        title: "Recent Activity",
    },
    recentUsers: {
        title: "Recent Users",
    },
} as const;

export default section;

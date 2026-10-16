const section = {
    loading: "Loading...",
    messages: {
        loadFailed: "Failed to load achievements data",
    },
    stats: {
        totalContributions: "Total Contributions",
        publishedArticles: "Published Articles",
        totalLikes: "Likes Received",
        unlockedBadges: "Badges Unlocked",
    },
    heatmap: {
        title: "Contribution Heatmap",
        desc: "{{total}} contributions in the past year",
        level: "Contribution level {{level}}",
        less: "Less",
        more: "More",
    },
    months: {
        jan: "Jan",
        feb: "Feb",
        mar: "Mar",
        apr: "Apr",
        may: "May",
        jun: "Jun",
        jul: "Jul",
        aug: "Aug",
        sep: "Sep",
        oct: "Oct",
        nov: "Nov",
        dec: "Dec",
    },
    weekdays: {
        mon: "Mon",
        wed: "Wed",
        fri: "Fri",
    },
    badges: {
        title: "Honor Badges",
        unlocked: "Unlocked",
    },
} as const;

export default section;

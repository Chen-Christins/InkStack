const common = {
    language: {
        label: "Language",
        placeholder: "Select language",
    },
    actions: {
        confirm: "Confirm",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        close: "Close",
        back: "Back",
        retry: "Retry",
        loading: "Loading...",
        noData: "No data",
    },
    user: {
        fallbackName: "User",
    },
    theme: {
        toDark: "Switch to dark theme",
        toLight: "Switch to light theme",
    },
    footer: {
        rights: "All rights reserved.",
    },
    time: {
        justNow: "Just now",
        minutesAgo: "{{value}} min ago",
        hoursAgo: "{{value}} h ago",
        daysAgo: "{{value}} d ago",
        monthsAgo: "{{value}} mo ago",
        yearsAgo: "{{value}} y ago",
    },
    errors: {
        unknown: "Unknown error",
    },
    unknown: "Unknown",
} as const;

export default common;

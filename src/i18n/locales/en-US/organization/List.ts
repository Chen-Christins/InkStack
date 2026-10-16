const section = {
    authRequired: "You need to sign in to view and manage organizations.",
    title: "Organizations",
    applyCreate: "Apply to Create",
    fetchFailed: "Failed to load organizations",
    filter: {
        all: "All",
        active: "Active",
        inactive: "Inactive",
    },
    status: {
        active: "Active",
        inactive: "Inactive",
    },
    memberCount: "{{value}} members",
    rd: "R&D",
    viewDetail: "View Details",
    empty: {
        title: "No organizations",
        subtitle: "No organizations match the current filter.",
    },
} as const;

export default section;

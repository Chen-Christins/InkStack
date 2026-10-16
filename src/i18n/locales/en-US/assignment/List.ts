const section = {
    authRequired: "You need to sign in to view and manage your assignment list.",
    pageTitle: "My Tasks",
    loadFailed: "Failed to load",
    fetchFailed: "Failed to fetch assignment list",
    backToList: "Back to assignment list",
    deadline: "Due {{value}}",
    viewSubmissions: "View submission details",
    viewDetails: "View Details",
    goSubmit: "Submit",
    filter: {
        all: "All",
        open: "Open",
        closed: "Closed",
    },
    status: {
        open: "Open",
        closed: "Closed",
    },
    empty: {
        title: "No assignments",
        subtext: "No assignments found under the current filter",
    },
} as const;

export default section;

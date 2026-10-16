const section = {
    title: "My Articles",
    newArticle: "New Article",
    searchPlaceholder: "Search by title, summary or category...",
    status: {
        all: "All Status",
        label: "Status",
    },
    type: {
        original: "Original",
        reprint: "Repost",
    },
    untitled: "Untitled",
    notPublished: "Not published",
    uncategorized: "Uncategorized",
    table: {
        headers: {
            title: "Title",
            category: "Category",
            status: "Status",
            data: "Stats",
            publishTime: "Published At",
            actions: "Actions",
        },
    },
    loading: "Loading...",
    empty: "No data",
    action: {
        view: "View",
        edit: "Edit",
        withdrawReview: "Withdraw Review",
        setPrivate: "Set Private",
        publish: "Publish",
        resubmit: "Resubmit",
        delete: "Delete",
    },
    delete: {
        title: "Confirm Delete",
        content: "Are you sure you want to delete this article? This cannot be undone.",
        confirm: "Delete",
        cancel: "Cancel",
        success: "Article deleted successfully",
        failed: "Failed to delete article, please try again",
    },
    message: {
        publishSuccessPrefix: 'Article "',
        publishSuccessSuffix: '" published successfully, awaiting admin review',
        setPrivateSuccess: "Article set to private",
        toggleFailed: "Failed to change article status, please try again",
    },
    pagination: {
        info: "Showing {{start}} - {{end}} of {{total}} articles",
        first: "First",
        prev: "Previous",
        next: "Next",
        last: "Last",
    },
} as const;

export default section;

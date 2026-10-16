const section = {
    fetchFailed: "Failed to load repositories",
    empty: "No repositories",
    deleteConfirm: {
        title: "Confirm Delete",
        before: 'Are you sure you want to delete the repository "',
        after: '"? This action cannot be undone.',
        confirm: "Delete",
        cancel: "Cancel",
    },
    deleteSuccess: "Repository deleted",
    deleteFailed: "Failed to delete repository",
    deleteTitle: "Delete repository",
    tokenRequired: "Please enter a GitHub Token",
    tokenSaved: "Token saved",
    saveFailed: "Failed to save",
    syncFailed: "Sync failed",
    tokenConfigured: "Token configured",
    tokenNotConfigured: "No token configured, click to configure",
    syncStatus: {
        idle: "Not synced",
        syncing: "Syncing...",
        success: "Synced",
        failed: "Sync failed",
    },
    tokenModal: {
        title: "Configure Token",
        titleWithRepo: "Configure Token - {{name}}",
        overwriteHint: "This repository already has a token configured. Entering a new value will overwrite the old one.",
        hint: "Configure a GitHub Personal Access Token for this repository to fetch repository metadata (stars, description, language, etc.).",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving...",
    },
} as const;

export default section;

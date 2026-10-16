const section = {
    authRequired: "You need to sign in to view the assignment submissions.",
    back: "Back to previous page",
    loadFailed: "Failed to load",
    backToList: "Back to assignment list",
    assignmentNotFound: "Assignment not found",
    description: "Assignment Description",
    submissionsTitle: "Submissions",
    deadline: "Due {{value}}",
    submittedCount: "{{value}} submitted",
    score: "{{value}} pts",
    empty: {
        title: "No submissions yet",
        subtext: "No students have submitted the assignment yet",
    },
    status: {
        late: "Late",
        submitted: "Submitted",
        pending: "Not Submitted",
    },
    fileCount: "{{value}} files",
    totalSize: "Total size:",
    fileList: "File List ({{value}})",
    fileFeedback: "File Feedback",
    teacherFeedback: "Teacher Feedback",
    download: "Download",
    downloading: "Downloading...",
    downloadAll: "Download All",
    packaging: "Packaging...",
    expand: "Expand",
    collapse: "Collapse",
    prevPage: "Previous",
    nextPage: "Next",
    errors: {
        idRequired: "Assignment ID cannot be empty",
        fetchFailed: "Failed to fetch data",
    },
    messages: {
        downloadFailed: "Download failed",
        downloadAllFailed: "Packaged download failed",
    },
} as const;

export default section;

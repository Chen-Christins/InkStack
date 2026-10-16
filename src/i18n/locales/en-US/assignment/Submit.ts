const section = {
    authRequired: "You need to sign in to view assignment details and submit.",
    messages: {
        idRequired: "Assignment ID cannot be empty",
        fetchFailed: "Failed to load assignment details",
        fileSizeExceeded: "File {{name}} exceeds the size limit ({{max}}MB)",
        fileTypeUnsupported: "File {{name}} has an unsupported format; only {{types}} are allowed",
        noFile: "Please upload at least one file",
        assignmentMissing: "Failed to load assignment information, please refresh and try again",
        submitSuccess: "Assignment submitted successfully!",
        submitFailed: "Submission failed, please try again",
    },
    priority: {
        urgent: "Urgent",
        high: "High priority",
        medium: "Medium priority",
        low: "Low priority",
    },
    status: {
        open: "Open",
        closed: "Closed",
        pending: "In progress",
    },
    errorState: {
        title: "Failed to load",
        notFound: "Assignment not found",
        backAction: "Back to assignments",
    },
    header: {
        back: "Go back",
    },
    detail: {
        title: "Task details",
        deadline: "Deadline",
        priority: "Priority",
        sizeLimit: "File size limit",
        fileTypes: "Allowed formats",
    },
    submitSection: {
        title: "Submit task",
    },
    upload: {
        openTitle: "Click or drag a file here to upload",
        closedTitle: "Task is closed, upload is not available",
        openDesc: "Supports {{types}} files",
        closedDesc: "Please contact the administrator to reopen submission",
        limit: "Single file must not exceed {{size}}MB",
    },
    file: {
        remove: "Remove file",
    },
    actions: {
        cancel: "Cancel",
        uploading: "Uploading...{{progress}}%",
        submitting: "Submitting...",
        closed: "Assignment closed",
        confirm: "Confirm submission",
    },
} as const;

export default section;

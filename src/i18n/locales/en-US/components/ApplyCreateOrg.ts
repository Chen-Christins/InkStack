const section = {
    message: {
        nameTypeRequired: "Please fill in the organization name and type",
        submitSuccess: "Application submitted, please wait for administrator review",
        submitFailed: "Submission failed, please try again",
    },
    title: "Apply to Create Organization",
    hint: "After submitting, an administrator will review your organization creation request. Once approved, you will automatically become the administrator of this organization.",
    nameLabel: "Organization Name *",
    namePlaceholder: "Enter organization name",
    typeLabel: "Organization Type *",
    typePlaceholder: "e.g. R&D Team, Design Team, Operations Team",
    descriptionLabel: "Organization Description",
    descriptionPlaceholder: "Briefly describe the organization's goals and direction...",
    cancel: "Cancel",
    submit: "Submit Application",
    submitting: "Submitting...",
} as const;

export default section;

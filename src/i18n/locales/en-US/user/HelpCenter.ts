const section = {
    title: "Help Center",
    desc: "Find answers to common questions, or send us feedback",
    searchPlaceholder: 'Search questions, e.g. "How to publish an article"',
    categoryCount: "{{value}} questions",
    categories: {
        gettingStarted: "Getting Started",
        accountSecurity: "Account Security",
        organization: "Organization",
        devPlatform: "Development Platform",
    },
    auth: {
        loading: "Verifying login status...",
        title: "Please sign in",
        subtext: "You need to sign in to view the Help Center.",
        login: "Sign In",
        back: "Go Back",
    },
    faq: {
        title: "FAQ",
        loading: "Loading...",
        notFound: "No related questions found",
        empty: "No FAQs yet",
        emptyHint: "Try different keywords, or submit feedback to let us know",
    },
    feedback: {
        title: "Submit Feedback",
        desc: "Didn't find an answer? Tell us about it",
        type: "Feedback Type",
        content: "Description",
        contentPlaceholder: "Describe the issue or suggestion you have...",
        contact: "Contact (optional)",
        contactPlaceholder: "Email or other contact info",
        submit: "Submit Feedback",
        success: "Feedback submitted. Thanks for your suggestions!",
        types: {
            bug: "Bug Report",
            feature: "Feature Request",
            other: "Other",
        },
    },
    messages: {
        loadFaqFailed: "Failed to load FAQs",
        contentRequired: "Please enter your feedback",
        submitFailed: "Submission failed, please try again later",
        networkFailed: "Submission failed, please check your network",
    },
} as const;

export default section;

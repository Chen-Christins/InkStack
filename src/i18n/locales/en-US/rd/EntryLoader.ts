const section = {
    title: "Entering R&D Platform",
    stages: {
        auth: "Initializing",
        access: "Verifying access",
        org: "Loading organization",
    },
    descriptions: {
        auth: "Confirming your sign-in status, please wait…",
        access: "Verifying your R&D Platform access…",
        org: "Loading organization and role information…",
    },
} as const;

export default section;

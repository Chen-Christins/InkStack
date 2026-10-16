const section = {
    hero: {
        title: "Every run, clear and controllable.",
        description:
            "Observe Runner execution permissions and product write proposals separately, complete server-side approval before real writes, and keep a replayable lifecycle trail.",
        modeAria: "Select Agent run mode",
        modeLabel: "Run mode",
        modeMock: "Local Demo",
        modeGateway: "Gateway Integration",
        apiConfig: "API Config",
    },
    panel: {
        ariaLabel: "Agent session run panel",
    },
    session: {
        title: "Ticket Collaboration Session",
        sidPlaceholder: "Creating session…",
        restart: "Run Again",
    },
    context: {
        ariaLabel: "Session overview",
        driverLabel: "Run Driver",
        eventCount: "Event Count",
        lastUpdated: "Last Updated",
        waiting: "Waiting",
    },
    stream: {
        ariaLabel: "Session event stream",
        gatewayLoading: "Gateway is returning events…",
        localLoading: "Local engine is streaming…",
    },
    footer: {
        gatewayNote:
            "Gateway verification mode: the BFF/dev proxy injects management credentials and a trusted actor; the browser holds no token.",
        localNote:
            "Demo mode: simulates Runner permissions and product proposals separately, and never writes to real tickets. Append ?driver=gateway to switch to the local Gateway.",
    },
    message: {
        approvedToolCall: "Tool call approved, session continues",
        rejectedToolCall: "Tool call rejected, session will be cancelled",
        proposalApproved: "Product write proposal approved, awaiting MCP worker re-validation and application",
        proposalRejected: "Product write proposal rejected, ticket status will not change",
        proposalFailed: "Product write proposal approval failed, please check the error in the event stream",
    },
    event: {
        toolCall: "Tool Call",
        toolSuccess: "Tool executed successfully",
        toolFailed: "Tool execution failed",
    },
    permission: {
        eyebrow: "Runner Execution Permission",
        question: "Allow the engine to initiate a tool call?",
        hint: "This only controls Runner execution permission; product data writes still require the separate product proposal approval below.",
        approvedGateway: "Approved · Gateway session continues",
        approvedLocal: "Approved · Local session continues",
        rejected: "Runner permission rejected · Session cancelled",
        allow: "Allow Runner Call",
        deny: "Deny Runner Call",
    },
    proposal: {
        eyebrow: "Product Write Proposal · Server Authoritative",
        expires: "Expires {{time}}",
        approve: "Approve Product Write",
        reject: "Reject Product Write",
        hint: "Approval only advances the proposal; the actual write is still performed idempotently by the MCP worker after re-reading domain state and validating the state machine.",
    },
    status: {
        transition: "Status transition → {{status}}",
    },
    config: {
        title: "Agent API Config",
        noticeTitle: "Keys are stored by the site backend",
        noticeBody:
            "This reuses your personal AI interface configuration and is not written to browser storage. Once user config resolution is enabled in deployment, Gateway injects isolated run credentials for the current user server-side; the browser never receives vendor keys or the Gateway management token.",
    },
} as const;

export default section;

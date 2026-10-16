const services = {
    file: {
        initFailed: "Failed to initialize chunked upload",
        chunkFailed: "Chunk {{chunk}} upload failed after {{retries}} retries: {{message}}",
        completeFailed: "Failed to complete upload",
        uploadFailed: "Upload failed",
        initFailedShort: "Initialization failed",
        chunkUploadFailed: "Chunk upload failed",
        downloadFailed: "Download failed",
    },
    agentGateway: {
        requestFailed: "Request failed (HTTP {{status}})",
        eventStreamFailed: "Event stream failed (HTTP {{status}})",
        emptyEventStream: "Event stream has no response body",
        invalidEnvelope: "Event frame does not conform to the EventEnvelope contract",
        sessionIdMismatch: "Event frame sessionId mismatch (expected {{sid}})",
        jsonParseFailed: "Failed to parse event frame JSON",
        protocolError: "Gateway event protocol error: {{message}}",
        connectionInterrupted: "Agent service connection was interrupted. Please retry later. Other pages remain available.",
        proposalSyncFailed: "Proposal sync failed: {{message}}",
        serviceUnavailable: "Agent service is temporarily unavailable, please retry later.",
        runnerAckFailed: "Runner permission acknowledgment failed: {{message}}",
        proposalApprovalFailed: "Product proposal approval failed: {{message}}",
        demoPrompt: "Demo: read bug_1 and analyze it; request permission first if a fix is needed.",
    },
    agentMock: {
        statusRunning: "Mock engine has taken over the session",
        statusAwaitingPermission: "Runner requests tool execution permission",
        statusResuming: "Runner permission approved, resuming tool calls",
        statusProposalApplied: "Proposal applied",
        statusProposalRejected: "Proposal rejected, nothing written to the product domain",
        statusPermissionRejected: "User rejected the permission request",
        chunkGreeting: "Hello, I'm the TechHaven ticket assistant. Request received; fetching details for ticket TCK-1024…",
        chunkReadDetail:
            'Ticket details loaded. Next I need to update the ticket status to "In Progress"; this action will notify the ticket submitter.',
        chunkProposalApplied: 'The product write proposal has been applied. Ticket TCK-1024 is now "In Progress".',
        chunkProposalRejected:
            'The product write proposal was rejected; the runner session can wrap up normally and the ticket remains "To Do".',
        chunkCancelled: 'Understood, this status change has been cancelled and ticket TCK-1024 remains "To Do".',
        toolResultGetTicket: "Ticket retrieved: Safari 15+ blank login page, current status=To Do",
        toolResultUpdateTicket: "Product write proposal created; the ticket has not changed yet",
        permissionReason:
            "Runner requests to call a write tool. This only decides whether the engine may initiate a tool call; it does not equal approval of a product data write.",
        proposalFromStatus: "To Do",
        proposalToStatus: "In Progress",
        proposalReason: "Issue confirmed reproducible, entering the fix stage",
        proposalNote: "MCP worker re-validated the state machine and applied idempotently",
        unknownProposal: "Unknown product proposal: {{id}}",
    },
    agentRequest: {
        timeoutOrUnavailable:
            "Agent service is temporarily unavailable or the connection timed out. Please retry later. Other pages remain available.",
        unavailable: "Agent service is temporarily unavailable, please retry later. Other pages remain available.",
    },
    aiConfig: {
        requestFailed: "AI config request failed ({{status}})",
        invalidResponse: "The Agent config service returned an invalid response, please retry later",
        storageUncertain: "Unable to confirm AI config storage, please refresh and retry",
        reenterKey: "Please re-enter the full API key to create the Agent config",
        defaultName: "Personal default config",
    },
    quote: {
        fetchFailed: "Failed to load quote (HTTP {{status}})",
    },
    asyncResource: {
        timeout: "Request timed out",
    },
    rdList: {
        loadFailed: "Failed to load the list, please retry",
    },
    http: {
        requestFailed: "Request failed",
        requestConfigError: "Request configuration error",
        networkError: "Network error",
        requestFailedStatus: "Request failed ({{status}})",
        requestCanceled: "Request canceled",
        requestTimeout: "Request timed out",
        networkConnectFailed: "Network connection failed",
    },
    apiOptions: {
        zhipu: "Zhipu AI",
        custom: "Custom compatible service",
        openaiProtocol: "OpenAI-compatible protocol",
        claudeProtocol: "Anthropic-compatible protocol",
        glmProtocol: "Zhipu GLM-compatible protocol",
        responses: "Responses API (/responses)",
        chatCompletions: "Chat Completions (/chat/completions)",
        messages: "Messages API (/messages)",
        customKeyPlaceholder: "Enter the full API Key",
    },
} as const;

export default services;

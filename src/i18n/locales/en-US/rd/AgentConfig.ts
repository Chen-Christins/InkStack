const section = {
    title: "AI API Configuration",
    loading: "Loading Agent configuration…",
    errorTitle: "Agent configuration temporarily unavailable",
    loadErrorFallback: "Agent configuration service is temporarily unavailable",
    retry: "Retry",
    provider: {
        label: "Provider",
        placeholder: "Select a provider...",
        hint: 'Choosing a provider fills in the recommended protocol, endpoint type, and URL; for relays, private deployments, or other compatible services, choose "Custom Compatible Service"',
        optionZhipu: "Zhipu AI",
        optionCustom: "Custom Compatible Service",
    },
    protocol: {
        label: "Protocol Type",
        placeholder: "Select a protocol type...",
        hintPrefix:
            'Determines the auth environment variables and dsh provider route; after manually switching protocols, the provider becomes "Custom Compatible Service" (mapped via',
        hintSuffix: ")",
        optionOpenai: "OpenAI Compatible Protocol",
        optionClaude: "Anthropic Compatible Protocol",
        optionGlm: "Zhipu GLM Compatible Protocol",
    },
    response: {
        label: "Endpoint Type",
        placeholder: "Select an endpoint type...",
        hintResponses: "Responses API uses",
        hintChat: "; Chat Completions uses",
        hintMessages: "; Anthropic Messages uses",
        hintSuffix: ". Actual availability depends on the model and the deployed dsh provider route",
    },
    url: {
        label: "Endpoint URL (URL)",
        hintPrefix:
            "Enter the full resource address; relay/proxy addresses are also supported. It will be injected as the dsh environment variable",
        hintSuffix:
            ", and Gateway will strip the trailing /responses, /chat/completions, or /messages according to the selected endpoint type",
    },
    key: {
        label: "API Key (Key)",
        placeholder: "Enter the full API Key",
        hintSaved: "Saved key (shown masked); re-enter to change it",
        hintEmpty: "The key is stored encrypted and only visible to you",
        hintMiddle: ". It will be injected as the dsh environment variable",
        hintSuffix:
            "into a session-specific child process; it never enters browser storage and never appears in session views or logs",
    },
    model: {
        label: "Model Name (Model)",
        placeholder: "e.g. {{value}}",
        hint: "Corresponds to the dsh model parameter. Leave blank to use the default model {{value}}, or enter another model name",
    },
    reasoning: {
        label: "Reasoning Effort",
        placeholder: "Optional, e.g. medium / high / max",
        hint: "Corresponds to the dsh reasoningEffort parameter. Common values: minimal / low / medium / high / max (support varies by model); leave blank to use the model default",
    },
    maxTokens: {
        label: "Max Output Length (max_tokens)",
        required: "*Required",
        optional: "(Optional)",
        placeholderClaude: "Required, e.g. 4096",
        placeholderOptional: "Optional, e.g. 2048",
        hintClaude: "The Claude API requires max_tokens, recommended no more than 4096",
        hintOptional: "Optional; leave blank to use the model default",
        hintSuffix: ". Corresponds to the dsh maxTokens parameter",
    },
    button: {
        saving: "Saving...",
        save: "Save Configuration",
    },
    warnings: {
        urlRequired: "Please enter the endpoint URL",
        keyCleared: "API key input cleared: saving will keep the stored key; re-enter the full key to change it",
        keyRequired: "Please enter the API key",
        maxTokensRequiredClaude: "The Claude series requires max_tokens",
    },
    validation: {
        urlIncomplete: "The endpoint URL must be a complete URL (including the https:// prefix)",
        urlCredentials: "The endpoint URL cannot embed a username or password",
        urlQueryHash: "The endpoint URL cannot contain query parameters or a fragment",
        urlHttps: "Agent runtime requires an HTTPS endpoint URL (except loopback addresses)",
        keyTooLong: "The key length exceeds a reasonable range (limit 8192 characters); check for extra copied content",
        keyMasked: "Please enter the full key: masked strings (containing * or •) cannot be used to run",
        keyCharset: "The key may only contain printable ASCII characters, with no spaces or line breaks",
        maxTokensPositive: "Max output length must be a positive integer",
        maxTokensRange: "Max output length exceeds a reasonable range (limit 1000000)",
        reasoningEffort: "Reasoning effort must be 1–64 visible ASCII characters (common: minimal / low / medium / high / max)",
    },
    success: {
        saved: "Configuration saved",
    },
    error: {
        saveFailed: "Save failed",
    },
} as const;

export default section;

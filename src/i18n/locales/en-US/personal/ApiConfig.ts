const section = {
    title: "AI API Configuration",
    protocol: {
        label: "Protocol Type",
        name: "Protocol Type",
        openai: "OpenAI Compatible Protocol",
        claude: "Anthropic Compatible Protocol",
        glm: "Zhipu GLM Compatible Protocol",
        placeholder: "Select a protocol type...",
        hint: "Each user supports only one API configuration. Switching protocol type will not clear the content you have entered.",
    },
    url: {
        label: "API Endpoint (URL)",
        hintOpenai: "Supports OpenAI-compatible endpoints. You may enter a relay/proxy address.",
        hintClaude: "Supports Anthropic-compatible endpoints. You may enter a relay/proxy address.",
        hintGlm: "Supports Zhipu GLM-compatible endpoints. You may enter a relay/proxy address.",
    },
    apiKey: {
        label: "API Key",
        hintSaved: "Key saved (masked display). Re-enter if you need to change it.",
        hintNew: "Keys are stored encrypted and visible only to you.",
    },
    model: {
        label: "Model Name (Model)",
        placeholder: "e.g. {{model}}",
        hint: "Leave blank to use the default model {{model}}. You may also enter another model name.",
    },
    maxTokens: {
        label: "Max Generation Length (max_tokens)",
        requiredMark: "*Required",
        optionalMark: "(Optional)",
        placeholderRequired: "Required, e.g. 4096",
        placeholderOptional: "Optional, e.g. 2048",
        hintRequired: "The Claude API requires max_tokens. It is recommended not to exceed 4096.",
        hintOptional: "Optional. Leave blank to use the model default.",
    },
    actions: {
        save: "Save Configuration",
        saving: "Saving...",
    },
    messages: {
        urlRequired: "Please enter the API endpoint",
        keyRequired: "Please enter the API key",
        maxTokensRequired: "Claude models require the max generation length (max_tokens)",
        saveSuccess: "Configuration saved",
        saveFailed: "Save failed",
    },
} as const;

export default section;

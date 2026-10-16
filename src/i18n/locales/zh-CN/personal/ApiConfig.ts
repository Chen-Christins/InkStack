const section = {
    title: "AI 接口配置",
    protocol: {
        label: "协议类型",
        name: "协议类型",
        openai: "OpenAI 兼容协议",
        claude: "Anthropic 兼容协议",
        glm: "智谱 GLM 兼容协议",
        placeholder: "请选择协议类型...",
        hint: "每个用户仅支持配置一套接口，切换协议类型不会清空已填写的内容",
    },
    url: {
        label: "接口地址 (URL)",
        hintOpenai: "支持 OpenAI 兼容接口，可填写中转/代理地址",
        hintClaude: "支持 Anthropic 兼容接口，可填写中转/代理地址",
        hintGlm: "支持智谱 GLM 兼容接口，可填写中转/代理地址",
    },
    apiKey: {
        label: "API 密钥 (Key)",
        hintSaved: "已保存密钥（脱敏显示），如需修改请重新输入",
        hintNew: "密钥加密存储，仅你可见",
    },
    model: {
        label: "模型名称 (Model)",
        placeholder: "如 {{model}}",
        hint: "留空则使用默认模型 {{model}}，也可输入其他模型名",
    },
    maxTokens: {
        label: "最大生成长度 (max_tokens)",
        requiredMark: "*必填",
        optionalMark: "(选填)",
        placeholderRequired: "必填，如 4096",
        placeholderOptional: "选填，如 2048",
        hintRequired: "Claude API 要求必须指定 max_tokens，建议不超过 4096",
        hintOptional: "可选，留空使用模型默认值",
    },
    actions: {
        save: "保存配置",
        saving: "保存中...",
    },
    messages: {
        urlRequired: "请输入接口地址",
        keyRequired: "请输入 API 密钥",
        maxTokensRequired: "Claude 系列必须填写最大生成长度 (max_tokens)",
        saveSuccess: "配置已保存",
        saveFailed: "保存失败",
    },
} as const;

export default section;

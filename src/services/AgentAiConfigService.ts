import { AuthService, type AiConfig, type AiConfigParams } from "./AuthService.ts";
import { agentRequest } from "./AgentRequest.ts";
import i18n from "@/i18n";

interface Asset extends AiConfig {
    id: number;
    is_default: boolean;
}

/** The form and runner select the same store. Only an explicit legacy-mode
 * response permits writing the old backend; auth/network failures never do. */
export class AgentAiConfigService {
    private readonly fetchImpl: typeof fetch;
    constructor(fetchImpl: typeof fetch = fetch.bind(globalThis)) {
        this.fetchImpl = fetchImpl;
    }

    private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
        const response = await agentRequest(this.fetchImpl, `/gateway/v1/ai-configs${path}`, {
            method,
            headers: { "content-type": "application/json" },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.error || i18n.t("services:aiConfig.requestFailed", { status: response.status }));
        }
        if (data === null) {
            throw new Error(i18n.t("services:aiConfig.invalidResponse"));
        }
        return data as T;
    }

    private async isLegacy(): Promise<boolean> {
        const mode = await this.request<{ storage: string }>("/mode");
        if (mode.storage !== "assets" && mode.storage !== "legacy") {
            throw new Error(i18n.t("services:aiConfig.storageUncertain"));
        }
        return mode.storage === "legacy";
    }

    private async editableAsset(): Promise<Asset | undefined> {
        const result = await this.request<{ configs: Asset[]; preference: number | null }>("");
        return result.configs.find((c) => c.id === result.preference) ?? result.configs.find((c) => c.is_default) ?? result.configs[0];
    }

    async getAiConfig(): Promise<AiConfig | null> {
        if (await this.isLegacy()) {
            return AuthService.getAiConfig();
        }
        return (await this.editableAsset()) ?? null;
    }

    async saveAiConfig(input: AiConfigParams): Promise<void> {
        if (await this.isLegacy()) {
            return AuthService.saveAiConfig(input);
        }
        const asset = await this.editableAsset();
        let id: number;
        if (asset) {
            // Blank key means preserve the stored secret, never replace it with a mask.
            const { api_key: _key, ...patch } = input;
            await this.request(`/${asset.id}`, "PATCH", {
                ...patch,
                ...(input.api_key ? { api_key: input.api_key } : {}),
                is_default: true,
                status: "active",
                model: input.model ?? null,
                reasoning_effort: input.reasoning_effort ?? null,
                max_tokens: input.max_tokens ?? null,
            });
            id = asset.id;
        } else {
            if (!input.api_key) {
                throw new Error(i18n.t("services:aiConfig.reenterKey"));
            }
            const created = await this.request<Asset>("", "POST", {
                ...input,
                name: i18n.t("services:aiConfig.defaultName"),
                is_default: true,
            });
            id = created.id;
        }
        await this.request("/preference", "PUT", { config_id: id, org_id: null });
    }
}

export const agentAiConfigService = new AgentAiConfigService();

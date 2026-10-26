import http from "../infra/Http.ts";
import i18n from "@/i18n";
import { credentialToJSON, isWebAuthnSupported, parseCreationOptions, parseRequestOptions } from "../utils/WebAuthn.ts";

export interface PasskeySummary {
    id: number | string;
    name: string;
    alg: number;
    aaguid: string;
    transports: string;
    backup_eligible: number;
    backup_state: number;
    created_at: number;
    last_used_at: number;
}

export interface PasskeyListResponse {
    total: number;
    list: PasskeySummary[];
}

/**
 * Passkey / WebAuthn 服务
 *
 * begin/delete 使用 form-urlencoded；finish 使用后端要求的 JSON body。
 */
export class PasskeyService {
    static isSupported(): boolean {
        return isWebAuthnSupported();
    }

    static async list(): Promise<PasskeyListResponse> {
        const response = await http.post<PasskeyListResponse>("/auth/passkey/list");
        return response.data ?? { total: 0, list: [] };
    }

    static async remove(id: number | string) {
        return http.postForm("/auth/passkey/delete", { id });
    }

    static async register(name?: string) {
        if (!isWebAuthnSupported()) {
            throw new Error(i18n.t("auth:message.passkeyUnsupported"));
        }

        const beginData = new URLSearchParams();
        if (name?.trim()) {
            beginData.append("name", name.trim());
        }

        const begin = await http.postForm<any>("/auth/passkey/register/begin", beginData);
        if (!begin.data) {
            throw new Error(i18n.t("auth:message.passkeyRegisterFailed"));
        }

        const publicKey = parseCreationOptions(begin.data);
        const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
        if (!credential) {
            throw new Error(i18n.t("auth:message.passkeyRegisterFailed"));
        }

        return http.post("/auth/passkey/register/finish", {
            ...credentialToJSON(credential),
            name: name?.trim() || begin.data.name || "Passkey",
        });
    }

    static async login(authId?: string) {
        if (!isWebAuthnSupported()) {
            throw new Error(i18n.t("auth:message.passkeyUnsupported"));
        }

        const beginData = new URLSearchParams();
        if (authId?.trim()) {
            beginData.append("auth_id", authId.trim());
        }

        const begin = await http.postForm<any>("/auth/passkey/login/begin", beginData);
        if (!begin.data) {
            throw new Error(i18n.t("auth:message.passkeyLoginFailed"));
        }

        const publicKey = parseRequestOptions(begin.data);
        const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
        if (!credential) {
            throw new Error(i18n.t("auth:message.passkeyLoginFailed"));
        }

        return http.post("/auth/passkey/login/finish", credentialToJSON(credential));
    }
}

export default PasskeyService;

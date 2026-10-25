/**
 * WebAuthn 浏览器 API 辅助函数
 *
 * 后端返回的 challenge / credential id / user.id 都是 base64url 字符串，
 * navigator.credentials 需要 ArrayBuffer。优先使用浏览器原生 JSON 转换，
 * 不支持时回退到手工转换。
 */

function toUint8Array(value: ArrayBuffer | ArrayBufferView): Uint8Array {
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function base64urlToBuffer(value: string): ArrayBuffer {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const binary = window.atob(normalized + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export function bufferToBase64url(value: ArrayBuffer | ArrayBufferView): string {
    const bytes = toUint8Array(value);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function isWebAuthnSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined" &&
        typeof navigator.credentials !== "undefined" &&
        window.isSecureContext
    );
}

export function parseCreationOptions(options: any): PublicKeyCredentialCreationOptions {
    // 后端在 data 根节点额外返回 name，WebAuthn 选项本身不需要它。
    const jsonOptions = { ...options };
    delete jsonOptions.name;

    const nativeParser = (window.PublicKeyCredential as any)?.parseCreationOptionsFromJSON;
    if (typeof nativeParser === "function") {
        return nativeParser.call(window.PublicKeyCredential, jsonOptions) as PublicKeyCredentialCreationOptions;
    }

    return {
        ...jsonOptions,
        challenge: base64urlToBuffer(jsonOptions.challenge),
        user: {
            ...jsonOptions.user,
            id: base64urlToBuffer(jsonOptions.user.id),
        },
        excludeCredentials: Array.isArray(jsonOptions.excludeCredentials)
            ? jsonOptions.excludeCredentials.map((credential: any) => ({
                  ...credential,
                  id: base64urlToBuffer(credential.id),
              }))
            : undefined,
    } as PublicKeyCredentialCreationOptions;
}

export function parseRequestOptions(options: any): PublicKeyCredentialRequestOptions {
    const nativeParser = (window.PublicKeyCredential as any)?.parseRequestOptionsFromJSON;
    if (typeof nativeParser === "function") {
        return nativeParser.call(window.PublicKeyCredential, options) as PublicKeyCredentialRequestOptions;
    }

    return {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        allowCredentials: Array.isArray(options.allowCredentials)
            ? options.allowCredentials.map((credential: any) => ({
                  ...credential,
                  id: base64urlToBuffer(credential.id),
              }))
            : undefined,
    } as PublicKeyCredentialRequestOptions;
}

export function credentialToJSON(credential: PublicKeyCredential): any {
    const nativeToJSON = (credential as any).toJSON;
    if (typeof nativeToJSON === "function") {
        return nativeToJSON.call(credential);
    }

    const response = credential.response as any;
    const json: any = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
    };

    if (response?.attestationObject) {
        json.response = {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            attestationObject: bufferToBase64url(response.attestationObject),
            transports: typeof response.getTransports === "function" ? response.getTransports() : [],
        };
    } else {
        json.response = {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            authenticatorData: bufferToBase64url(response.authenticatorData),
            signature: bufferToBase64url(response.signature),
            userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
        };
    }

    return json;
}

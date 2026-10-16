import i18n from "@/i18n";

/** Bound ordinary Agent HTTP calls; SSE has its own reconnection lifecycle. */
export async function agentRequest(fetcher: typeof fetch, input: string, init?: RequestInit): Promise<Response> {
    const response = await fetcher(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }).catch(() => {
        throw new Error(i18n.t("services:agentRequest.timeoutOrUnavailable"));
    });
    if (response.status >= 500) {
        throw new Error(i18n.t("services:agentRequest.unavailable"));
    }
    return response;
}

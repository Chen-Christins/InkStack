import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useAsyncResource } from "./UseAsyncResource.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useAsyncResource request lifecycle", () => {
    it("clears loading after success and after failure", async () => {
        const pending: { resolve: (value: string) => void; reject: (error: Error) => void }[] = [];
        const fetcher = vi.fn(() => new Promise<string>((resolve, reject) => pending.push({ resolve, reject })));
        let state!: ReturnType<typeof useAsyncResource<string>>;

        function Host() {
            state = useAsyncResource<string>(fetcher, []);
            return null;
        }

        const root = createRoot(document.createElement("div"));
        try {
            await act(async () => root.render(<Host />));
            expect(state.loading).toBe(true);

            await act(async () => pending[0].resolve("ok"));
            expect(state.loading).toBe(false);
            expect(state.data).toBe("ok");

            await act(async () => {
                state.reload();
            });
            expect(state.loading).toBe(true);

            await act(async () => pending[1].reject(new Error("boom")));
            expect(state.loading).toBe(false);
            expect(state.error).toBeInstanceOf(Error);
        } finally {
            await act(async () => root.unmount());
        }
    });

    it("ignores stale responses when deps change", async () => {
        const pending: { resolve: (value: string) => void }[] = [];
        const fetcher = vi.fn((_signal: AbortSignal) => new Promise<string>((resolve) => pending.push({ resolve })));
        let state!: ReturnType<typeof useAsyncResource<string>>;

        function Host({ id }: { id: number }) {
            state = useAsyncResource<string>(fetcher, [id]);
            return null;
        }

        const root = createRoot(document.createElement("div"));
        try {
            await act(async () => root.render(<Host id={1} />));
            await act(async () => root.render(<Host id={2} />));

            await act(async () => pending[1].resolve("new"));
            await act(async () => pending[0].resolve("old"));

            expect(state.data).toBe("new");
            expect(state.loading).toBe(false);
        } finally {
            await act(async () => root.unmount());
        }
    });

    it("aborts on timeout and still clears loading", async () => {
        vi.useFakeTimers();
        let aborted = false;
        const fetcher = (signal: AbortSignal) =>
            new Promise<string>((_resolve, reject) => {
                signal.addEventListener("abort", () => {
                    aborted = true;
                    reject(new DOMException("aborted", "AbortError"));
                });
            });
        let state!: ReturnType<typeof useAsyncResource<string>>;

        function Host() {
            state = useAsyncResource<string>(fetcher, [], { timeoutMs: 50 });
            return null;
        }

        const root = createRoot(document.createElement("div"));
        try {
            await act(async () => root.render(<Host />));
            expect(state.loading).toBe(true);

            await act(async () => {
                vi.advanceTimersByTime(60);
            });
            expect(aborted).toBe(true);
            expect(state.loading).toBe(false);
        } finally {
            await act(async () => root.unmount());
        }
        vi.useRealTimers();
    });

    it("does not fetch when disabled and reports loading as false", async () => {
        const fetcher = vi.fn(async () => "x");
        let state!: ReturnType<typeof useAsyncResource<string>>;

        function Host() {
            state = useAsyncResource<string>(fetcher, [], { enabled: false });
            return null;
        }

        const root = createRoot(document.createElement("div"));
        try {
            await act(async () => root.render(<Host />));
            expect(fetcher).not.toHaveBeenCalled();
            expect(state.loading).toBe(false);
        } finally {
            await act(async () => root.unmount());
        }
    });
});

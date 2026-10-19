import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { useInitialLoaded } from "./UseInitialLoaded.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useInitialLoaded", () => {
    it("stays false until the first load finishes, then remains true on refreshes", async () => {
        let result = false;
        function Host({ loading }: { loading: boolean }) {
            result = useInitialLoaded(loading);
            return null;
        }

        const root = createRoot(document.createElement("div"));
        try {
            await act(async () => root.render(<Host loading={true} />));
            expect(result).toBe(false);

            await act(async () => root.render(<Host loading={false} />));
            expect(result).toBe(true);

            await act(async () => root.render(<Host loading={true} />));
            expect(result).toBe(true);
        } finally {
            await act(async () => root.unmount());
        }
    });
});

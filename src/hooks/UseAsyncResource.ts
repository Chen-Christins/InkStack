import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface UseAsyncResourceOptions {
    timeoutMs?: number;
    enabled?: boolean;
}

export interface AsyncResource<T> {
    data: T | undefined;
    loading: boolean;
    error: unknown;
    reload: () => void;
}

const DEFAULT_TIMEOUT = 10000;

export function useAsyncResource<T>(
    fetcher: (signal: AbortSignal) => Promise<T>,
    deps: DependencyList,
    options: UseAsyncResourceOptions = {},
): AsyncResource<T> {
    const { timeoutMs = DEFAULT_TIMEOUT, enabled = true } = options;
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<unknown>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const requestIdRef = useRef(0);

    const reload = useCallback(() => {
        setReloadToken((token) => token + 1);
    }, []);

    useEffect(() => {
        if (!enabled) {
            requestIdRef.current += 1;
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);

        const run = async () => {
            try {
                const result = await fetcher(controller.signal);
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setData(result);
            } catch (err) {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setError(err);
            } finally {
                clearTimeout(timer);
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        };

        void run();

        return () => {
            requestIdRef.current += 1;
            controller.abort();
            clearTimeout(timer);
        };
    }, [enabled, timeoutMs, reloadToken, ...deps]);

    return { data, loading, error, reload };
}

export default useAsyncResource;

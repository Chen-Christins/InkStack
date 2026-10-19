import { useCallback, useEffect, useRef, useState } from "react";
import message from "../components/message/Message";
import i18n from "@/i18n";
import { useInitialLoaded } from "./UseInitialLoaded";

interface PageQuery {
    page: number;
    pageSize: number;
    organizationIds?: string[];
}

/** Shared request lifecycle for R&D lists; forms and domain permissions stay in each page. */
export function useRdList<T, F extends object>(
    load: (query: F & PageQuery) => Promise<{ data: T[]; total: number }>,
    filters: F,
    page: number,
    orgId: string,
    pageSize: number,
) {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const initialLoaded = useInitialLoaded(loading);
    const requestId = useRef(0);

    const refresh = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        try {
            const result = await load({ ...filters, page, pageSize, organizationIds: orgId ? [orgId] : undefined });
            if (id !== requestId.current) {
                return;
            }
            setData(result.data);
            setTotal(result.total);
        } catch (error) {
            if (id === requestId.current) {
                message.error(error instanceof Error ? error.message : i18n.t("services:rdList.loadFailed"));
            }
        } finally {
            if (id === requestId.current) {
                setLoading(false);
            }
        }
    }, [load, filters, page, pageSize, orgId]);

    useEffect(() => {
        void refresh();
        return () => {
            requestId.current++;
        };
    }, [refresh]);

    return { data, total, loading, initialLoaded, refresh };
}

import { useEffect, useState } from "react";

/**
 * 区分「首次加载」与「筛选/翻页等后续刷新」。
 *
 * 首次 loading 结束后返回 true，之后保持 true，页面可据此只在首次加载时
 * 展示整页 Loading，后续刷新只更新列表区域。
 */
export function useInitialLoaded(loading: boolean): boolean {
    const [initialLoaded, setInitialLoaded] = useState(!loading);

    useEffect(() => {
        if (!loading) {
            setInitialLoaded(true);
        }
    }, [loading]);

    return initialLoaded;
}

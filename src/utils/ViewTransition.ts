/** View Transitions API 的轻量封装：在不支持或用户偏好减少动效时优雅降级 */

/** 从圆点扩散的位置（视口坐标） */
export interface RevealOrigin {
    x: number;
    y: number;
}

export const REVEAL_TRANSITION_DURATION = 500;

export const prefersReducedMotion = (): boolean => {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const supportsViewTransition = (): boolean => {
    return typeof document !== "undefined" && typeof document.startViewTransition === "function";
};

/** 以 origin 为圆心、覆盖整个视口的半径 */
const getRevealRadius = ({ x, y }: RevealOrigin): number => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 32;
};

/**
 * 执行一次带「圆形扩散」揭幕效果的 DOM 更新（如明暗主题切换）。
 * 新画面以 origin 为圆心向外扩散覆盖旧画面；不支持 View Transitions 时直接执行更新。
 */
export const runRevealTransition = (origin: RevealOrigin, update: () => void): void => {
    if (!supportsViewTransition() || prefersReducedMotion()) {
        update();
        return;
    }

    const root = document.documentElement;
    root.style.setProperty("--reveal-x", `${origin.x}px`);
    root.style.setProperty("--reveal-y", `${origin.y}px`);
    root.style.setProperty("--reveal-radius", `${Math.ceil(getRevealRadius(origin))}px`);
    root.style.setProperty("--reveal-duration", `${REVEAL_TRANSITION_DURATION}ms`);

    // 揭示过程中暂停常规 CSS 过渡，避免与扩散动效叠加
    root.classList.add("theme-revealing");

    // 用宏任务等待 DOM 变更落地后再交还给 View Transition 捕获新快照。
    // 不能用 requestAnimationFrame：无头/后台渲染时帧不可靠，会让动效一直挂起
    const transition = document.startViewTransition(
        () =>
            new Promise<void>((resolve) => {
                update();
                setTimeout(resolve, 0);
            }),
    );

    const cleanup = () => {
        root.classList.remove("theme-revealing");
    };

    // update 抛错或快照不可用时同样要恢复类名（属于预期降级，不向外抛出）
    transition.updateCallbackDone.catch(() => {});
    transition.finished.then(cleanup, cleanup);
};

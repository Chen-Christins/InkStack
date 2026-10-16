const section = {
    modes: {
        default: { label: "默认", nextLabel: "较宽" },
        wide: { label: "较宽", nextLabel: "全宽" },
        full: { label: "全宽", nextLabel: "默认" },
    },
    ariaLabel: "当前布局宽度：{{label}}，点击切换到{{nextLabel}}",
    title: "布局宽度：{{label}}，点击切换到{{nextLabel}}",
} as const;

export default section;

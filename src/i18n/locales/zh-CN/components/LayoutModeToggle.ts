const section = {
    modes: {
        appShell: { label: "侧栏布局", nextLabel: "顶部布局" },
        classic: { label: "顶部布局", nextLabel: "侧栏布局" },
    },
    ariaLabel: "当前界面布局：{{label}}，点击切换到{{nextLabel}}",
    title: "界面布局：{{label}}，点击切换到{{nextLabel}}",
} as const;

export default section;

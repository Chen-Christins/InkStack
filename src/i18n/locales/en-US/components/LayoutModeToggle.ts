const section = {
    modes: {
        appShell: { label: "Sidebar layout", nextLabel: "Top layout" },
        classic: { label: "Top layout", nextLabel: "Sidebar layout" },
    },
    ariaLabel: "Current interface layout: {{label}}. Click to switch to {{nextLabel}}",
    title: "Interface layout: {{label}}. Click to switch to {{nextLabel}}",
} as const;

export default section;

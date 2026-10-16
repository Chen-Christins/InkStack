const section = {
    modes: {
        default: { label: "Default", nextLabel: "Wide" },
        wide: { label: "Wide", nextLabel: "Full" },
        full: { label: "Full", nextLabel: "Default" },
    },
    ariaLabel: "Current layout width: {{label}}. Click to switch to {{nextLabel}}",
    title: "Layout width: {{label}}. Click to switch to {{nextLabel}}",
} as const;

export default section;

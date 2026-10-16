const section = {
    panelTitle: "Theme Style",
    collapseButton: {
        expand: "Expand theme list",
        collapse: "Collapse theme list",
    },
    presets: {
        time: {
            name: "Time Magazine",
            desc: "Print serif style",
        },
        monochrome: {
            name: "Minimal Monochrome",
            desc: "High-end black and white",
        },
        mint: {
            name: "Eye-care Green",
            desc: "Soft on the eyes",
        },
        ocean: {
            name: "Ocean Blue",
            desc: "Fresh blue and white",
        },
        sakura: {
            name: "Sakura Pink",
            desc: "Sweet pink and white",
        },
        cyberpunk: {
            name: "Cyberpunk",
            desc: "Neon tech vibe",
        },
        gold: {
            name: "Dark Gold Luxury",
            desc: "Understated black and gold",
        },
        lavender: {
            name: "Lavender Purple",
            desc: "Soft purple and white",
        },
        pi: {
            name: "Pi Geek",
            desc: "Grid terminal style",
        },
    },
    cursor: {
        label: "Theme Cursor",
        hint: "Switch the cursor style with the current theme",
        ariaLabel: "Use theme cursor style",
    },
} as const;

export default section;

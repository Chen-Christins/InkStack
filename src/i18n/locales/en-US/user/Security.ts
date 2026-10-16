const section = {
    options: {
        title: "Security Options",
        twoFactor: {
            name: "Two-Factor Authentication (2FA)",
            hint: "Requires an additional dynamic verification code when logging in, greatly improving account security",
            enabled: "Two-factor authentication enabled (demo)",
            disabled: "Two-factor authentication disabled",
        },
        loginAlert: {
            name: "Unusual Login Alerts",
            hint: "Notify via site message when a new device or unusual login is detected",
        },
    },
    devices: {
        title: "Login Devices",
        count: "Currently {{total}} device(s) logged in",
        loading: "Loading device list...",
        errorTitle: "Failed to load device list",
        reload: "Reload",
        empty: "No other devices logged in",
        current: "Current device",
        loginAt: "Logged in at {{loginTime}} · Last active {{activeTime}}",
        revoking: "Revoking...",
        revoke: "Revoke",
    },
    unknownDevice: "Unknown device",
    revoke: {
        title: "Revoke Device",
        contentPrefix: 'Are you sure you want to force "',
        contentSuffix: '" offline?',
        confirm: "Revoke",
        cancel: "Cancel",
    },
    messages: {
        devicesFetchFailed: "Failed to get device list",
        revokeSuccess: "Device has been revoked",
        revokeFailed: "Failed to revoke device",
    },
} as const;

export default section;

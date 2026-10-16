const section = {
    denied: "Direct messaging is only available to internal members",
    loading: "Loading...",
    sidebar: {
        searchPlaceholder: "Search conversations",
        newChat: "New chat",
        empty: "No conversations",
        delete: "Delete conversation",
    },
    chat: {
        online: "Online",
        offline: "Offline",
        empty: "No messages yet. Say hello!",
        selectPrompt: "Select a conversation to start chatting",
        emoji: "Emoji",
        inputPlaceholder: "Type a message, press Enter to send",
    },
    newChatModal: {
        title: "New chat",
        searchPlaceholder: "Search mutually followed users",
        empty: "No mutually followed users",
        creating: "Creating...",
    },
    deleteConfirm: {
        title: "Delete conversation",
        content:
            'Delete the conversation with "{{name}}"? After deletion, the other person can still see it, and the conversation will reappear if they send a new message.',
        confirm: "Delete",
        cancel: "Cancel",
    },
    time: {
        yesterday: "Yesterday",
    },
} as const;

export default section;

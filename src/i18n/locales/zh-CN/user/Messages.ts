const section = {
    denied: "私信功能仅对内部成员开放",
    loading: "加载中...",
    sidebar: {
        searchPlaceholder: "搜索会话",
        newChat: "发起会话",
        empty: "暂无会话",
        delete: "删除会话",
    },
    chat: {
        online: "在线",
        offline: "离线",
        empty: "暂无消息，打个招呼吧",
        selectPrompt: "请选择一个会话开始聊天",
        emoji: "表情",
        inputPlaceholder: "输入消息，回车发送",
    },
    newChatModal: {
        title: "发起会话",
        searchPlaceholder: "搜索互相关注的用户",
        empty: "暂无互相关注的用户",
        creating: "创建中...",
    },
    deleteConfirm: {
        title: "删除会话",
        content: "确定删除与「{{name}}」的会话吗？删除后对方仍可看到，对方再发消息时该会话会重新出现。",
        confirm: "删除",
        cancel: "取消",
    },
    time: {
        yesterday: "昨天",
    },
} as const;

export default section;

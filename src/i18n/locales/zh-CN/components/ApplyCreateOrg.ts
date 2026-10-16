const section = {
    message: {
        nameTypeRequired: "请填写组织名称和类型",
        submitSuccess: "申请已提交，请等待管理员审核",
        submitFailed: "提交失败，请重试",
    },
    title: "申请创建组织",
    hint: "提交申请后，管理员将审核您的组织创建请求。审核通过后，您将自动成为该组织的管理员。",
    nameLabel: "组织名称 *",
    namePlaceholder: "请输入组织名称",
    typeLabel: "组织类型 *",
    typePlaceholder: "如：研发团队、设计团队、运营团队",
    descriptionLabel: "组织描述",
    descriptionPlaceholder: "请简要描述组织的目标和方向...",
    cancel: "取消",
    submit: "提交申请",
    submitting: "提交中...",
} as const;

export default section;

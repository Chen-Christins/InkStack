import React from "react";
import { useTranslation } from "react-i18next";
import { confirm } from "../components/confirm/Confirm";

const ExampleConfirm: React.FC = () => {
    const { t } = useTranslation("sample");

    // 基础用法
    const handleDelete = async () => {
        const confirmed = await confirm({
            title: t("confirm.deleteTitle"),
            content: t("confirm.deleteContent"),
            confirmText: t("confirm.deleteConfirmText"),
            cancelText: t("confirm.cancelText"),
        });

        if (confirmed) {
            // 执行删除操作
            // console.log('执行删除操作');
        }
    };

    // 带异步操作的用法
    const handleSubmit = async () => {
        const confirmed = await confirm({
            title: t("confirm.submitTitle"),
            content: (
                <div>
                    <p>{t("confirm.submitContent")}</p>
                    <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        <li>{t("confirm.userName")}</li>
                        <li>{t("confirm.userEmail")}</li>
                    </ul>
                </div>
            ),
            onConfirm: async () => {
                // 模拟API请求
                await new Promise((resolve) => setTimeout(resolve, 1500));
            },
        });

        if (confirmed) {
            // console.log('提交成功');
        }
    };

    // 自定义按钮和行为
    const handleSpecialAction = async () => {
        await confirm({
            title: t("confirm.specialTitle"),
            content: t("confirm.specialContent"),
            confirmText: t("confirm.specialConfirmText"),
            showCancel: false,
            closeOnMaskClick: false, // 点击遮罩层不关闭
        });
    };

    return (
        <div style={{ padding: "20px" }}>
            <button onClick={handleDelete} style={{ marginRight: "10px" }}>
                {t("confirm.deleteButton")}
            </button>
            <button onClick={handleSubmit} style={{ marginRight: "10px" }}>
                {t("confirm.submitButton")}
            </button>
            <button onClick={handleSpecialAction}>{t("confirm.specialButton")}</button>
        </div>
    );
};

export default ExampleConfirm;

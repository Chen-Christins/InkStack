import React from "react";
import { useTranslation } from "react-i18next";
import message from "../components/message/Message";

const ExampleMessages: React.FC = () => {
    const { t } = useTranslation("sample");

    const showMessages = () => {
        // 显示成功消息
        message.success(t("message.success"));

        // 显示警告消息，5秒后自动关闭
        message.warn(t("message.warn"), { duration: 5000 });

        // 显示错误消息，位置在左下角
        message.error(t("message.error"), { position: "bottom-left" });

        // 显示信息消息，不自动关闭
        const infoId = message.info(t("message.info"), { duration: 0 });

        // 5秒后手动关闭信息消息
        setTimeout(() => {
            message.close(infoId);
        }, 5000);
    };

    return (
        <div>
            <button onClick={showMessages}>{t("message.show")}</button>
        </div>
    );
};

export default ExampleMessages;

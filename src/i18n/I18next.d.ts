import type { resources } from "./Resources";

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "common";
        resources: (typeof resources)["zh-CN"];
    }
}

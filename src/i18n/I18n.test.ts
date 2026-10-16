import { describe, it, expect } from "vitest";
import { resources } from "./Resources";
import i18n from "./index";

type Tree = Record<string, unknown>;

function collectPaths(value: unknown, prefix = ""): string[] {
    if (value === null || typeof value !== "object") {
        return [prefix];
    }
    return Object.entries(value as Tree).flatMap(([key, child]) => collectPaths(child, prefix ? `${prefix}.${key}` : key));
}

function readPath(tree: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => (acc as Tree | undefined)?.[key], tree);
}

describe("i18n resources", () => {
    const source = resources["zh-CN"];
    const target = resources["en-US"];

    it("zh-CN 与 en-US 的键结构完全一致", () => {
        const sourcePaths = collectPaths(source).sort();
        const targetPaths = collectPaths(target).sort();
        expect(targetPaths).toEqual(sourcePaths);
    });

    it("不存在空翻译值", () => {
        for (const [language, tree] of Object.entries(resources)) {
            for (const path of collectPaths(tree)) {
                const value = readPath(tree, path);
                expect(typeof value, `${language}:${path} 应为字符串`).toBe("string");
                expect(String(value).length, `${language}:${path} 不应为空`).toBeGreaterThan(0);
            }
        }
    });

    it("各语言均可正确翻译", () => {
        expect(i18n.t("language.label", { lng: "zh-CN" })).toBe("语言");
        expect(i18n.t("language.label", { lng: "en-US" })).toBe("Language");
    });
});

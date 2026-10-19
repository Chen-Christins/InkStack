import { beforeEach, describe, expect, it, vi } from "vitest";

const httpMock = vi.hoisted(() => ({
    get: vi.fn(),
}));

vi.mock("../infra/Http.ts", () => ({ default: httpMock }));

import RdPlatformService from "./RdPlatformService.ts";

describe("RdPlatformService PR distribution", () => {
    beforeEach(() => {
        httpMock.get.mockReset();
    });

    it("按周请求近 3 月数据并映射后端字段", async () => {
        httpMock.get.mockResolvedValue({
            data: {
                summary: { total: 20, merged: 12, merge_rate: 60 },
                points: [
                    { date: "2025-07-21", end_date: "2025-07-27", total: 10, merged: 6 },
                    { date: "2025-07-28", end_date: "2025-08-03", total: 10, merged: 6 },
                ],
            },
        });

        const result = await RdPlatformService.getPrDistribution({ orgId: "7", range: "3m" });

        expect(httpMock.get).toHaveBeenCalledWith("/rd/pr-distribution?org_id=7&range=3m&granularity=week");
        expect(result.points).toEqual([
            { date: "2025-07-21", endDate: "2025-07-27", total: 10, merged: 6 },
            { date: "2025-07-28", endDate: "2025-08-03", total: 10, merged: 6 },
        ]);
        expect(result.summary).toEqual({ total: 20, merged: 12, mergeRate: 60 });
    });

    it("按天请求近 15 天数据并在缺少 end_date 时自动补齐", async () => {
        httpMock.get.mockResolvedValue({
            data: {
                points: [{ date: "2025-10-19", total: 3, merged: 2 }],
            },
        });

        const result = await RdPlatformService.getPrDistribution({ range: "15d" });

        expect(httpMock.get).toHaveBeenCalledWith("/rd/pr-distribution?range=15d&granularity=day");
        expect(result.points).toEqual([{ date: "2025-10-19", endDate: "2025-10-19", total: 3, merged: 2 }]);
        expect(result.summary).toEqual({ total: 3, merged: 2, mergeRate: 66.7 });
    });

    it("兼容 total/merged 与 pr_total/merged_total 两种字段命名", async () => {
        httpMock.get.mockResolvedValue({
            data: {
                list: [
                    { date: "2025-10-18", pr_total: 4, merged_total: 1 },
                    { date: "2025-10-19", total: 2, merged: 2 },
                ],
            },
        });

        const result = await RdPlatformService.getPrDistribution({ range: "15d" });

        expect(result.points).toEqual([
            { date: "2025-10-18", endDate: "2025-10-18", total: 4, merged: 1 },
            { date: "2025-10-19", endDate: "2025-10-19", total: 2, merged: 2 },
        ]);
        expect(result.summary).toEqual({ total: 6, merged: 3, mergeRate: 50 });
    });
});

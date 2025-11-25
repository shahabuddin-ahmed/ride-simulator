import { Op } from "sequelize";
import OfflineParingRepo from "../../../src/repo/offline-paring";
import OfflineParing from "../../../src/model/offline-paring";
import { OfflineParingStatus } from "../../../src/constant/common";

jest.mock("../../../src/model/offline-paring");

describe("OfflineParingRepo", () => {
    const repo = new OfflineParingRepo();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a paring", async () => {
        const payload: any = { code: "ABC" };
        (OfflineParing.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });

        const result = await repo.create(payload);

        expect(OfflineParing.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ id: 1, ...payload });
    });

    it("finds active paring by code", async () => {
        const paring = { id: 2 };
        (OfflineParing.findOne as jest.Mock).mockResolvedValue(paring);

        const result = await repo.findActiveByCode("XYZ");

        expect(OfflineParing.findOne).toHaveBeenCalledWith({
            where: {
                code: "XYZ",
                status: OfflineParingStatus.ACTIVE,
                expiresAt: { [Op.gte]: expect.any(Date) },
            },
            order: [["createdAt", "DESC"]],
        });
        expect(result).toBe(paring);
    });

    it("marks paring as used", async () => {
        (OfflineParing.update as jest.Mock).mockResolvedValue([1]);

        const result = await repo.markUsed(10);

        expect(OfflineParing.update).toHaveBeenCalledWith(
            { status: OfflineParingStatus.USED, updatedAt: expect.any(Date) },
            { where: { id: 10 } },
        );
        expect(result).toEqual([1]);
    });

    it("expires old parings", async () => {
        (OfflineParing.update as jest.Mock).mockResolvedValue([2]);
        const now = new Date();

        const result = await repo.expireOld(now);

        expect(OfflineParing.update).toHaveBeenCalledWith(
            { status: OfflineParingStatus.EXPIRED, updatedAt: now },
            { where: { status: OfflineParingStatus.ACTIVE, expiresAt: { [Op.lt]: now } } },
        );
        expect(result).toEqual([2]);
    });
});

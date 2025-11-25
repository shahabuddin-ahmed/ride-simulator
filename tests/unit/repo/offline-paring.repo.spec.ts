import { Op } from "sequelize";
import OfflinePairingRepo from "../../../src/repo/offline-paring";
import OfflinePairing from "../../../src/model/offline-paring";
import { OfflinePairingStatus } from "../../../src/constant/common";

jest.mock("../../../src/model/offline-paring");

describe("OfflinePairingRepo", () => {
    const repo = new OfflinePairingRepo();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a pairing", async () => {
        const payload: any = { code: "ABC" };
        (OfflinePairing.create as jest.Mock).mockResolvedValue({ id: 1, ...payload });

        const result = await repo.create(payload);

        expect(OfflinePairing.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ id: 1, ...payload });
    });

    it("finds active pairing by code", async () => {
        const pairing = { id: 2 };
        (OfflinePairing.findOne as jest.Mock).mockResolvedValue(pairing);

        const result = await repo.findActiveByCode("XYZ");

        expect(OfflinePairing.findOne).toHaveBeenCalledWith({
            where: {
                code: "XYZ",
                status: OfflinePairingStatus.ACTIVE,
                expiresAt: { [Op.gte]: expect.any(Date) },
            },
            order: [["createdAt", "DESC"]],
        });
        expect(result).toBe(pairing);
    });

    it("marks pairing as used", async () => {
        (OfflinePairing.update as jest.Mock).mockResolvedValue([1]);

        const result = await repo.markUsed(10);

        expect(OfflinePairing.update).toHaveBeenCalledWith(
            { status: OfflinePairingStatus.USED, updatedAt: expect.any(Date) },
            { where: { id: 10 } },
        );
        expect(result).toEqual([1]);
    });

    it("expires old pairings", async () => {
        (OfflinePairing.update as jest.Mock).mockResolvedValue([2]);
        const now = new Date();

        const result = await repo.expireOld(now);

        expect(OfflinePairing.update).toHaveBeenCalledWith(
            { status: OfflinePairingStatus.EXPIRED, updatedAt: now },
            { where: { status: OfflinePairingStatus.ACTIVE, expiresAt: { [Op.lt]: now } } },
        );
        expect(result).toEqual([2]);
    });
});

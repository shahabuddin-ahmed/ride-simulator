import { Op } from "sequelize";
import DriverRepo from "../../../src/repo/driver";
import Driver from "../../../src/model/driver";

jest.mock("../../../src/model/driver");

describe("DriverRepo", () => {
    const repo = new DriverRepo();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("finds by user id", async () => {
        const driver = { id: 1 };
        (Driver.findOne as jest.Mock).mockResolvedValue(driver);

        const result = await repo.findByUserId(5);

        expect(Driver.findOne).toHaveBeenCalledWith({ where: { userId: 5 } });
        expect(result).toBe(driver);
    });

    it("updates online status and returns driver when affected", async () => {
        const driver = { id: 2 };
        (Driver.update as jest.Mock).mockResolvedValue([1]);
        (Driver.findOne as jest.Mock).mockResolvedValue(driver);

        const result = await repo.updateOnlineStatusByUserId(7, true);

        expect(Driver.update).toHaveBeenCalledWith(
            { isOnline: true, lastPingAt: expect.any(Date) },
            { where: { userId: 7 } },
        );
        expect(Driver.findOne).toHaveBeenCalledWith({ where: { userId: 7 } });
        expect(result).toBe(driver);
    });

    it("returns null when online status update affects no rows", async () => {
        (Driver.update as jest.Mock).mockResolvedValue([0]);

        const result = await repo.updateOnlineStatusByUserId(7, false);

        expect(result).toBeNull();
        expect(Driver.findOne).not.toHaveBeenCalled();
    });

    it("updates location and returns driver when affected", async () => {
        const driver = { id: 3 };
        (Driver.update as jest.Mock).mockResolvedValue([1]);
        (Driver.findOne as jest.Mock).mockResolvedValue(driver);

        const result = await repo.updateLocationByUserId(8, 1.1, 2.2);

        expect(Driver.update).toHaveBeenCalledWith(
            { currentLat: 1.1, currentLng: 2.2, lastPingAt: expect.any(Date) },
            { where: { userId: 8 } },
        );
        expect(Driver.findOne).toHaveBeenCalledWith({ where: { userId: 8 } });
        expect(result).toBe(driver);
    });

    it("returns null when location update affects no rows", async () => {
        (Driver.update as jest.Mock).mockResolvedValue([0]);

        const result = await repo.updateLocationByUserId(8, 1, 2);

        expect(result).toBeNull();
        expect(Driver.findOne).not.toHaveBeenCalled();
    });

    it("finds fresh online drivers with location", async () => {
        const since = new Date();
        const drivers = [{ id: 4 }];
        (Driver.findAll as jest.Mock).mockResolvedValue(drivers);

        const result = await repo.findFreshOnlineDriversWithLocation(since);

        expect(Driver.findAll).toHaveBeenCalledWith({
            where: {
                isOnline: true,
                lastPingAt: { [Op.gte]: since },
                currentLat: { [Op.ne]: null },
                currentLng: { [Op.ne]: null },
            },
        });
        expect(result).toBe(drivers);
    });
});

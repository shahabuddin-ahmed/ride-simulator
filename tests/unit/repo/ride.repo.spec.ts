import { Op } from "sequelize";
import { RideRepo } from "../../../src/repo/ride";
import Ride from "../../../src/model/ride";
import OfflinePairing from "../../../src/model/offline-paring";
import UserRepo from "../../../src/repo/user";
import { OfflinePairingStatus, RideStatus, RideType } from "../../../src/constant/common";

jest.mock("../../../src/model/ride");
jest.mock("../../../src/model/offline-paring");

describe("RideRepo", () => {
    const repo = new RideRepo();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a ride", async () => {
        const payload: any = { riderId: 1, pickupLat: 1, pickupLng: 2, dropoffLat: 3, dropoffLng: 4 };
        (Ride.create as jest.Mock).mockResolvedValue({ id: 10, ...payload });

        const result = await repo.create(payload);

        expect(Ride.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ id: 10, ...payload });
    });

    it("finds active ride by rider with correct status filter", async () => {
        const ride = { id: 1 };
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findActiveRideByRider(7);

        expect(Ride.findOne).toHaveBeenCalledWith({
            where: {
                riderId: 7,
                scheduledAt: null,
                status: {
                    [Op.in]: [RideStatus.REQUESTED, RideStatus.ASSIGNED, RideStatus.ACCEPTED, RideStatus.STARTED],
                },
            },
            order: [["createdAt", "DESC"]],
        });
        expect(result).toBe(ride);
    });

    it("finds active ride by rider when scheduledAt is provided", async () => {
        const ride = { id: 2 };
        const scheduledAt = new Date("2024-01-01T10:00:00Z");
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findActiveRideByRider(9, scheduledAt);

        expect(Ride.findOne).toHaveBeenCalledWith({
            where: {
                riderId: 9,
                scheduledAt,
                status: {
                    [Op.in]: [RideStatus.REQUESTED, RideStatus.ASSIGNED, RideStatus.ACCEPTED, RideStatus.STARTED],
                },
            },
            order: [["createdAt", "DESC"]],
        });
        expect(result).toBe(ride);
    });

    it("creates offline ride and marks pairing as used in one transaction", async () => {
        const payload: any = { riderId: 1, driverId: 2 };
        const transaction = { id: "tx" };
        (Ride.create as jest.Mock).mockResolvedValue({ id: 3 });
        (OfflinePairing.update as jest.Mock).mockResolvedValue([1]);
        jest.spyOn(UserRepo, "withTransaction").mockImplementation(async (fn: any) => fn(transaction));

        const result = await repo.createOffline(payload, 9);

        expect(UserRepo.withTransaction).toHaveBeenCalled();
        expect(Ride.create).toHaveBeenCalledWith(payload, { transaction });
        expect(OfflinePairing.update).toHaveBeenCalledWith(
            { status: OfflinePairingStatus.USED },
            { where: { id: 9 }, transaction },
        );
        expect(result).toEqual({ id: 3 });
    });

    it("finds due scheduled rides", async () => {
        const now = new Date();
        (Ride.findAll as jest.Mock).mockResolvedValue([{ id: 1 }]);

        const result = await repo.findDueScheduled(now);

        expect(Ride.findAll).toHaveBeenCalledWith({
            where: {
                type: RideType.SCHEDULED,
                status: RideStatus.REQUESTED,
                scheduledAt: { [Op.lte]: now },
            },
        });
        expect(result).toEqual([{ id: 1 }]);
    });

    it("finds by id", async () => {
        const ride = { id: 5 };
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findById(5);

        expect(Ride.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
        expect(result).toBe(ride);
    });

    it("finds ride with details", async () => {
        const ride = { id: 6 };
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findRideWithDetails(6);

        expect(Ride.findOne).toHaveBeenCalledWith({
            where: { id: 6 },
            include: [
                { model: expect.any(Function), as: "driver", required: false, attributes: { exclude: ["password"] } },
                { model: expect.any(Function), as: "rider", required: false, attributes: { exclude: ["password"] } },
            ],
        });
        expect(result).toBe(ride);
    });

    it("finds by rider id", async () => {
        const ride = { id: 7 };
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findByRiderId(7, 55);

        expect(Ride.findOne).toHaveBeenCalledWith({ where: { id: 7, riderId: 55 } });
        expect(result).toBe(ride);
    });

    it("finds by driver id", async () => {
        const ride = { id: 8 };
        (Ride.findOne as jest.Mock).mockResolvedValue(ride);

        const result = await repo.findByDriverId(8, 44);

        expect(Ride.findOne).toHaveBeenCalledWith({ where: { id: 8, driverId: 44 } });
        expect(result).toBe(ride);
    });

    it("updates ride", async () => {
        (Ride.update as jest.Mock).mockResolvedValue([1]);

        const result = await repo.update(9, { status: RideStatus.ACCEPTED });

        expect(Ride.update).toHaveBeenCalledWith({ status: RideStatus.ACCEPTED }, { where: { id: 9 } });
        expect(result).toEqual([1]);
    });
});

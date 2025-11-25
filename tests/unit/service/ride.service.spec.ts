import { BadRequestException } from "../../../src/web/exception/bad-request-exception";
import { NotFoundException } from "../../../src/web/exception/not-found-exception";
import { RideService } from "../../../src/service/ride";
import { RideStatus, RideType } from "../../../src/constant/common";

jest.mock("../../../src/config/config", () => ({
    __esModule: true,
    default: {
        RIDE_PRICING: { BASE_FARE: 10, PER_KM_RATE: 2, MIN_FARE: 5 },
        RIDE_ASSIGNMENT: { NEARBY_RADIUS_KM: 5, DRIVER_LOCATION_FRESH_MINUTES: 3 },
        RIDE_SCHEDULING_DAYS_AHEAD: 30,
    },
}));

const rideRepo = {
    create: jest.fn(),
    findActiveRideByRider: jest.fn(),
    createOffline: jest.fn(),
    findRideWithDetails: jest.fn(),
    findDueScheduled: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByRiderId: jest.fn(),
    findByDriverId: jest.fn(),
} as any;

const driverRepo = {
    findFreshOnlineDriversWithLocation: jest.fn(),
} as any;

const offlinePairingRepo = {
    findActiveByCode: jest.fn(),
} as any;

describe("RideService", () => {
    let service: RideService;

    beforeEach(() => {
        jest.clearAllMocks();
        rideRepo.create.mockReset().mockResolvedValue(null);
        rideRepo.findActiveRideByRider.mockReset().mockResolvedValue(null);
        rideRepo.createOffline.mockReset();
        rideRepo.findRideWithDetails.mockReset();
        rideRepo.findDueScheduled.mockReset();
        rideRepo.update.mockReset();
        rideRepo.findById.mockReset();
        rideRepo.findByRiderId.mockReset();
        rideRepo.findByDriverId.mockReset();
        driverRepo.findFreshOnlineDriversWithLocation.mockReset();
        offlinePairingRepo.findActiveByCode.mockReset();
        service = new RideService(rideRepo, driverRepo, offlinePairingRepo);
    });

    describe("createScheduledRide", () => {
        it("throws when scheduledAt is not in future", async () => {
            const now = new Date();
            await expect(
                service.createScheduledRide({
                    riderId: 1,
                    pickupLat: 0,
                    pickupLng: 0,
                    dropoffLat: 0,
                    dropoffLng: 0,
                    scheduledAt: now,
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("throws when scheduledAt exceeds max days ahead", async () => {
            const future = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

            await expect(
                service.createScheduledRide({
                    riderId: 1,
                    pickupLat: 0,
                    pickupLng: 0,
                    dropoffLat: 0,
                    dropoffLng: 0,
                    scheduledAt: future,
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("creates scheduled ride with calculated price", async () => {
            const scheduledAt = new Date(Date.now() + 60 * 1000);
            const createdRide = { id: 1 };
            rideRepo.create.mockResolvedValue(createdRide);
            rideRepo.findActiveRideByRider.mockResolvedValue(null);

            const result = await service.createScheduledRide({
                riderId: 2,
                pickupLat: 0,
                pickupLng: 0,
                dropoffLat: 0,
                dropoffLng: 0,
                scheduledAt,
            });

            expect(rideRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    riderId: 2,
                    price: 10,
                    type: RideType.SCHEDULED,
                    status: RideStatus.REQUESTED,
                    scheduledAt,
                }),
            );
            expect(result).toBe(createdRide);
        });
    });

    describe("createOnlineRide", () => {
        it("creates online ride and assigns driver", async () => {
            const createdRide = { id: 1, pickupLat: 0, pickupLng: 0, dropoffLat: 0, dropoffLng: 0 };
            rideRepo.create.mockResolvedValue(createdRide);
            rideRepo.findActiveRideByRider.mockResolvedValue(null);
            const assignSpy = jest.spyOn<any, any>(service as any, "assignNearestDriver").mockResolvedValue({ id: 99 });

            const result = await service.createOnlineRide({
                riderId: 3,
                pickupLat: 0,
                pickupLng: 0,
                dropoffLat: 0,
                dropoffLng: 0,
            });

            expect(rideRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    riderId: 3,
                    price: 10,
                    type: RideType.ONLINE,
                    status: RideStatus.REQUESTED,
                }),
            );
            expect(assignSpy).toHaveBeenCalledWith(createdRide);
            expect(result).toEqual({ id: 99 });
        });
    });

    describe("assignNearestDriver", () => {
        it("marks ride as no driver when none are available", async () => {
            const ride = { id: 1, pickupLat: 0, pickupLng: 0 };
            driverRepo.findFreshOnlineDriversWithLocation.mockResolvedValue([]);
            rideRepo.update.mockResolvedValue([1]);
            rideRepo.findRideWithDetails.mockResolvedValue({ id: 1, status: RideStatus.NO_DRIVER });

            const result = await (service as any).assignNearestDriver(ride);

            expect(rideRepo.update).toHaveBeenCalledWith(1, { status: RideStatus.NO_DRIVER });
            expect(result).toEqual({ id: 1, status: RideStatus.NO_DRIVER });
        });

        it("assigns nearest driver within radius", async () => {
            const ride = { id: 2, pickupLat: 0, pickupLng: 0 };
            const drivers = [
                { userId: 10, currentLat: 0.02, currentLng: 0.02 },
                { userId: 20, currentLat: 0.01, currentLng: 0.01 },
            ];
            driverRepo.findFreshOnlineDriversWithLocation.mockResolvedValue(drivers);
            rideRepo.update.mockResolvedValue([1]);
            rideRepo.findRideWithDetails.mockResolvedValue({ id: 2, driverId: 20, status: RideStatus.ASSIGNED });

            const result = await (service as any).assignNearestDriver(ride);

            expect(rideRepo.update).toHaveBeenCalledWith(2, { driverId: 20, status: RideStatus.ASSIGNED });
            expect(result).toEqual({ id: 2, driverId: 20, status: RideStatus.ASSIGNED });
        });
    });

    describe("createOfflineRide", () => {
        it("throws when pairing code is invalid", async () => {
            offlinePairingRepo.findActiveByCode.mockResolvedValue(null);

            await expect(
                service.createOfflineRide({
                    pairingCode: "ABC",
                    riderId: 1,
                    pickupLat: 0,
                    pickupLng: 0,
                    dropoffLat: 0,
                    dropoffLng: 0,
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("creates offline ride and returns details", async () => {
            offlinePairingRepo.findActiveByCode.mockResolvedValue({ id: 5, driverId: 9 });
            rideRepo.createOffline.mockResolvedValue({ id: 11 });
            rideRepo.findRideWithDetails.mockResolvedValue({ id: 11, driverId: 9 });

            const result = await service.createOfflineRide({
                pairingCode: "CODE",
                riderId: 1,
                pickupLat: 0,
                pickupLng: 0,
                dropoffLat: 0,
                dropoffLng: 0,
            });

            expect(rideRepo.createOffline).toHaveBeenCalledWith(
                expect.objectContaining({
                    driverId: 9,
                    type: RideType.OFFLINE,
                    status: RideStatus.COMPLETED,
                }),
                5,
            );
            expect(result).toEqual({ id: 11, driverId: 9 });
        });
    });

    describe("getById", () => {
        it("throws when ride not found", async () => {
            rideRepo.findById.mockResolvedValue(null);

            await expect(service.getById(7)).rejects.toBeInstanceOf(NotFoundException);
        });

        it("returns ride when found", async () => {
            const ride = { id: 7 };
            rideRepo.findById.mockResolvedValue(ride);

            const result = await service.getById(7);

            expect(result).toBe(ride);
        });
    });

    describe("processDueScheduledRides", () => {
        it("assigns each due ride", async () => {
            const rides = [{ id: 1 }, { id: 2 }];
            rideRepo.findDueScheduled.mockResolvedValue(rides);
            const assignSpy = jest.spyOn<any, any>(service as any, "assignNearestDriver").mockResolvedValue(null);

            const result = await service.processDueScheduledRides();

            expect(assignSpy).toHaveBeenCalledTimes(2);
            expect(result).toBe(2);
        });
    });
});

import { DriverService } from "../../../src/service/driver";
import { OfflineParingStatus } from "../../../src/constant/common";
import { BadRequestException } from "../../../src/web/exception/bad-request-exception";
import { NotFoundException } from "../../../src/web/exception/not-found-exception";

jest.mock("../../../src/config/config", () => ({
    __esModule: true,
    default: {
        OTP_EXPIRY_MINUTES: 5,
    },
}));

jest.mock("../../../src/utils/otp", () => ({
    generateCode: jest.fn(() => "123456"),
}));

const driverRepo = {
    updateOnlineStatusByUserId: jest.fn(),
    updateLocationByUserId: jest.fn(),
} as any;

const offlinePairingRepo = {
    expireOld: jest.fn(),
    create: jest.fn(),
} as any;

describe("DriverService", () => {
    const service = new DriverService(driverRepo, offlinePairingRepo);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("updateStatus", () => {
        it("throws when driver not found", async () => {
            driverRepo.updateOnlineStatusByUserId.mockResolvedValue(null);

            await expect(service.updateStatus({ userId: 1, isOnline: true })).rejects.toBeInstanceOf(NotFoundException);
        });

        it("returns updated driver", async () => {
            const driver = { id: 1 };
            driverRepo.updateOnlineStatusByUserId.mockResolvedValue(driver);

            const result = await service.updateStatus({ userId: 2, isOnline: false });

            expect(driverRepo.updateOnlineStatusByUserId).toHaveBeenCalledWith(2, false);
            expect(result).toBe(driver);
        });
    });

    describe("updateLocation", () => {
        it("throws for invalid coordinates", async () => {
            await expect(service.updateLocation({ userId: 1, lat: 200, lng: 0 })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it("throws when driver not found", async () => {
            driverRepo.updateLocationByUserId.mockResolvedValue(null);

            await expect(service.updateLocation({ userId: 1, lat: 1, lng: 2 })).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it("updates location and returns driver", async () => {
            const driver = { id: 1 };
            driverRepo.updateLocationByUserId.mockResolvedValue(driver);

            const result = await service.updateLocation({ userId: 3, lat: 1, lng: 2 });

            expect(driverRepo.updateLocationByUserId).toHaveBeenCalledWith(3, 1, 2);
            expect(result).toBe(driver);
        });
    });

    describe("generateOfflineParing", () => {
        it("expires old, creates pairing with code and expiry", async () => {
            const now = new Date();
            const pairing = { id: 7 };
            const expireSpy = offlinePairingRepo.expireOld.mockResolvedValue([1]);
            offlinePairingRepo.create.mockImplementation(async (payload: any) => ({ ...payload, ...pairing }));
            jest.useFakeTimers().setSystemTime(now);

            const result = await service.generateOfflineParing(11);

            expect(expireSpy).toHaveBeenCalledWith(now);
            expect(offlinePairingRepo.create).toHaveBeenCalledWith({
                driverId: 11,
                code: "123456",
                status: OfflineParingStatus.ACTIVE,
                expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
            });
            expect(result).toMatchObject({ driverId: 11, code: "123456", status: OfflineParingStatus.ACTIVE });
            jest.useRealTimers();
        });
    });
});

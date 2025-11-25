import { DriverInterface } from "../model/driver";
import { DriverRepoInterface } from "../repo/driver";
import { ERROR_CODES } from "../constant/error";
import { NotFoundException } from "../web/exception/not-found-exception";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { OfflineParingInterface } from "../model/offline-paring";
import { OfflineParingRepoInterface } from "../repo/offline-paring";
import { OfflineParingStatus } from "../constant/common";
import { generateCode } from "../utils/otp";
import config from "../config/config";
import { UpdateDriverLocationInput, UpdateDriverStatusInput } from "./types";

export interface DriverServiceInterface {
    updateStatus(input: UpdateDriverStatusInput): Promise<DriverInterface>;
    updateLocation(input: UpdateDriverLocationInput): Promise<DriverInterface>;
    generateOfflineParing(userId: number): Promise<OfflineParingInterface>;
}
export class DriverService implements DriverServiceInterface {
    constructor(private driverRepo: DriverRepoInterface, private offlineParingRepo: OfflineParingRepoInterface) {
        this.driverRepo = driverRepo;
        this.offlineParingRepo = offlineParingRepo;
    }

    async updateStatus(input: UpdateDriverStatusInput): Promise<DriverInterface> {
        const driver = await this.driverRepo.updateOnlineStatusByUserId(input.userId, input.isOnline);

        if (!driver) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Driver not found");
        }

        return driver;
    }

    async updateLocation(input: UpdateDriverLocationInput): Promise<DriverInterface> {
        if (input.lat < -90 || input.lat > 90 || input.lng < -180 || input.lng > 180) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Invalid coordinates");
        }

        const driver = await this.driverRepo.updateLocationByUserId(input.userId, input.lat, input.lng);

        if (!driver) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Driver not found");
        }

        return driver;
    }

    async generateOfflineParing(userId: number): Promise<OfflineParingInterface> {
        const now = new Date();
        await this.offlineParingRepo.expireOld(now);

        const code = generateCode();
        const expiresAt = new Date(now.getTime() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

        const paring: OfflineParingInterface = {
            driverId: userId, // note: references users.id
            code,
            status: OfflineParingStatus.ACTIVE,
            expiresAt,
        };

        return this.offlineParingRepo.create(paring);
    }
}

export const newDriverService = async (
    driverRepo: DriverRepoInterface,
    offlineParingRepo: OfflineParingRepoInterface,
): Promise<DriverService> => {
    return new DriverService(driverRepo, offlineParingRepo);
};

import { DriverInterface } from "../model/driver";
import { DriverRepoInterface } from "../repo/driver";
import { ERROR_CODES } from "../constant/error";
import { NotFoundException } from "../web/exception/not-found-exception";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { OfflinePairingInterface } from "../model/offline-pairing";
import { OfflinePairingRepoInterface } from "../repo/offline-paring";
import { OfflinePairingStatus } from "../constant/common";
import { generateCode } from "../utils/otp";
import config from "../config/config";

export interface UpdateDriverStatusInput {
    userId: number; // from JWT
    isOnline: boolean;
}

export interface UpdateDriverLocationInput {
    userId: number; // from JWT
    lat: number;
    lng: number;
}

export interface DriverServiceInterface {
    updateStatus(input: UpdateDriverStatusInput): Promise<DriverInterface>;
    updateLocation(input: UpdateDriverLocationInput): Promise<DriverInterface>;
    generateOfflinePairing(userId: number): Promise<OfflinePairingInterface>;
}

export class DriverService implements DriverServiceInterface {
    constructor(private driverRepo: DriverRepoInterface, private offlinePairingRepo: OfflinePairingRepoInterface) {
        this.driverRepo = driverRepo;
        this.offlinePairingRepo = offlinePairingRepo;
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

    async generateOfflinePairing(userId: number): Promise<OfflinePairingInterface> {
        const now = new Date();
        await this.offlinePairingRepo.expireOld(now);

        const code = generateCode();
        const expiresAt = new Date(now.getTime() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

        const pairing: OfflinePairingInterface = {
            driverId: userId, // note: references users.id
            code,
            status: OfflinePairingStatus.ACTIVE,
            expiresAt,
        };

        return this.offlinePairingRepo.create(pairing);
    }
}

export const newDriverService = async (
    driverRepo: DriverRepoInterface,
    offlinePairingRepo: OfflinePairingRepoInterface,
): Promise<DriverService> => {
    return new DriverService(driverRepo, offlinePairingRepo);
};

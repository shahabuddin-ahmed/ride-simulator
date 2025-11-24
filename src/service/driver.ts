import { DriverInterface } from "../model/driver";
import { DriverRepoInterface } from "../repo/driver";
import { ERROR_CODES } from "../constant/error";
import { NotFoundException } from "../web/exception/not-found-exception";
import { BadRequestException } from "../web/exception/bad-request-exception";

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
}

export class DriverService implements DriverServiceInterface {
    constructor(private driverRepo: DriverRepoInterface) {
        this.driverRepo = driverRepo;
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
}

export const newDriverService = async (driverRepo: DriverRepoInterface): Promise<DriverService> => {
    return new DriverService(driverRepo);
};

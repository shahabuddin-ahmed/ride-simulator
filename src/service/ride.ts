import { randomBytes } from "crypto";
import { ERROR_CODES } from "../constant/error";
import { PaymentStatus, RideStatus, RideType } from "../constant/common";
import Ride, { RideInterface } from "../model/ride";
import { RideRepoInterface } from "../repo/ride";
import { DriverRepoInterface } from "../repo/driver";
import { NotFoundException } from "../web/exception/not-found-exception";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { OfflinePairingRepoInterface } from "../repo/offline-paring";
import config from "../config/config";
import { OfflineRideCreateInput, OnlineRideCreateInput, ScheduledRideCreateInput } from "./types";

export interface RideServiceInterface {
    createOnlineRide(input: OnlineRideCreateInput): Promise<RideInterface | null>;
    getById(id: number): Promise<RideInterface>;
    driverAcceptRide(rideId: number, driverId: number): Promise<RideInterface | null>;
    driverStartRide(rideId: number, driverId: number): Promise<RideInterface | null>;
    driverCompleteRide(rideId: number, driverId: number): Promise<RideInterface | null>;
    riderCancelRide(rideId: number, riderId: number): Promise<RideInterface | null>;
    driverCancelRide(rideId: number, driverId: number): Promise<RideInterface | null>;
    createScheduledRide(input: ScheduledRideCreateInput): Promise<RideInterface>;
    processDueScheduledRides(): Promise<number>;
    createOfflineRide(input: OfflineRideCreateInput): Promise<RideInterface | null>;
}

export class RideService implements RideServiceInterface {
    constructor(
        private rideRepo: RideRepoInterface,
        private driverRepo: DriverRepoInterface,
        private offlinePairingRepo: OfflinePairingRepoInterface,
    ) {
        this.rideRepo = rideRepo;
        this.driverRepo = driverRepo;
        this.offlinePairingRepo = offlinePairingRepo;
    }

    // ========= ONLINE =========
    async createOnlineRide(input: OnlineRideCreateInput): Promise<RideInterface | null> {
        const existing = await this.rideRepo.findActiveRideByRider(input.riderId);
        if (existing) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "An active ride already exists for this rider");
        }
        const price = this.calculatePrice(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);

        const payload: RideInterface = {
            riderId: input.riderId,
            driverId: null,
            pickupLat: input.pickupLat,
            pickupLng: input.pickupLng,
            dropoffLat: input.dropoffLat,
            dropoffLng: input.dropoffLng,
            price,
            rideCode: this.generateRideCode(),
            type: RideType.ONLINE,
            status: RideStatus.REQUESTED,
            paymentStatus: PaymentStatus.UNPAID,
        };

        const created = await this.rideRepo.create(payload);

        /*
        Immediately try to assign the nearest online driver based on live driver locations.
        If no suitable driver is found, the ride status will be updated to NO_DRIVER.
        NOTE: In this implementation I auto-assign a single nearest driver as a simplification.
        In a production system, the backend would usually notify multiple nearby drivers
        and assign the ride to the first one who accepts the request, expiring all other offers.
        */
        return this.assignNearestDriver(created);
    }

    // ========= SCHEDULED =========

    async createScheduledRide(input: ScheduledRideCreateInput): Promise<RideInterface> {
        const now = new Date();
        if (input.scheduledAt <= now) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "scheduledAt must be in the future");
        }

        now.setDate(now.getDate() + config.RIDE_SCHEDULING_DAYS_AHEAD);
        if (input.scheduledAt > now) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                `scheduledAt cannot be more than ${config.RIDE_SCHEDULING_DAYS_AHEAD} days in advance`,
            );
        }

        // currently check only same time but it should be extended to a time window
        const existing = await this.rideRepo.findActiveRideByRider(input.riderId, input.scheduledAt);
        if (existing) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "A scheduled ride already exists for this rider at the specified time",
            );
        }

        const price = this.calculatePrice(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);

        const payload: RideInterface = {
            riderId: input.riderId,
            pickupLat: input.pickupLat,
            pickupLng: input.pickupLng,
            dropoffLat: input.dropoffLat,
            dropoffLng: input.dropoffLng,
            driverId: null,
            price,
            rideCode: this.generateRideCode(),
            type: RideType.SCHEDULED,
            status: RideStatus.REQUESTED,
            paymentStatus: PaymentStatus.UNPAID,
            scheduledAt: input.scheduledAt,
        };

        return this.rideRepo.create(payload);
    }

    // ========= PROCESS SCHEDULED RIDES =========
    // Cron-like processing: assign drivers for due scheduled rides.
    async processDueScheduledRides(): Promise<number> {
        const now = new Date();
        const dueRides = await this.rideRepo.findDueScheduled(now);

        let processed = 0;
        for (const ride of dueRides) {
            await this.assignNearestDriver(ride);
            processed++;
        }

        return processed;
    }

    // ========= OFFLINE =========

    async createOfflineRide(input: OfflineRideCreateInput): Promise<Ride | null> {
        const pairing = await this.offlinePairingRepo.findActiveByCode(input.pairingCode);
        if (!pairing) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Invalid or expired offline pairing code");
        }

        const price = this.calculatePrice(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);

        const payload: RideInterface = {
            riderId: input.riderId,
            driverId: pairing.driverId,
            pickupLat: input.pickupLat,
            pickupLng: input.pickupLng,
            dropoffLat: input.dropoffLat,
            dropoffLng: input.dropoffLng,
            price,
            rideCode: this.generateRideCode(),
            type: RideType.OFFLINE,
            status: RideStatus.COMPLETED, // offline rides recorded after completion
            paymentStatus: PaymentStatus.PAID,
        };

        const created = await this.rideRepo.createOffline(payload, pairing.id!);
        return this.rideRepo.findRideWithDetails(created.id!);
    }

    async getById(id: number): Promise<RideInterface> {
        const ride = await this.rideRepo.findById(id);
        if (!ride) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Ride not found");
        }
        return ride;
    }

    /**
     * Assign nearest online driver based on driver's currentLat/currentLng.
     * All DB fetches go through repos.
     */
    private async assignNearestDriver(ride: RideInterface): Promise<RideInterface | null> {
        const freshSince = new Date(Date.now() - config.RIDE_ASSIGNMENT.DRIVER_LOCATION_FRESH_MINUTES * 60 * 1000);

        const drivers = await this.driverRepo.findFreshOnlineDriversWithLocation(freshSince);

        if (!drivers.length) {
            await this.rideRepo.update(ride.id!, {
                status: RideStatus.NO_DRIVER,
            });

            return this.rideRepo.findRideWithDetails(ride.id!);
        }

        const candidates = drivers
            .map((driver) => {
                const distanceKm = this.calculateDistanceKm(
                    ride.pickupLat,
                    ride.pickupLng,
                    driver.currentLat!,
                    driver.currentLng!,
                );
                return { driver, distanceKm };
            })
            .filter((item) => item.distanceKm <= config.RIDE_ASSIGNMENT.NEARBY_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        if (!candidates.length) {
            await this.rideRepo.update(ride.id!, {
                status: RideStatus.NO_DRIVER,
            });
            return this.rideRepo.findById(ride.id!);
        }

        const chosenDriver = candidates[0].driver;

        await this.rideRepo.update(ride.id!, {
            driverId: chosenDriver.userId,
            status: RideStatus.ASSIGNED,
        });

        return this.rideRepo.findRideWithDetails(ride.id!);
    }

    /**
     * Simple Haversine distance in KM.
     */
    private calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const toRad = (value: number) => (value * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const R = 6371; // radius of Earth in KM

        return R * c;
    }

    private async loadOnlineRideOrThrow(id: number): Promise<RideInterface> {
        const ride = await this.rideRepo.findById(id);
        if (!ride) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Ride not found");
        }
        if (ride.type !== RideType.ONLINE) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Operation allowed only for online rides");
        }
        return ride as unknown as RideInterface;
    }

    private calculatePrice(pickupLat: number, pickupLng: number, dropoffLat: number, dropoffLng: number): number {
        const distanceKm = this.calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
        const raw = config.RIDE_PRICING.BASE_FARE + distanceKm * config.RIDE_PRICING.PER_KM_RATE;
        return Number(Math.max(raw, config.RIDE_PRICING.MIN_FARE).toFixed(2));
    }

    private generateRideCode(): string {
        const random = randomBytes(3).toString("hex").toUpperCase(); // 6 chars
        const time = Date.now().toString(36).toUpperCase();
        return `${time}${random}`;
    }

    private ensureDriver(ride: RideInterface, driverId: number): void {
        if (!ride.driverId || ride.driverId !== driverId) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Ride does not belong to this driver");
        }
    }

    private async transitionStatusForDriver(
        rideId: number,
        driverId: number,
        allowedFromStatuses: RideStatus[],
        toStatus: RideStatus,
    ): Promise<RideInterface | null> {
        const ride = await this.loadOnlineRideOrThrow(rideId);
        this.ensureDriver(ride, driverId);

        if (!ride.status || !allowedFromStatuses.includes(ride.status)) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, `Invalid status transition from ${ride.status}`);
        }

        await this.rideRepo.update(rideId, {
            status: toStatus,
        });

        return this.rideRepo.findById(rideId);
    }

    async driverAcceptRide(rideId: number, driverId: number): Promise<RideInterface | null> {
        return this.transitionStatusForDriver(rideId, driverId, [RideStatus.ASSIGNED], RideStatus.ACCEPTED);
    }

    async driverStartRide(rideId: number, driverId: number): Promise<RideInterface | null> {
        return this.transitionStatusForDriver(rideId, driverId, [RideStatus.ACCEPTED], RideStatus.STARTED);
    }

    async driverCompleteRide(rideId: number, driverId: number): Promise<RideInterface | null> {
        // status STARTED → COMPLETED
        await this.transitionStatusForDriver(rideId, driverId, [RideStatus.STARTED], RideStatus.COMPLETED);

        // mark payment paid
        await this.rideRepo.update(rideId, {
            paymentStatus: PaymentStatus.PAID,
        });
        return this.rideRepo.findById(rideId);
    }

    async riderCancelRide(rideId: number, riderId: number): Promise<RideInterface | null> {
        const ride = await this.loadOnlineRideOrThrow(rideId);
        if (ride.riderId !== riderId) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Ride does not belong to this rider");
        }

        if (
            ride.status === RideStatus.COMPLETED ||
            ride.status === RideStatus.CANCELLED_BY_RIDER ||
            ride.status === RideStatus.CANCELLED_BY_DRIVER
        ) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, `Cannot cancel ride with status ${ride.status}`);
        }

        await this.rideRepo.update(rideId, {
            status: RideStatus.CANCELLED_BY_RIDER,
        });
        return this.rideRepo.findById(rideId);
    }

    async driverCancelRide(rideId: number, driverId: number): Promise<RideInterface | null> {
        const ride = await this.loadOnlineRideOrThrow(rideId);
        this.ensureDriver(ride, driverId);

        if (
            ride.status === RideStatus.COMPLETED ||
            ride.status === RideStatus.CANCELLED_BY_RIDER ||
            ride.status === RideStatus.CANCELLED_BY_DRIVER
        ) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, `Cannot cancel ride with status ${ride.status}`);
        }

        await this.rideRepo.update(rideId, {
            status: RideStatus.CANCELLED_BY_DRIVER,
        });
        return this.rideRepo.findById(rideId);
    }
}

export const newRideService = async (
    rideRepo: RideRepoInterface,
    driverRepo: DriverRepoInterface,
    offlinePairingRepo: OfflinePairingRepoInterface,
): Promise<RideService> => {
    return new RideService(rideRepo, driverRepo, offlinePairingRepo);
};

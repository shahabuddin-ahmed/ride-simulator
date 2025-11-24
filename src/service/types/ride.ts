import { RideInterface } from "../../model/ride";

export interface OnlineRideCreateInput {
    riderId: number;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
}

export interface ScheduledRideCreateInput extends OnlineRideCreateInput {
    scheduledAt: Date;
}

export interface OfflineRideCreateInput {
    riderId: number;
    pairingCode: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
}

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

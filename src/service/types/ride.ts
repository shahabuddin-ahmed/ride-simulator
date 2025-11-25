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
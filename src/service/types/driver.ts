import { DriverInterface } from "../../model/driver";
import { OfflinePairingInterface } from "../../model/offline-pairing";

export interface UpdateDriverStatusInput {
    userId: number; // from JWT
    isOnline: boolean;
}

export interface UpdateDriverLocationInput {
    userId: number; // from JWT
    lat: number;
    lng: number;
}

import { DriverInterface } from "../../model/driver";
import { OfflineParingInterface } from "../../model/offline-paring";

export interface UpdateDriverStatusInput {
    userId: number; // from JWT
    isOnline: boolean;
}

export interface UpdateDriverLocationInput {
    userId: number; // from JWT
    lat: number;
    lng: number;
}

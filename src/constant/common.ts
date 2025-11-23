export enum DriverStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    OFFLINE = "offline",
}

export enum PaymentStatus {
    PAID = "paid",
    UNPAID = "unpaid",
}

export enum UserType {
    RIDER = "rider",
    DRIVER = "driver",
}

export enum VehicleStatus {
    ACTIVE = "active",
    MAINTENANCE = "maintenance",
    INACTIVE = "inactive",
}

export enum RideType {
    ONLINE = "online",
    OFFLINE = "offline",
    SCHEDULED = "scheduled",
}

export enum RideStatus {
    REQUESTED = "requested",
    ASSIGNED = "assigned",
    ACCEPTED = "accepted",
    STARTED = "started",
    COMPLETED = "completed",
    CANCELLED_BY_RIDER = "cancelled_by_rider",
    CANCELLED_BY_DRIVER = "cancelled_by_driver",
    NO_DRIVER = "no_driver",
}

export enum OfflinePairingStatus {
    ACTIVE = "active",
    USED = "used",
    EXPIRED = "expired",
}

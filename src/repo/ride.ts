import { Op } from "sequelize";
import Ride, { RideInterface } from "../model/ride";
import User from "../model/user";
import { OfflineParingStatus, RideStatus, RideType } from "../constant/common";
import UserRepo from "./user";
import OfflineParing from "../model/offline-paring";

export interface RideRepoInterface {
    create(ride: RideInterface): Promise<Ride>;
    findActiveRideByRider(riderId: number, scheduledAt?: Date): Promise<Ride | null>;
    createOffline(ride: RideInterface, offlineParingId: number): Promise<Ride>;
    findById(id: number): Promise<Ride | null>;
    findByRiderId(id: number, riderId: number): Promise<Ride | null>;
    findByDriverId(id: number, driverId: number): Promise<Ride | null>;
    findRideWithDetails(id: number): Promise<Ride | null>;
    update(id: number, update: Partial<RideInterface>): Promise<[affectedCount: number]>;
    findDueScheduled(now: Date): Promise<RideInterface[]>;
}

export class RideRepo implements RideRepoInterface {
    public async create(ride: RideInterface): Promise<Ride> {
        return Ride.create(ride);
    }
    public async createOffline(ride: RideInterface, offlineParingId: number): Promise<Ride> {
        return UserRepo.withTransaction<Ride>(async (transaction) => {
            const createdRide = await Ride.create(ride, { transaction });
            await OfflineParing.update(
                {
                    status: OfflineParingStatus.USED,
                },
                { where: { id: offlineParingId }, transaction },
            );
            return createdRide;
        });
    }

    public async findActiveRideByRider(riderId: number, scheduledAt?: Date): Promise<Ride | null> {
        return Ride.findOne({
            where: {
                riderId,
                scheduledAt: scheduledAt || null,
                status: {
                    [Op.in]: [RideStatus.REQUESTED, RideStatus.ASSIGNED, RideStatus.ACCEPTED, RideStatus.STARTED],
                },
            },
            order: [["createdAt", "DESC"]],
        });
    }

    public async findById(id: number): Promise<Ride | null> {
        return Ride.findOne({ where: { id } });
    }

    public async findRideWithDetails(id: number): Promise<Ride | null> {
        return Ride.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    as: "driver",
                    required: false,
                    attributes: { exclude: ["password"] },
                },
                {
                    model: User,
                    as: "rider",
                    required: false,
                    attributes: { exclude: ["password"] },
                },
            ],
        });
    }

    public async findByRiderId(id: number, riderId: number): Promise<Ride | null> {
        return Ride.findOne({ where: { id, riderId } });
    }

    public async findByDriverId(id: number, driverId: number): Promise<Ride | null> {
        return Ride.findOne({ where: { id, driverId } });
    }

    public async update(id: number, update: Partial<RideInterface>): Promise<[affectedCount: number]> {
        return Ride.update(update, { where: { id } });
    }

    public async findDueScheduled(now: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                type: RideType.SCHEDULED,
                status: RideStatus.REQUESTED,
                scheduledAt: {
                    [Op.lte]: now,
                },
            },
        });
    }
}

export const newRideRepo = async (): Promise<RideRepoInterface> => {
    return new RideRepo();
};

export default RideRepo;

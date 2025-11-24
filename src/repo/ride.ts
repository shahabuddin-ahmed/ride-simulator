import { Op } from "sequelize";
import Ride, { RideInterface } from "../model/ride";
import User from "../model/user";
import { OfflinePairingStatus, RideStatus, RideType } from "../constant/common";
import UserRepo from "./user";
import OfflinePairing from "../model/offline-pairing";

export interface RideRepoInterface {
    create(ride: RideInterface): Promise<Ride>;
    createOffline(ride: RideInterface, offlinePairingId: number): Promise<Ride>;
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
    public async createOffline(ride: RideInterface, offlinePairingId: number): Promise<Ride> {
        return UserRepo.withTransaction<Ride>(async (transaction) => {
            const createdRide = await Ride.create(ride, { transaction });
            await OfflinePairing.update(
                {
                    status: OfflinePairingStatus.USED,
                },
                { where: { id: offlinePairingId }, transaction },
            );
            return createdRide;
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

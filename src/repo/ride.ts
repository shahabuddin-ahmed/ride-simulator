import Driver from "../model/driver";
import Ride, { RideInterface } from "../model/ride";
import User from "../model/user";

export interface RideRepoInterface {
    create(ride: RideInterface): Promise<Ride>;
    findById(id: number): Promise<Ride | null>;
    findByRiderId(id: number, riderId: number): Promise<Ride | null>;
    findByDriverId(id: number, driverId: number): Promise<Ride | null>;
    findRideWithDetails(id: number): Promise<Ride | null>;
    update(id: number, update: Partial<RideInterface>): Promise<[affectedCount: number]>;
}

export class RideRepo implements RideRepoInterface {
    public async create(ride: RideInterface): Promise<Ride> {
        return Ride.create(ride);
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
                },
                {
                    model: User,
                    as: "rider",
                    required: false,
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
}

export const newRideRepo = async (): Promise<RideRepoInterface> => {
    return new RideRepo();
};

export default RideRepo;

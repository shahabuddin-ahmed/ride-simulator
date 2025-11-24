import { Op } from "sequelize";
import Driver, { DriverInterface } from "../model/driver";

export interface DriverRepoInterface {
    findByUserId(userId: number): Promise<Driver | null>;
    updateOnlineStatusByUserId(userId: number, isOnline: boolean): Promise<Driver | null>;
    updateLocationByUserId(userId: number, lat: number, lng: number): Promise<Driver | null>;
    findFreshOnlineDriversWithLocation(since: Date): Promise<Driver[]>;
}

export class DriverRepo implements DriverRepoInterface {
    public async findByUserId(userId: number): Promise<Driver | null> {
        return Driver.findOne({ where: { userId } });
    }

    public async updateOnlineStatusByUserId(userId: number, isOnline: boolean): Promise<Driver | null> {
        const [affected] = await Driver.update({ isOnline, lastPingAt: new Date() }, { where: { userId } });

        if (!affected) {
            return null;
        }

        return Driver.findOne({ where: { userId } });
    }

    public async updateLocationByUserId(userId: number, lat: number, lng: number): Promise<Driver | null> {
        const [affected] = await Driver.update(
            {
                currentLat: lat,
                currentLng: lng,
                lastPingAt: new Date(),
            },
            { where: { userId } },
        );

        if (!affected) {
            return null;
        }

        return Driver.findOne({ where: { userId } });
    }

    public async findFreshOnlineDriversWithLocation(since: Date): Promise<Driver[]> {
        return Driver.findAll({
            where: {
                isOnline: true,
                // lastPingAt: { [Op.gte]: since },
                currentLat: { [Op.ne]: null },
                currentLng: { [Op.ne]: null },
            },
        });
    }
}

export const newDriverRepo = async (): Promise<DriverRepoInterface> => {
    return new DriverRepo();
};

export default DriverRepo;
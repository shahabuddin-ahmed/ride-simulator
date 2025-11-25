import { Op, Transaction } from "sequelize";
import OfflineParing, { OfflineParingInterface } from "../model/offline-paring";
import { OfflineParingStatus } from "../constant/common";
import UserRepo from "./user";

export interface OfflineParingRepoInterface {
    create(paring: OfflineParingInterface): Promise<OfflineParing>;
    create(paring: OfflineParingInterface): Promise<OfflineParing>;
    findActiveByCode(code: string): Promise<OfflineParing | null>;
    markUsed(id: number): Promise<[affectedCount: number]>;
    expireOld(now: Date): Promise<[affectedCount: number]>;
}

export class OfflineParingRepo implements OfflineParingRepoInterface {
    public async create(paring: OfflineParingInterface): Promise<OfflineParing> {
        return OfflineParing.create(paring);
    }

    public async findActiveByCode(code: string): Promise<OfflineParing | null> {
        return OfflineParing.findOne({
            where: {
                code,
                status: OfflineParingStatus.ACTIVE,
                expiresAt: { [Op.gte]: new Date() },
            },
            order: [["createdAt", "DESC"]],
        });
    }

    public async markUsed(id: number): Promise<[affectedCount: number]> {
        return OfflineParing.update(
            {
                status: OfflineParingStatus.USED,
                updatedAt: new Date(),
            },
            { where: { id } },
        );
    }

    public async expireOld(now: Date): Promise<[affectedCount: number]> {
        return OfflineParing.update(
            {
                status: OfflineParingStatus.EXPIRED,
                updatedAt: now,
            },
            {
                where: {
                    status: OfflineParingStatus.ACTIVE,
                    expiresAt: { [Op.lt]: now },
                },
            },
        );
    }
}

export const newOfflineParingRepo = async (): Promise<OfflineParingRepoInterface> => {
    return new OfflineParingRepo();
};

export default OfflineParingRepo;

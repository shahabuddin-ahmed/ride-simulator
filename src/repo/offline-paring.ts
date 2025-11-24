import { Op, Transaction } from "sequelize";
import OfflinePairing, { OfflinePairingInterface } from "../model/offline-pairing";
import { OfflinePairingStatus } from "../constant/common";
import UserRepo from "./user";

export interface OfflinePairingRepoInterface {
    create(pairing: OfflinePairingInterface): Promise<OfflinePairing>;
    create(pairing: OfflinePairingInterface): Promise<OfflinePairing>;
    findActiveByCode(code: string): Promise<OfflinePairing | null>;
    markUsed(id: number): Promise<[affectedCount: number]>;
    expireOld(now: Date): Promise<[affectedCount: number]>;
}

export class OfflinePairingRepo implements OfflinePairingRepoInterface {
    public async create(pairing: OfflinePairingInterface): Promise<OfflinePairing> {
        return OfflinePairing.create(pairing);
    }

    public async findActiveByCode(code: string): Promise<OfflinePairing | null> {
        return OfflinePairing.findOne({
            where: {
                code,
                status: OfflinePairingStatus.ACTIVE,
                expiresAt: { [Op.gte]: new Date() },
            },
            order: [["createdAt", "DESC"]],
        });
    }

    public async markUsed(id: number): Promise<[affectedCount: number]> {
        return OfflinePairing.update(
            {
                status: OfflinePairingStatus.USED,
                updatedAt: new Date(),
            },
            { where: { id } },
        );
    }

    public async expireOld(now: Date): Promise<[affectedCount: number]> {
        return OfflinePairing.update(
            {
                status: OfflinePairingStatus.EXPIRED,
                updatedAt: now,
            },
            {
                where: {
                    status: OfflinePairingStatus.ACTIVE,
                    expiresAt: { [Op.lt]: now },
                },
            },
        );
    }
}

export const newOfflinePairingRepo = async (): Promise<OfflinePairingRepoInterface> => {
    return new OfflinePairingRepo();
};

export default OfflinePairingRepo;

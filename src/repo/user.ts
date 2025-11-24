import { Op, Transaction } from "sequelize";
import User, { UserInterface } from "../model/user";
import Driver, { DriverInterface } from "../model/driver";
import { UserType } from "../constant/common";
import newSequelize from "../infra/sequelize";

export interface UserRepoInterface {
    create(user: UserInterface): Promise<User>;
    registerDriver(user: UserInterface, driver: DriverInterface): Promise<User>;
    findById(id: number): Promise<User | null>;
    findByEmailOrPhone(identifier: { mobile?: string; email?: string }, type: UserType): Promise<User | null>;
    findByPhone(mobile: string, type: UserType): Promise<User | null>;
}

export class UserRepo implements UserRepoInterface {
    public async create(user: UserInterface): Promise<User> {
        return User.create(user);
    }

    public async findById(id: number): Promise<User | null> {
        return User.findByPk(id);
    }

    public async findByEmailOrPhone(
        identifier: { mobile?: string; email?: string },
        type: UserType,
    ): Promise<User | null> {
        const whereOptions: any = {};
        if (identifier.email) {
            whereOptions.email = identifier.email;
        }
        if (identifier.mobile) {
            whereOptions.mobile = identifier.mobile;
        }

        return User.findOne({
            where: {
                [Op.or]: whereOptions,
                isActive: true,
                type,
            },
        });
    }

    public async findByPhone(mobile: string, type: UserType): Promise<User | null> {
        return User.findOne({ where: { mobile, isActive: true, type } });
    }

    registerDriver(user: UserInterface, driver: DriverInterface): Promise<User> {
        return UserRepo.withTransaction<User>(async (transaction) => {
            const createdUser = await User.create(user, { transaction });
            await Driver.create(
                {
                    ...driver,
                    userId: createdUser.id!,
                },
                { transaction },
            );

            return createdUser;
        });
    }

    public static async withTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
        const transaction = await newSequelize().transaction();
        try {
            const response = await fn(transaction);
            await transaction.commit();
            return response;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export const newUserRepo = async (): Promise<UserRepoInterface> => {
    return new UserRepo();
};

export default UserRepo;

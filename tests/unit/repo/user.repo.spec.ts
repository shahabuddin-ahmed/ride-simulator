import { Op } from "sequelize";
import UserRepo from "../../../src/repo/user";
import User from "../../../src/model/user";
import Driver from "../../../src/model/driver";
import { UserType } from "../../../src/constant/common";

jest.mock("../../../src/model/user");
jest.mock("../../../src/model/driver");

describe("UserRepo", () => {
    const repo = new UserRepo();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a user", async () => {
        const payload: any = { mobile: "123", type: UserType.RIDER };
        (User.create as jest.Mock).mockResolvedValue({ id: 5, ...payload });

        const result = await repo.create(payload);

        expect(User.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ id: 5, ...payload });
    });

    it("finds by email or phone with active flag and type", async () => {
        const found = { id: 1 };
        (User.findOne as jest.Mock).mockResolvedValue(found);

        const result = await repo.findByEmailOrPhone({ email: "a@b.com", mobile: "123" }, UserType.RIDER);

        expect(User.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: { email: "a@b.com", mobile: "123" },
                isActive: true,
                type: UserType.RIDER,
            },
        });
        expect(result).toBe(found);
    });

    it("finds by phone with isActive filter and excludes password", async () => {
        const user = { id: 2 };
        (User.findOne as jest.Mock).mockResolvedValue(user);

        const result = await repo.findByPhone("999", UserType.DRIVER);

        expect(User.findOne).toHaveBeenCalledWith({
            where: { mobile: "999", isActive: true, type: UserType.DRIVER },
            attributes: { exclude: ["password"] },
        });
        expect(result).toBe(user);
    });

    it("finds by id", async () => {
        const user = { id: 77 };
        (User.findByPk as jest.Mock).mockResolvedValue(user);

        const result = await repo.findById(77);

        expect(User.findByPk).toHaveBeenCalledWith(77);
        expect(result).toBe(user);
    });

    it("registers driver inside a transaction", async () => {
        const transaction = { id: "tx" };
        const newUser = { id: 10 };
        jest.spyOn(UserRepo, "withTransaction").mockImplementation(async (fn: any) => fn(transaction));
        (User.create as jest.Mock).mockResolvedValue(newUser);
        (Driver.create as jest.Mock).mockResolvedValue({ id: 99 });

        const result = await repo.registerDriver({ mobile: "111", type: UserType.DRIVER } as any, { isOnline: false } as any);

        expect(User.create).toHaveBeenCalledWith({ mobile: "111", type: UserType.DRIVER }, { transaction });
        expect(Driver.create).toHaveBeenCalledWith({ isOnline: false, userId: 10 }, { transaction });
        expect(result).toEqual(newUser);
    });
});

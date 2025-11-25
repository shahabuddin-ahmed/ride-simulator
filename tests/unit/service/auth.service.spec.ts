import bcrypt from "bcrypt";
import { AuthService } from "../../../src/service/auth";
import { UserType } from "../../../src/constant/common";
import { BadRequestException } from "../../../src/web/exception/bad-request-exception";
import { NotFoundException } from "../../../src/web/exception/not-found-exception";

jest.mock("bcrypt");
jest.mock("../../../src/utils/mobile", () => ({
    normalizeMobile: jest.fn((mobile: string) => `+88${mobile}`),
}));
jest.mock("../../../src/utils/jwt", () => ({
    signJwt: jest.fn(() => "jwt-token"),
}));
jest.mock("../../../src/utils/otp", () => ({
    generateDriverOtpToken: jest.fn(() => ({ code: "123456", token: "otp-token" })),
    verifyDriverOtpToken: jest.fn(() => true),
}));

const userRepo = {
    findByEmailOrPhone: jest.fn(),
    findByPhone: jest.fn(),
    create: jest.fn(),
    registerDriver: jest.fn(),
} as any;

describe("AuthService", () => {
    const service = new AuthService(userRepo);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("riderRegister", () => {
        it("throws when rider already exists", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue({ id: 1 });

            await expect(
                service.riderRegister({
                    fristName: "ABC",
                    lastName: "DEF",
                    mobile: "01701045698",
                    email: "abc@example.com",
                    password: "password",
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("creates rider with normalized mobile and hashed password", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
            const created = { dataValues: { id: 1, password: "hashed", mobile: "+8801701045698" } };
            userRepo.create.mockResolvedValue(created);

            const result = await service.riderRegister({
                fristName: "ABC",
                lastName: "DEF",
                mobile: "01701045698",
                email: null,
                password: "password",
            });

            expect(userRepo.findByEmailOrPhone).toHaveBeenCalledWith(
                { email: undefined, mobile: "+8801701045698" },
                UserType.RIDER,
            );
            expect(userRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    mobile: "+8801701045698",
                    password: "hashed",
                    type: UserType.RIDER,
                }),
            );
            expect(result).toEqual({ id: 1, mobile: "+8801701045698" });
        });
    });

    describe("riderLogin", () => {
        it("throws when user not found", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue(null);

            await expect(service.riderLogin({ mobile: "01701045698", password: "pw" })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it("throws when password mismatch", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue({ password: "hash" });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.riderLogin({ mobile: "01701045698", password: "pw" })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it("returns access token and sanitized user on success", async () => {
            const user = { id: 1, type: UserType.RIDER, password: "hash", dataValues: { id: 1, password: "hash" } };
            userRepo.findByEmailOrPhone.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.riderLogin({ mobile: "01701045698", password: "pw" });

            expect(userRepo.findByEmailOrPhone).toHaveBeenCalledWith(
                { email: undefined, mobile: "+8801701045698" },
                UserType.RIDER,
            );
            expect(result).toEqual({ accessToken: "jwt-token", user: { id: 1 } });
        });
    });

    describe("driverRegister", () => {
        it("throws when driver exists", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue({ id: 1 });

            await expect(
                service.driverRegister({ mobile: "01701045698", email: null, fristName: null, lastName: null }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("registers driver with normalized mobile", async () => {
            userRepo.findByEmailOrPhone.mockResolvedValue(null);
            const created = { dataValues: { id: 2, mobile: "+8801701045698" } };
            userRepo.registerDriver.mockResolvedValue(created);

            const result = await service.driverRegister({ mobile: "01701045698", email: null, fristName: null, lastName: null });

            expect(userRepo.findByEmailOrPhone).toHaveBeenCalledWith(
                { email: undefined, mobile: "+8801701045698" },
                UserType.DRIVER,
            );
            expect(userRepo.registerDriver).toHaveBeenCalledWith(
                expect.objectContaining({ mobile: "+8801701045698", type: UserType.DRIVER }),
                expect.any(Object),
            );
            expect(result).toEqual({ id: 2, mobile: "+8801701045698" });
        });
    });

    describe("requestDriverOtp", () => {
        it("throws when driver not found", async () => {
            userRepo.findByPhone.mockResolvedValue(null);

            await expect(service.requestDriverOtp({ mobile: "017" })).rejects.toBeInstanceOf(NotFoundException);
        });

        it("returns otp token on success", async () => {
            userRepo.findByPhone.mockResolvedValue({ id: 1 });

            const result = await service.requestDriverOtp({ mobile: "01701045698" });

            expect(userRepo.findByPhone).toHaveBeenCalledWith("+8801701045698", UserType.DRIVER);
            expect(result).toEqual({ otpToken: "otp-token" });
        });
    });

    describe("verifyDriverOtp", () => {
        const { verifyDriverOtpToken } = jest.requireMock("../../../src/utils/otp");

        it("throws when driver not found", async () => {
            userRepo.findByPhone.mockResolvedValue(null);

            await expect(
                service.verifyDriverOtp({ mobile: "01701045698", code: "123456", otpToken: "t" }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it("throws when otp invalid", async () => {
            userRepo.findByPhone.mockResolvedValue({ id: 1, dataValues: { id: 1, password: null } });
            verifyDriverOtpToken.mockReturnValue(false);

            await expect(
                service.verifyDriverOtp({ mobile: "01701045698", code: "123456", otpToken: "t" }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it("returns access token and user on success", async () => {
            const user = { id: 1, dataValues: { id: 1, password: null } };
            userRepo.findByPhone.mockResolvedValue(user);
            verifyDriverOtpToken.mockReturnValue(true);

            const result = await service.verifyDriverOtp({ mobile: "01701045698", code: "123456", otpToken: "t" });

            expect(userRepo.findByPhone).toHaveBeenCalledWith("+8801701045698", UserType.DRIVER);
            expect(result).toEqual({ accessToken: "jwt-token", user: { id: 1 } });
        });
    });
});

import bcrypt from "bcrypt";
import { ERROR_CODES } from "../constant/error";
import { UserType } from "../constant/common";
import { UserInterface } from "../model/user";
import { UserRepoInterface } from "../repo/user";
import { signJwt } from "../utils/jwt";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { NotFoundException } from "../web/exception/not-found-exception";
import { verifyDriverOtpToken } from "../utils/otp";
import { generateDriverOtpToken } from "../utils/otp";
import { DriverInterface } from "../model/driver";
import {
    AuthServiceInterface,
    DriverOtpRequestInput,
    DriverOtpVerifyInput,
    DriverRegisterInput,
    RiderLoginInput,
    RiderRegisterInput,
} from "./types";

const BCRYPT_ROUNDS = 10;

export class AuthService implements AuthServiceInterface {
    constructor(private userRepo: UserRepoInterface) {
        this.userRepo = userRepo;
    }

    async riderRegister(input: RiderRegisterInput): Promise<UserInterface> {
        const exists = await this.userRepo.findByEmailOrPhone(
            { email: input.email ?? undefined, mobile: input.mobile },
            UserType.RIDER,
        );

        if (exists) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Rider already exists with this mobile or email");
        }

        const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

        const user: UserInterface & { password?: string | null } = {
            fristName: input.fristName,
            lastName: input.lastName,
            mobile: input.mobile,
            email: input.email ?? null,
            type: UserType.RIDER,
            isActive: true,
            password,
        };

        const created = await this.userRepo.create(user);

        return this.sanitizeUser(created.dataValues);
    }

    async riderLogin(input: RiderLoginInput): Promise<{ accessToken: string; user: UserInterface }> {
        const user = await this.userRepo.findByEmailOrPhone(input, UserType.RIDER);

        if (!user) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Invalid credentials");
        }

        const matchedHash = await bcrypt.compare(input.password, user.password!);
        if (!matchedHash) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Invalid credentials");
        }

        const accessToken = signJwt({
            id: user.id!,
            type: UserType.RIDER,
        });

        return { accessToken, user: this.sanitizeUser(user.dataValues) };
    }

    async driverRegister(input: DriverRegisterInput): Promise<UserInterface> {
        const exists = await this.userRepo.findByEmailOrPhone(
            { email: input.email ?? undefined, mobile: input.mobile },
            UserType.DRIVER,
        );

        if (exists) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "User already exists with this mobile or email");
        }

        const now = new Date();

        // Create user row with type DRIVER (no passwordHash)
        const user: UserInterface & { password?: string | null } = {
            fristName: input.fristName || null,
            lastName: input.lastName || null,
            mobile: input.mobile,
            email: input.email ?? null,
            type: UserType.DRIVER,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            password: null,
        };

        const driver: DriverInterface = {
            isOnline: false,
            currentLat: null,
            currentLng: null,
            lastPingAt: null,
        };

        const created = await this.userRepo.registerDriver(user, driver);
        return this.sanitizeUser(created.dataValues);
    }

    async requestDriverOtp(input: DriverOtpRequestInput): Promise<{ otpToken: string }> {
        const user = await this.userRepo.findByPhone(input.mobile, UserType.DRIVER);
        if (!user) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Driver not found");
        }

        const { code, token } = generateDriverOtpToken(input.mobile);

        // In real life: send `code` via SMS
        console.log(`Driver OTP for ${input.mobile}: ${code}`);

        // We return token to FE; FE stores it (hidden) and sends it back on verify.
        return { otpToken: token };
    }

    async verifyDriverOtp(input: DriverOtpVerifyInput): Promise<{
        accessToken: string;
        user: UserInterface & { password?: string | null };
    }> {
        const user = await this.userRepo.findByPhone(input.mobile, UserType.DRIVER);
        if (!user) {
            throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "Driver not found");
        }

        const ok = verifyDriverOtpToken(input.otpToken, input.code, input.mobile);
        if (!ok) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "Invalid or expired OTP");
        }

        const accessToken = signJwt({ id: user.id!, type: UserType.DRIVER });
        return {
            accessToken,
            user: this.sanitizeUser(user.dataValues),
        };
    }

    private sanitizeUser(user: UserInterface): Omit<UserInterface, "password"> {
        // remove password before sending to client
        const { password, ...rest } = user as any;
        return rest;
    }
}

export const newAuthService = async (userRepo: UserRepoInterface): Promise<AuthService> => {
    return new AuthService(userRepo);
};

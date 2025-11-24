import { UserInterface } from "../../model/user";

export interface RiderRegisterInput {
    fristName: string | null;
    lastName: string | null;
    mobile: string;
    email: string | null;
    password: string;
}

export interface RiderLoginInput {
    mobile?: string;
    email?: string;
    password: string;
}

export interface DriverOtpRequestInput {
    mobile: string;
}

export interface DriverOtpVerifyInput {
    mobile: string;
    code: string;
    otpToken: string;
}

export interface DriverRegisterInput {
    mobile: string;
    email?: string | null;
    fristName?: string | null;
    lastName?: string | null;
}

export interface AuthServiceInterface {
    riderRegister(input: RiderRegisterInput): Promise<UserInterface>;
    riderLogin(input: RiderLoginInput): Promise<{
        accessToken: string;
        user: UserInterface;
    }>;
    driverRegister(input: DriverRegisterInput): Promise<UserInterface>;
    requestDriverOtp(input: DriverOtpRequestInput): Promise<{ otpToken: string }>;
    verifyDriverOtp(input: DriverOtpVerifyInput): Promise<{
        accessToken: string;
        user: Omit<UserInterface, "password">;
    }>;
}

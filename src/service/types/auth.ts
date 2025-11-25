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

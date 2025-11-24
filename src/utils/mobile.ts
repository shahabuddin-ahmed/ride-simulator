// src/util/phone.ts
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { ERROR_CODES } from "../constant/error";

const DEFAULT_REGION = "BD";

export interface NormalizedPhone {
    e164: string; // +8801701234567
    national: string; // 01701-234567
    international: string; // +880 1701-234567
    country?: string;
}

export const validateMobile = (mobileNumber: string): NormalizedPhone => {
    if (!mobileNumber || mobileNumber.trim() === "") {
        throw new BadRequestException(ERROR_CODES.E_INVALID_MOBILE_NUMBER, "Mobile number is required");
    }
    
    const phoneNumber = parsePhoneNumberFromString(mobileNumber, DEFAULT_REGION as any);
    if (!phoneNumber || !phoneNumber.isValid()) {
        throw new BadRequestException(ERROR_CODES.E_INVALID_MOBILE_NUMBER, "Invalid mobile number");
    }

    return {
        e164: phoneNumber.format("E.164"),
        national: phoneNumber.format("NATIONAL"),
        international: phoneNumber.format("INTERNATIONAL"),
        country: phoneNumber.country,
    };
};

export const normalizeMobile = (mobile: string): string => {
    return validateMobile(mobile).e164;
};

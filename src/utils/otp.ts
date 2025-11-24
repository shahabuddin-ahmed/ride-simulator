import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config";

interface OtpTokenPayload {
    mobile: string;
    otpHash: string;
    type: "driver";
}

export function generateDriverOtpToken(mobile: string) {
    const code = generateCode(); // 6-digit
    const otpHash = hashOtp(code);

    const payload: OtpTokenPayload = {
        mobile,
        otpHash,
        type: "driver",
    };

    const token = jwt.sign(payload, config.OTP_SECRET as string, {
        expiresIn: `${config.OTP_EXPIRY_MINUTES}m`,
    });

    return { code, token };
}

export function verifyDriverOtpToken(
    token: string,
    code: string,
    mobile: string
): boolean {
    try {
        const decoded = jwt.verify(
            token,
            config.OTP_SECRET as string
        ) as OtpTokenPayload;

        if (decoded.type !== "driver") return false;
        if (decoded.mobile !== mobile) return false;

        const expectedHash = decoded.otpHash;
        const actualHash = hashOtp(code);

        return timingSafeEqual(expectedHash, actualHash);
    } catch (_e) {
        return false;
    }
}

// ===== helpers =====

export function generateCode(): string {
    const min = 100000;
    const max = 999999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return String(code);
}

function hashOtp(code: string): string {
    return crypto
        .createHmac("sha256", config.OTP_SECRET as string)
        .update(code)
        .digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

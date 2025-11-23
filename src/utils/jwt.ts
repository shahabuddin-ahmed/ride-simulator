import jwt from "jsonwebtoken";
import config from "../config/config";
import { UserType } from "../constant/common";

export interface JwtPayload {
    id: number;
    type: UserType;
}

const DEFAULT_EXPIRES_IN = "12h";

export const signJwt = (payload: JwtPayload): string => {
    return jwt.sign(payload, config.JWT_SECRET as string, {
        expiresIn: DEFAULT_EXPIRES_IN,
    });
};

export const verifyJwt = (token: string): JwtPayload => {
    return jwt.verify(token, config.JWT_SECRET as string) as JwtPayload;
};

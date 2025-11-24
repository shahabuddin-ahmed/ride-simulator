import { sign, verify } from "jsonwebtoken";
import config from "../config/config";
import { UserType } from "../constant/common";

export interface JwtPayload {
    id: number;
    type: UserType;
}


export const signJwt = (payload: JwtPayload): string => {
    return sign(payload, config.JWT.JWT_SECRET, { algorithm: "HS256", expiresIn: config.JWT.JWT_EXPIRATION });
};

export const verifyJwt = (token: string): JwtPayload => {
    return verify(token, config.JWT.JWT_SECRET) as JwtPayload;
};

import { JwtPayload, verify } from "jsonwebtoken";
import config from "../../config/config";
import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exception/unauthorized-exception";
import { ERROR_CODES } from "../../constant/error";
import { UserType } from "../../constant/common";

declare global {
    namespace Express {
        interface Request {
            user: JwtPayload;
        }
    }
}

export const authenticated = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(new UnauthorizedException(ERROR_CODES.E_INVALID_TOKEN, "Please provide the access token"));
        }

        const token = authorizationHeader.split(" ")[1];
        const jwtPayload = verify(token, config.JWT.JWT_SECRET);
        req.user = jwtPayload as JwtPayload;
        next();
    } catch (err) {
        console.error("Error caught by auth middleware: ", err);
        next(new UnauthorizedException(ERROR_CODES.E_INVALID_TOKEN, "Invalid access token"));
    }
};

const requireUserType =
    (userType: UserType) =>
    (req: Request, res: Response, next: NextFunction): any => {
        if (!req.user || req.user.type !== userType) {
            return next(new UnauthorizedException(ERROR_CODES.E_UNAUTHORIZED, "Unauthorized"));
        }

        next();
    };

export const requireDriver = requireUserType(UserType.DRIVER);
export const requireRider = requireUserType(UserType.RIDER);

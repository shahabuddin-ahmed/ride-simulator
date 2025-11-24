import { Request, Response } from "express";
import Joi from "joi";
import { Controller } from "../controller";
import {
    AuthServiceInterface,
    RiderRegisterInput,
    RiderLoginInput,
    DriverOtpRequestInput,
    DriverOtpVerifyInput,
    DriverRegisterInput,
} from "../../../service/auth";

export interface AuthControllerInterface {
    riderRegister(req: Request, res: Response): any;
    riderLogin(req: Request, res: Response): any;
    driverRegister(req: Request, res: Response): any;
    requestDriverOtp(req: Request, res: Response): any;
    verifyDriverOtp(req: Request, res: Response): any;
}

export class AuthController extends Controller implements AuthControllerInterface {
    constructor(private authService: AuthServiceInterface) {
        super();
        this.riderRegister = this.riderRegister.bind(this);
        this.riderLogin = this.riderLogin.bind(this);
        this.driverRegister = this.driverRegister.bind(this);
        this.requestDriverOtp = this.requestDriverOtp.bind(this);
        this.verifyDriverOtp = this.verifyDriverOtp.bind(this);
    }

    async riderRegister(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<RiderRegisterInput>({
            fristName: Joi.string().trim().optional().allow(null, "").default(""),
            lastName: Joi.string().trim().optional().allow(null, "").default(""),
            mobile: Joi.string().trim().required(),
            email: Joi.string().email().trim().lowercase().optional().allow(null, "").default(""),
            password: Joi.string().min(8).required(),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.authService.riderRegister(value);

        return this.sendResponse({ response }, 201, res);
    }

    async riderLogin(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<RiderLoginInput>({
            mobile: Joi.string().trim().allow(null, "").empty(["", null]),
            email: Joi.string().email().lowercase().allow(null, "").empty(["", null]),
            password: Joi.string().required(),
        }).or("email", "mobile");

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.authService.riderLogin(value);

        return this.sendResponse({ response }, 200, res);
    }

    async driverRegister(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<DriverRegisterInput>({
            fristName: Joi.string().trim().optional().allow(null, "").default(""),
            lastName: Joi.string().trim().optional().allow(null, "").default(""),
            mobile: Joi.string().trim().required(),
            email: Joi.string().email().trim().lowercase().optional().allow(null, "").default(""),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.authService.driverRegister(value);

        return this.sendResponse({ response }, 201, res);
    }

    async requestDriverOtp(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<DriverOtpRequestInput>({
            mobile: Joi.string().trim().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.authService.requestDriverOtp({
            mobile: value.mobile,
        });

        return this.sendResponse({ response }, 200, res);
    }

    async verifyDriverOtp(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<DriverOtpVerifyInput>({
            mobile: Joi.string().trim().required(),
            code: Joi.string().trim().required(),
            otpToken: Joi.string().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.authService.verifyDriverOtp({
            mobile: value.mobile,
            code: value.code,
            otpToken: value.otpToken,
        });

        return this.sendResponse({ response }, 200, res);
    }
}

export const newAuthV1Controller = async (authService: AuthServiceInterface): Promise<AuthController> => {
    return new AuthController(authService);
};

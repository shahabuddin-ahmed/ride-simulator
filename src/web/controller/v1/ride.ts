import { Request, Response } from "express";
import Joi from "joi";
import { Controller } from "../controller";
import { OnlineRideCreateInput, RideServiceInterface } from "../../../service/ride";

export interface RideControllerInterface {
    createOnlineRide(req: Request, res: Response): any;
    getById(req: Request, res: Response): any;
    driverAcceptRide(req: Request, res: Response): any;
    driverStartRide(req: Request, res: Response): any;
    driverCompleteRide(req: Request, res: Response): any;
    riderCancelRide(req: Request, res: Response): any;
    driverCancelRide(req: Request, res: Response): any;
}

export class RideController extends Controller implements RideControllerInterface {
    constructor(private rideService: RideServiceInterface) {
        super();
        this.createOnlineRide = this.createOnlineRide.bind(this);
        this.getById = this.getById.bind(this);
        this.driverAcceptRide = this.driverAcceptRide.bind(this);
        this.driverStartRide = this.driverStartRide.bind(this);
        this.driverCompleteRide = this.driverCompleteRide.bind(this);
        this.riderCancelRide = this.riderCancelRide.bind(this);
        this.driverCancelRide = this.driverCancelRide.bind(this);
    }

    async createOnlineRide(req: Request, res: Response): Promise<any> {
        const schema = Joi.object<OnlineRideCreateInput>({
            pickupLat: Joi.number().required(),
            pickupLng: Joi.number().required(),
            dropoffLat: Joi.number().required(),
            dropoffLng: Joi.number().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);
        const response = await this.rideService.createOnlineRide({ ...value, riderId: req.user!.id });

        return this.sendResponse({ response }, 201, res);
    }

    async getById(req: Request, res: Response): Promise<any> {
        const schema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value } = await this.validateRequest(schema, req.params);
        const response = await this.rideService.getById(value.id);

        return this.sendResponse({ response }, 200, res);
    }

    async driverAcceptRide(req: Request, res: Response): Promise<any> {
        const paramSchema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value: params } = await this.validateRequest(paramSchema, req.params);

        const response = await this.rideService.driverAcceptRide(params.id, req.user!.id);
        return this.sendResponse({ response }, 200, res);
    }

    async driverStartRide(req: Request, res: Response): Promise<any> {
        const paramSchema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value: params } = await this.validateRequest(paramSchema, req.params);

        const response = await this.rideService.driverStartRide(params.id, req.user!.id);

        return this.sendResponse({ response }, 200, res);
    }

    async driverCompleteRide(req: Request, res: Response): Promise<any> {
        const paramSchema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value: params } = await this.validateRequest(paramSchema, req.params);

        const response = await this.rideService.driverCompleteRide(params.id, req.user!.id);

        return this.sendResponse({ response }, 200, res);
    }

    async riderCancelRide(req: Request, res: Response): Promise<any> {
        const paramSchema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value: params } = await this.validateRequest(paramSchema, req.params);

        const response = await this.rideService.riderCancelRide(params.id, req.user!.id);

        return this.sendResponse({ response }, 200, res);
    }

    async driverCancelRide(req: Request, res: Response): Promise<any> {
        const paramSchema = Joi.object({
            id: Joi.number().integer().positive().required(),
        });

        const { value: params } = await this.validateRequest(paramSchema, req.params);

        const response = await this.rideService.driverCancelRide(params.id, req.user!.id);

        return this.sendResponse({ response }, 200, res);
    }
}

export const newRideV1Controller = async (rideService: RideServiceInterface): Promise<RideController> => {
    return new RideController(rideService);
};

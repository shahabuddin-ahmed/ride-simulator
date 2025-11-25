import { Request, Response } from "express";
import Joi from "joi";
import { Controller } from "../controller";
import { DriverServiceInterface } from "../../../service/driver";

export interface DriverControllerInterface {
    updateStatus(req: Request, res: Response): any;
    updateLocation(req: Request, res: Response): any;
    generateOfflineParing(req: Request, res: Response): any;
}

export class DriverController extends Controller implements DriverControllerInterface {
    constructor(private driverService: DriverServiceInterface) {
        super();
        this.updateStatus = this.updateStatus.bind(this);
        this.updateLocation = this.updateLocation.bind(this);
        this.generateOfflineParing = this.generateOfflineParing.bind(this);
    }

    async updateStatus(req: Request, res: Response): Promise<any> {
        const schema = Joi.object({
            isOnline: Joi.boolean().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.driverService.updateStatus({
            userId: req.user.id,
            isOnline: value.isOnline,
        });

        return this.sendResponse({ response }, 200, res);
    }

    async updateLocation(req: Request, res: Response): Promise<any> {
        const schema = Joi.object({
            lat: Joi.number().required(),
            lng: Joi.number().required(),
        });

        const { value } = await this.validateRequest(schema, req.body);

        const response = await this.driverService.updateLocation({
            userId: req.user.id,
            lat: value.lat,
            lng: value.lng,
        });

        return this.sendResponse({ response }, 200, res);
    }

    async generateOfflineParing(req: Request, res: Response): Promise<any> {
        const paring = await this.driverService.generateOfflineParing(req.user.id);

        return this.sendResponse({ response: paring }, 201, res);
    }
}

export const newDriverV1Controller = async (driverService: DriverServiceInterface): Promise<DriverController> => {
    return new DriverController(driverService);
};

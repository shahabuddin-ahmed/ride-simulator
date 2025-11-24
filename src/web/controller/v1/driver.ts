import { Request, Response } from "express";
import Joi from "joi";
import { Controller } from "../controller";
import { DriverServiceInterface } from "../../../service/types";

export interface DriverControllerInterface {
    updateStatus(req: Request, res: Response): any;
    updateLocation(req: Request, res: Response): any;
    generateOfflinePairing(req: Request, res: Response): any;
}

export class DriverController extends Controller implements DriverControllerInterface {
    constructor(private driverService: DriverServiceInterface) {
        super();
        this.updateStatus = this.updateStatus.bind(this);
        this.updateLocation = this.updateLocation.bind(this);
        this.generateOfflinePairing = this.generateOfflinePairing.bind(this);
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

    async generateOfflinePairing(req: Request, res: Response): Promise<any> {
        const pairing = await this.driverService.generateOfflinePairing(req.user.id);

        return this.sendResponse({ response: pairing }, 201, res);
    }
}

export const newDriverV1Controller = async (driverService: DriverServiceInterface): Promise<DriverController> => {
    return new DriverController(driverService);
};

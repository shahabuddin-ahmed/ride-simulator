import { Router } from "express";
import { asyncHandler } from "../../middleware/async-hander";
import { DriverControllerInterface } from "../../controller/v1/driver";
import { authenticated, requireDriver } from "../../middleware/auth";

export const newDriverRouter = async (driverController: DriverControllerInterface): Promise<Router> => {
    const router = Router();

    router.patch("/status", authenticated, requireDriver, asyncHandler(driverController.updateStatus));
    router.patch("/location", authenticated, requireDriver, asyncHandler(driverController.updateLocation));
    router.post("/offline-paring", authenticated, requireDriver, asyncHandler(driverController.generateOfflineParing));

    return router;
};

export default newDriverRouter;

import { Router } from "express";
import { asyncHandler } from "../../middleware/async-hander";
import { RideControllerInterface } from "../../controller/v1/ride";
import { authenticated, requireDriver, requireRider } from "../../middleware/auth";

export const newRideRouter = async (rideController: RideControllerInterface): Promise<Router> => {
    const router = Router();

    router.post("/online", authenticated, requireRider, asyncHandler(rideController.createOnlineRide));
    router.get("/:id", authenticated, asyncHandler(rideController.getById));
    router.post("/:id/accept", authenticated, requireDriver, asyncHandler(rideController.driverAcceptRide));
    router.post("/:id/start", authenticated, requireDriver, asyncHandler(rideController.driverStartRide));
    router.post("/:id/complete", authenticated, requireDriver, asyncHandler(rideController.driverCompleteRide));
    router.post("/:id/cancel/rider", authenticated, requireRider, asyncHandler(rideController.riderCancelRide));
    router.post("/:id/cancel/driver", authenticated, requireDriver, asyncHandler(rideController.driverCancelRide));

    return router;
};

export default newRideRouter;

import { Router } from "express";
import { asyncHandler } from "../../middleware/async-hander";
import { AuthControllerInterface } from "../../controller/v1/auth";

export const newAuthRouter = async (authController: AuthControllerInterface): Promise<Router> => {
    const router = Router();

    router.post("/rider/register", asyncHandler(authController.riderRegister));
    router.post("/rider/login", asyncHandler(authController.riderLogin));
    router.post("/driver/register", asyncHandler(authController.driverRegister));
    router.post("/driver/otp/request", asyncHandler(authController.requestDriverOtp));
    router.post("/driver/otp/verify", asyncHandler(authController.verifyDriverOtp));

    return router;
};

export default newAuthRouter;

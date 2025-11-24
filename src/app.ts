import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { newV1Router } from "./web/router/v1/index";
import { globalErrorHandler } from "./web/middleware/global-error-handler";
import { initializeDBConnection } from "./infra/db";
import { newUserRepo } from "./repo/user";
import { newRideRepo } from "./repo/ride";
import { newDriverRepo } from "./repo/driver";
import { newOfflinePairingRepo } from "./repo/offline-paring";
import { newAuthService } from "./service/auth";
import { newRideService } from "./service/ride";
import { newDriverService } from "./service/driver";
import { newAuthV1Controller } from "./web/controller/v1/auth";
import { newRideV1Controller } from "./web/controller/v1/ride";
import { newDriverV1Controller } from "./web/controller/v1/driver";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
    await initializeDBConnection();

    // Initialize Repo
    const userRepo = await newUserRepo();
    const rideRepo = await newRideRepo();
    const driverRepo = await newDriverRepo();
    const offlinePairingRepo = await newOfflinePairingRepo();

    // Initialize Service
    const authService = await newAuthService(userRepo);
    const rideService = await newRideService(rideRepo, driverRepo, offlinePairingRepo);
    const driverService = await newDriverService(driverRepo, offlinePairingRepo);
    
    // Initialize Controller
    const authV1Controller = await newAuthV1Controller(authService);
    const rideV1Controller = await newRideV1Controller(rideService);
    const driverV1Controller = await newDriverV1Controller(driverService);
    // Initialize Router
    const v1Router = await newV1Router({
        authController: authV1Controller,
        rideController: rideV1Controller,
        driverController: driverV1Controller,
    });

    app.use(morgan("short"));
    app.use("/api/v1", v1Router);
    app.use(globalErrorHandler);
})();

export default app;

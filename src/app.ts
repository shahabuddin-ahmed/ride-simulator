import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { newV1Router } from "./web/router/v1/index";
import { globalErrorHandler } from "./web/middleware/global-error-handler";
import { initializeDBConnection } from "./infra/db";
import { newUserRepo } from "./repo/user";
import { newAuthService } from "./service/auth";
import { newAuthV1Controller } from "./web/controller/v1/auth";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
    await initializeDBConnection();

    // Initialize Repo
    const userRepo = await newUserRepo();

    // Initialize Service
    const authService = await newAuthService(userRepo);

    // Initialize Controller
    const authV1Controller = await newAuthV1Controller(authService);

    // Initialize Router
    const v1Router = await newV1Router({
        authController: authV1Controller,
    });

    app.use(morgan("short"));
    app.use("/api/v1", v1Router);
    app.use(globalErrorHandler);
})();

export default app;

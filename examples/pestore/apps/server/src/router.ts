import { Router } from "express";
import { ExceptionMiddleware } from "@eecho/express";

import PetRouter from "./routers/pet/pet.router";

export const PetStoreServerRouter = Router();

PetStoreServerRouter.use(PetRouter);

PetStoreServerRouter.use(ExceptionMiddleware);

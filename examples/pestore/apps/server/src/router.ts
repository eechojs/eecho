import { Router } from "express";
import { ExceptionMiddleware } from "@eecho/express";

import PetRouter from './routers/pet/pet.router.js';
import OrderRouter from './routers/order/order.router.js';

export const PetStoreServerRouter = Router();

PetStoreServerRouter.use(PetRouter);
PetStoreServerRouter.use(OrderRouter);

PetStoreServerRouter.use(ExceptionMiddleware);

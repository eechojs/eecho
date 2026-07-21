import { Router } from "express";
import { registerMongoReadEndpoint } from "@eecho/express";
import { OrderAPIDefinition } from '@pestore/api-lib';

import { OrderRepository } from './order.definition.js';

const router = Router();

registerMongoReadEndpoint({
  router,
  apiSpec: OrderAPIDefinition.ReadAPISpecification,
  repository: OrderRepository,
});

export default router;

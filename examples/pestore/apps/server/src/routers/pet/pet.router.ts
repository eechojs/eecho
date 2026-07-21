import { Router } from "express";
import { registerMongoReadEndpoint } from "@eecho/express";
import { PetAPIDefinition } from '@pestore/api-lib';

import { PetRepository } from './pet.definition.js';

const router = Router();

registerMongoReadEndpoint({
  router,
  apiSpec: PetAPIDefinition.ReadAPISpecification,
  repository: PetRepository,
});

export default router;

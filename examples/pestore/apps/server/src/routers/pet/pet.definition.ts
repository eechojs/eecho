import { MongoGenerator } from "@eecho/express";

import { getDBClient } from '../../db.js';
import { PetDefinition } from "@pestore/api-lib";

export const PetRepository = MongoGenerator.genRepository({
  definition: PetDefinition,
  collectionName: "Pet",
  dbClient: getDBClient()
});

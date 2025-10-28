import { MongoGenerator } from "@eecho/express";

import { getDBClient } from "../../db";
import { PetDefinition } from "@pestore/api-lib";

export const PetAPISpecs = MongoGenerator.genAPISpec({
  definition: PetDefinition,
  endpointPrefix: "/pet"
})

export const PetRepository = MongoGenerator.genRepository({
  definition: PetDefinition,
  collectionName: "Pet",
  dbClient: getDBClient()
});

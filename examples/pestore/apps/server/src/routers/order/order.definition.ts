import { MongoGenerator } from "@eecho/express";

import { OrderDefinition } from "../../../../api-lib/src";
import { getDBClient } from "../../db";

export const OrderAPISpecs = MongoGenerator.genAPISpec({
  definition: OrderDefinition,
  endpointPrefix: "/order"
})

export const OrderRepository = MongoGenerator.genRepository({
  definition: OrderDefinition,
  collectionName: "Order",
  dbClient: getDBClient()
});

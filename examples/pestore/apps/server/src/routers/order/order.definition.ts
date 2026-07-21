import { MongoGenerator } from "@eecho/express";

import { OrderDefinition } from '@pestore/api-lib';
import { getDBClient } from '../../db.js';

export const OrderRepository = MongoGenerator.genRepository({
  definition: OrderDefinition,
  collectionName: "Order",
  dbClient: getDBClient()
});

import { Router } from "express";
import { setAPIEndpoint } from "@eecho/express";

import { OrderAPISpecs, OrderRepository } from "./order.definition";

const router = Router();

setAPIEndpoint({
  router,
  apiEndpoint: "/order/getItems",
  method: "GET",
  apiSpec: OrderAPISpecs.ReadAPISpecification,
  handler: async ({ res, params }) => {
    const { page, limit } = params.query;
    
    const pets = await OrderRepository.getItems({ page, limit });
    const result = {
      success: true,
      data: pets
    } as const;

    res.json(result);

    return result;
  }
});

export default router;

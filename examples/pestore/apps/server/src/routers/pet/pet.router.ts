import { Router } from "express";
import { setAPIEndpoint } from "@eecho/express";
import { PetAPISpecs, PetRepository } from "./pet.definition";

const router = Router();

setAPIEndpoint({
  router,
  apiEndpoint: "/pet/getItems",
  method: "GET",
  apiSpec: PetAPISpecs.ReadAPISpecification,
  handler: async ({ res, params }) => {
    const { page, limit } = params.query;
    
    const pets = await PetRepository.getItems({ page, limit });
    const result = {
      success: true,
      data: pets
    } as const;

    res.json(result);

    return result;
  }
});

export default router;

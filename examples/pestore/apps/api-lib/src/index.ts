import { createAPI, createHttpClient } from "@eecho/api-client";

import { PetAPIDefinition, OrderAPIDefinition, PetToyAPIDefinition } from "./api.definition";

export * from "./model.definition";

const httpClient = createHttpClient();

export const PetStoreAPIClient = {
  setHost: (host: string)=>{
    return httpClient.setHost(host);
  },
  API: {
    Pet: {
      getItems: createAPI({ apiSpec: PetAPIDefinition.ReadAPISpecification, httpClient})['getItems']
    },
    Order: {
      getItems: createAPI({ apiSpec: OrderAPIDefinition.ReadAPISpecification, httpClient})['getItems']
    },
    PetToy: {
      getItems: createAPI({ apiSpec: PetToyAPIDefinition.ReadAPISpecification, httpClient})['getItems']
    }
  }
};

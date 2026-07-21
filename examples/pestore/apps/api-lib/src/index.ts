import { createAPI, createHttpClient } from '@eecho/api-client';

import { OrderAPIDefinition, PetAPIDefinition, PetToyAPIDefinition } from './api.definition.js';

export * from './model.definition.js';
export * from './api.definition.js';

const httpClient = createHttpClient();
const petAPI = createAPI({
  apiSpec: PetAPIDefinition.ReadAPISpecification,
  httpClient,
});
const orderAPI = createAPI({
  apiSpec: OrderAPIDefinition.ReadAPISpecification,
  httpClient,
});
const petToyAPI = createAPI({
  apiSpec: PetToyAPIDefinition.ReadAPISpecification,
  httpClient,
});

export const PetStoreAPIClient = {
  setHost: httpClient.setHost,
  API: {
    Pet: petAPI,
    Order: orderAPI,
    PetToy: petToyAPI,
  },
};

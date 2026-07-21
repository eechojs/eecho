import { genAPIDefinition } from '@eecho/definition';

import { OrderDefinition, PetDefinition, PetToyDefinition } from './model.definition.js';

export const PetAPIDefinition = genAPIDefinition({
  definition: PetDefinition,
  endpointPrefix: '/pet',
});

export const PetToyAPIDefinition = genAPIDefinition({
  definition: PetToyDefinition,
  endpointPrefix: '/petToy',
});

export const OrderAPIDefinition = genAPIDefinition({
  definition: OrderDefinition,
  endpointPrefix: '/order',
});

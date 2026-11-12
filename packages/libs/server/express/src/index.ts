import { genAPIDefinition } from '@eecho/definition';

import { genRepository, genViewRepository } from './generator/mongo/mongo.generator.js';

export { setAPIEndpoint, setMiddleware } from './api/api.js';
export { ExceptionMiddleware } from './api/api.middleware.js';
export type { APIHandler, ExpressMiddleware } from './api/api.type.js';
export { registerMongoReadEndpoint } from './generator/mongo/mongo.endpoint.js';

export const MongoGenerator = {
  // Compatibility alias: the database-agnostic contract is owned by @eecho/definition.
  genAPISpec: genAPIDefinition,
  genRepository,
  genViewRepository,
};

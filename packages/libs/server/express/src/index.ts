import { genAPISpec } from './generator/mongo/mongo.api.generator.js';
import { genRepository, genViewRepository } from './generator/mongo/mongo.generator.js';

export { setAPIEndpoint, setMiddleware } from './api/api.js';
export { ExceptionMiddleware } from './api/api.middleware.js';
export { registerMongoReadEndpoint } from './generator/mongo/mongo.endpoint.js';

export const MongoGenerator = {
  genAPISpec,
  genRepository,
  genViewRepository,
};

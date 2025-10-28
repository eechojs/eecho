import { genAPISpec } from "./generator/mongo/mongo.api.generator";
import { genRepository, genViewRepository } from "./generator/mongo/mongo.generator";

export { setAPIEndpoint, setMiddleware } from "./api/api";
export { ExceptionMiddleware } from "./api/api.middleware";

export const MongoGenerator = {
  genAPISpec,
  genRepository,
  genViewRepository
}

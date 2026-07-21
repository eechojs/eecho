import type { Router } from 'express';
import { ObjectId } from 'mongodb';

import type { ServerAPISpecification } from '@eecho/definition';

import { setAPIEndpoint } from '../../api/api.js';
import type { ExtractQueryParams, ExtractResponseType } from '../../api/api.type.js';

interface MongoReadRepository<TQuery> {
  getItems(input: TQuery): Promise<unknown[]>;
}

function toTransportValue(value: unknown): unknown {
  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  if (Array.isArray(value)) {
    return value.map(toTransportValue);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toTransportValue(entry)]),
    );
  }

  return value;
}

/** Registers the conventional generated read endpoint for a Mongo repository. */
export function registerMongoReadEndpoint<TSpec extends ServerAPISpecification>(input: {
  router: Router;
  apiSpec: TSpec;
  repository: MongoReadRepository<ExtractQueryParams<TSpec>>;
}) {
  setAPIEndpoint({
    router: input.router,
    apiSpec: input.apiSpec,
    handler: async ({ res, params }) => {
      const documents = await input.repository.getItems(params.query);
      const response = input.apiSpec.Response.body.parse({
        success: true,
        data: toTransportValue(documents),
      }) as ExtractResponseType<TSpec>;

      res.json(response);
      return response;
    },
  });
}

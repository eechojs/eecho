import { Filter, MongoClient, OptionalUnlessRequiredId } from 'mongodb';

import type { DefinitionDocument } from '@eecho/definition';
import { DefaultMongoRepository, MongoDefinition } from '../repository';

export function genRepository<TDefinition extends MongoDefinition>(params: {
  definition: TDefinition;
  dbClient: Promise<MongoClient>;
  dbName?: string;
  collectionName: string;
}): DefaultMongoRepository<TDefinition> {
  const { dbClient, dbName, collectionName } = params;

  type Schema = DefinitionDocument<TDefinition>;
  const __collection__ = (async () => {
    return (await dbClient).db(dbName).collection<Schema>(collectionName);
  })();

  const repository: DefaultMongoRepository<TDefinition> = {
    async createItems({ data }, option) {
      const collection = await __collection__;
      return collection.insertMany(data as OptionalUnlessRequiredId<Schema>[], option);
    },

    async readItems({ page = 1, limit = 15, search }, option) {
      const collection = await __collection__;

      const baseQuery = (search ?? {}) as Filter<Schema>;
      return collection
        .find(baseQuery, option)
        .limit(limit)
        .skip((page - 1) * limit)
        .toArray();
    },

    async updateItems(params, option) {
      if (!params.length) {
        return [];
      }

      return [];
    },

    async deleteItems(params, option) {
      if (!params.length) {
        return [];
      }

      return [];
    },
  };

  return repository;
}

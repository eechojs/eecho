import { ObjectId } from 'mongodb';
import type {
  ClientSession,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  MongoClient,
  OptionalUnlessRequiredId,
  Sort,
  UpdateFilter,
} from 'mongodb';
import { z } from 'zod';

import {
  extractCreateFieldWithSystem,
  extractObjectIdFields,
  extractSearchArrayOption,
  extractSearchOption,
  extractSortableOption,
  findRepositoryContext,
} from '@eecho/definition';
import type {
  Definition,
  DefinitionDocument,
  RepositoryContextEntry,
  SearchField,
  SortField,
  UpdateField,
  ViewDefinition,
} from '@eecho/definition';

type CreateDocument<TDefinition extends Definition> = {
  [K in keyof ReturnType<typeof extractCreateFieldWithSystem<TDefinition>>]:
    z.input<ReturnType<typeof extractCreateFieldWithSystem<TDefinition>>[K]>;
};

interface RelationInfo {
  relation: ViewDefinition['relations'][number];
  context: RepositoryContextEntry;
  alias: string;
}

function getSearchableFields(definition: Definition) {
  return new Set([
    ...Object.keys(extractSearchOption({ definition })),
    ...Object.keys(extractSearchArrayOption({ definition })),
  ]);
}

function getSortableFields(definition: Definition) {
  return new Set(Object.keys(extractSortableOption({ definition })));
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchQuery<TDocument extends Document>(
  filter: object | undefined,
  searchableFields: ReadonlySet<string>,
  objectIdFields: ReadonlySet<string>,
) {
  if (!filter) {
    return {};
  }

  const entries = Object.entries(filter)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (!searchableFields.has(key)) {
        throw new Error(`Invalid search field: ${key}`);
      }

      if (objectIdFields.has(key)) {
        const objectIdValue = (item: unknown) => (
          item === null || item instanceof ObjectId
            ? item
            : new ObjectId(String(item))
        );

        return Array.isArray(value)
          ? [key, { $in: value.map(objectIdValue) }]
          : [key, objectIdValue(value)];
      }

      if (Array.isArray(value)) {
        return [key, { $in: value }];
      }

      if (typeof value === 'string') {
        return [key, { $regex: escapeRegularExpression(value), $options: 'i' }];
      }

      if (
        value === null
        || typeof value === 'number'
        || typeof value === 'boolean'
        || value instanceof Date
        || value instanceof ObjectId
      ) {
        return [key, value];
      }

      throw new Error(`Unsupported search value for field: ${key}`);
    });

  return Object.fromEntries(entries) as Filter<TDocument>;
}

function buildSort(
  sort: object | undefined,
  sortableFields: ReadonlySet<string>,
): Sort | undefined {
  if (!sort) {
    return undefined;
  }

  const entries = Object.entries(sort).map(([key, direction]) => {
    if (!sortableFields.has(key)) {
      throw new Error(`Invalid sort field: ${key}`);
    }

    if (direction !== 'asc' && direction !== 'desc') {
      throw new Error(`Invalid sort direction for field: ${key}`);
    }

    return [key, direction === 'asc' ? 1 : -1];
  });

  return Object.fromEntries(entries);
}

function convertObjectIdFields(
  document: Record<string, unknown>,
  objectIdFields: ReadonlySet<string>,
) {
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => {
      if (!objectIdFields.has(key) || value === null || value === undefined) {
        return [key, value];
      }

      if (Array.isArray(value)) {
        return [key, value.map((item) => item instanceof ObjectId ? item : new ObjectId(String(item)))];
      }

      return [key, value instanceof ObjectId ? value : new ObjectId(String(value))];
    }),
  );
}

function validatePagination(page: number, limit: number) {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError('page must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('limit must be a positive integer.');
  }
}

export function genRepository<TDefinition extends Definition>(params: {
  definition: TDefinition;
  dbClient: Promise<MongoClient>;
  dbName?: string;
  collectionName: string;
}) {
  const { definition, dbClient, dbName, collectionName } = params;
  type Schema = DefinitionDocument<TDefinition>;

  const searchableFields = getSearchableFields(definition);
  const sortableFields = getSortableFields(definition);
  const objectIdFields = new Set(extractObjectIdFields({ definition }).map(String));
  const createSchema = z.object(extractCreateFieldWithSystem({ definition }));
  const getCollection = async () => (
    (await dbClient).db(dbName).collection<Schema>(collectionName)
  );

  return {
    async getItems(input: {
      page?: number;
      limit?: number;
      filter?: SearchField<TDefinition>;
      sort?: SortField<TDefinition>;
      // Backward-compatible alias; filter is the public API term used by generated specifications.
      search?: SearchField<TDefinition>;
    } = {}) {
      const { page = 1, limit = 15, filter, search, sort } = input;
      validatePagination(page, limit);

      const collection = await getCollection();
      const query = buildSearchQuery<Schema>(
        filter ?? search,
        searchableFields,
        objectIdFields,
      );
      const cursor = collection
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit);
      const mongoSort = buildSort(sort, sortableFields);

      if (mongoSort) {
        cursor.sort(mongoSort);
      }

      return cursor.toArray();
    },

    async putItem(input: {
      idFilter: Filter<Schema>;
      updateFilter: UpdateFilter<Schema>;
      putOption?: FindOneAndUpdateOptions;
    }) {
      const collection = await getCollection();
      const document = await collection.findOneAndUpdate(
        input.idFilter,
        input.updateFilter,
        input.putOption ?? {},
      );

      if (!document) {
        throw new Error('Failed to upsert document.');
      }

      return document;
    },

    async updateItemById(
      input: {
        _id: ObjectId | string;
        data: UpdateField<TDefinition>;
      },
      options?: { session?: ClientSession },
    ) {
      const collection = await getCollection();

      return collection.updateOne(
        { _id: { $eq: input._id instanceof ObjectId ? input._id : new ObjectId(input._id) } } as Filter<Schema>,
        { $set: input.data as Partial<Schema> },
        { session: options?.session },
      );
    },

    async createItems(
      input: { items: CreateDocument<TDefinition>[] },
      options?: { session?: ClientSession },
    ) {
      const collection = await getCollection();
      const validatedItems = input.items.map((item) => (
        convertObjectIdFields(createSchema.parse(item), objectIdFields)
      ));

      // Zod validates the generated shape, but MongoDB cannot derive its generic from that runtime schema.
      return collection.insertMany(
        validatedItems as unknown as OptionalUnlessRequiredId<Schema>[],
        { session: options?.session },
      );
    },
  };
}

function buildProjection(
  viewDefinition: ViewDefinition['viewDefinition'],
  baseModelKeys: ReadonlySet<string>,
  relationInfos: readonly RelationInfo[],
) {
  const projectionEntries: Array<[string, unknown]> = [['_id', 1]];

  for (const [key, fieldDefinition] of Object.entries(viewDefinition)) {
    if (baseModelKeys.has(key)) {
      projectionEntries.push([key, 1]);
      continue;
    }

    const relationInfo = relationInfos.find(({ relation }) => (
      Object.values(relation.relationModel)
        .some((relationField) => relationField.key === fieldDefinition.key)
    ));

    projectionEntries.push([
      key,
      relationInfo
        ? { $first: `$${relationInfo.alias}.${fieldDefinition.key}` }
        : 1,
    ]);
  }

  return { $project: Object.fromEntries(projectionEntries) };
}

export function genViewRepository<TDefinition extends ViewDefinition>(params: {
  definition: TDefinition;
  dbClient: Promise<MongoClient>;
}) {
  const { definition, dbClient } = params;
  const baseModelContext = findRepositoryContext(definition.baseModel);

  if (!baseModelContext) {
    throw new Error('Base model is not registered.');
  }

  const searchableFields = getSearchableFields(definition.viewDefinition);
  const sortableFields = getSortableFields(definition.viewDefinition);
  const objectIdFields = new Set(
    extractObjectIdFields({ definition: definition.viewDefinition }).map(String),
  );
  const baseModelKeys = new Set(Object.keys(definition.baseModel));
  const relationInfos = definition.relations.map((relation): RelationInfo => {
    const context = findRepositoryContext(relation.relationModel);

    if (!context) {
      throw new Error('Relation model is not registered.');
    }

    return {
      relation,
      context,
      alias: `${context.collectionName}_${relation.relationKey}_info`,
    };
  });
  const getCollection = async () => (
    (await dbClient)
      .db(baseModelContext.dbName)
      .collection(baseModelContext.collectionName)
  );

  return {
    async getItems(input: {
      page?: number;
      limit?: number;
      filter?: SearchField<TDefinition['viewDefinition']>;
      sort?: SortField<TDefinition['viewDefinition']>;
      // Backward-compatible alias; filter is the public API term used by generated specifications.
      search?: SearchField<TDefinition['viewDefinition']>;
    } = {}) {
      const { page = 1, limit = 15, filter, search, sort } = input;
      validatePagination(page, limit);

      const query = buildSearchQuery<Document>(
        filter ?? search,
        searchableFields,
        objectIdFields,
      );
      const mongoSort = buildSort(sort, sortableFields);
      const lookups = relationInfos.map(({ relation, context, alias }) => ({
        $lookup: {
          from: context.collectionName,
          localField: relation.baseKey,
          foreignField: relation.relationKey,
          as: alias,
        },
      }));
      const pipeline: Document[] = [
        ...lookups,
        buildProjection(definition.viewDefinition, baseModelKeys, relationInfos),
        { $match: query },
        ...(mongoSort ? [{ $sort: mongoSort }] : []),
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];
      const collection = await getCollection();

      return collection
        .aggregate<DefinitionDocument<TDefinition['viewDefinition']>>(pipeline)
        .toArray();
    },
  };
}

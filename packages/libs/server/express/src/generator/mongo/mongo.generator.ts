import { ClientSession, Filter, FindOneAndUpdateOptions, MongoClient, ObjectId, UpdateFilter } from "mongodb";
import { z } from 'zod';

import { ViewDefinition, Context, Definition } from "@eecho/definition";
import { extractSearchOption, extractSearchArrayOption, extractUpdateOption, extractCreateFieldWithSystem } from "@eecho/definition";

// 타입 정의들
type DefinitionDocument<T extends Definition> = {
  [K in keyof T]: z.infer<T[K]['type']>;
};

// Create용 타입: Optional만 제외하고 System 포함
type CreateDocument<T extends Definition> = {
  [K in keyof ReturnType<typeof extractCreateFieldWithSystem<T>>]: z.infer<ReturnType<typeof extractCreateFieldWithSystem<T>>[K]>;
};

// 검색 가능한 필드들을 추출하는 헬퍼 함수 (기존 helper 활용)
function getSearchableFields(definition: Definition) {
  const searchableFields = Object.keys(extractSearchOption({ definition }));
  const searchableArrayFields = Object.keys(extractSearchArrayOption({ definition }));
  return [...searchableFields, ...searchableArrayFields];
}

// 검색 쿼리를 빌드하는 헬퍼 함수
function buildSearchQuery(search: any, searchableFields: string[]) {
  if (!search) return {};
  
  return Object.fromEntries(
    Object.entries(search)
      .filter(([_, value]) => value)
      .map(([key, value]) => {
        if (!searchableFields.includes(key)) {
          throw new Error(`Invalid search field: ${key}`);
        }

        if (Array.isArray(value)) {
          return [key, { $in: value }];
        } else if (typeof value === 'string') {
          return [key, { $regex: value, $options: 'i' }];
        } else if (value instanceof ObjectId) {
          return [key, value];
        } else {
          throw new Error(`Unsupported search field type for key: ${key}`);
        }
      })
  );
}

export function genRepository<TDefinition extends Definition>(params: {
  definition: TDefinition;
  dbClient: Promise<MongoClient>;
  dbName?: string;
  collectionName: string;
}) {
  const { definition, dbClient, dbName, collectionName } = params;

  type Schema = DefinitionDocument<TDefinition>;
  
  // 컬렉션 가져오기
  const getCollection = async () => {
    return (await dbClient).db(dbName).collection<Schema>(collectionName);
  };

  const searchableFields = getSearchableFields(definition);

  const repository = {
    async getItems(params: { 
      page?: number; 
      limit?: number; 
      search?: any; 
    }) {
      const collection = await getCollection();
      const { page = 1, limit = 15, search } = params;

      const query = buildSearchQuery(search, searchableFields);
      
      return collection
        .find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .toArray();
    },
    async putItem(params: {
      idFilter: Filter<Schema>;
      updateFilter: UpdateFilter<Schema>;
      putOption?: FindOneAndUpdateOptions;
    }) {
      const collection = await getCollection();
      const doc = await collection.findOneAndUpdate(
        params.idFilter, 
        params.updateFilter, 
        params.putOption ?? {}
      );
      
      if (!doc) {
        throw new Error('Failed to upsert document.');
      }

      return doc;
    },
    async updateItemById(
      params: {
        _id: ObjectId;
        data: any;
      },
      option?: {
        session?: ClientSession;
      }
    ) {
      const collection = await getCollection();
      
      return collection.updateOne(
        { _id: { $eq: params._id } } as Filter<Schema>,
        { $set: params.data as Partial<Schema> },
        { session: option?.session }
      );
    },
    async createItems(
      params: {
        items: CreateDocument<TDefinition>[];
      },
      option?: {
        session?: ClientSession;
      }
    ) {
      const collection = await getCollection();
      
      // extractCreateFieldWithSystem을 사용하여 스키마 생성 (Optional만 제외)
      const createFields = extractCreateFieldWithSystem({ definition });
      const createSchema = z.object(createFields);
      
      // 각 아이템에 대해 스키마 검증
      const validatedItems = params.items.map(item => createSchema.parse(item));
      
      return collection.insertMany(
        validatedItems as any[],
        { session: option?.session }
      );
    },
    
  };

  return repository;
}

// Projection을 빌드하는 헬퍼 함수
function buildProjection(
  viewDefinition: any,
  baseModelKeys: Set<string>,
  relationInfos: any[]
) {
  const projectionEntries: [string, any][] = [['_id', 1]];

  for (const [key, fieldDef] of Object.entries(viewDefinition)) {
    if (baseModelKeys.has(key)) {
      projectionEntries.push([key, 1]);
      continue;
    }

    let mapped = false;
    for (const { rel, alias } of relationInfos) {
      const relationField = Object.values(rel.relationModel).find(
        (relationDef: any) => relationDef.key === (fieldDef as any).key
      );

      if (relationField) {
        projectionEntries.push([
          key,
          { $first: `$${alias}.${(relationField as any).key}` }
        ]);
        mapped = true;
        break;
      }
    }

    if (!mapped) {
      projectionEntries.push([key, 1]);
    }
  }

  return { $project: Object.fromEntries(projectionEntries) };
}

// View Repository 생성 함수 (인터셉터 미지원)
export function genViewRepository<TDefinition extends ViewDefinition>(params: {
  definition: TDefinition;
  dbClient: Promise<MongoClient>;
}) {
  const { definition, dbClient } = params;

  // Base Model 컨텍스트 찾기
  const baseModelContext = Context.RepositoryContext.find(
    (x) => x.model === definition.baseModel
  );
  if (!baseModelContext) {
    throw new Error('BaseModel Not Registered');
  }

  // 컬렉션 가져오기
  const getCollection = async () => {
    const client = await dbClient;
    return client
      .db(baseModelContext.dbName)
      .collection(baseModelContext.collectionName);
  };

  // 검색 가능한 필드들 추출 (기존 helper 활용)
  const searchableFields = getSearchableFields(definition.viewDefinition);

  const baseModelKeys = new Set(Object.keys(definition.baseModel));

  // Relation 정보들을 미리 계산
  const relationInfos = definition.relations.map((rel) => {
    const relModelContext = Context.RepositoryContext.find(
      (x) => x.model === rel.relationModel
    );
    if (!relModelContext) {
      throw new Error('Relation Model Not Registered');
    }

    return {
      rel,
      relModelContext,
      alias: `${relModelContext.collectionName}_${rel.relationKey}_info`,
    };
  });

  const repository = {
    async getItems(params: {
      page?: number;
      limit?: number;
      search?: any;
    }) {
      const collection = await getCollection();
      const { page = 1, limit = 15, search } = params;

      // 검색 조건 빌드
      const query = buildSearchQuery(search, searchableFields);

      // $lookup 단계 빌드
      const lookups = relationInfos.map(({ rel, relModelContext, alias }) => ({
        $lookup: {
          from: relModelContext.collectionName,
          localField: rel.baseKey,
          foreignField: rel.relationKey,
          as: alias,
        },
      }));

      // Projection 단계 빌드
      const projection = buildProjection(definition.viewDefinition, baseModelKeys, relationInfos);

      // Aggregate 실행
      const docs = await collection
        .aggregate([
          { $match: query },
          ...lookups,
          { $skip: (page - 1) * limit },
          { $limit: limit },
          projection,
        ])
        .toArray() as DefinitionDocument<TDefinition['viewDefinition']>[];

      return docs;
    },
  };

  return repository;
}

import { z } from 'zod';
import { Context } from './definition.context';

const DefinitionIndex = z.enum([
  "Identifier",
  "UniqueForeignIdentifier",
  "ForeignIdentifier",
  "ObjectId",
]);
const APIDefinition = z.object({
  index: z.enum([]).array().optional(),
  create: z.enum(["Optional", "System"]).array().optional(),
  read: z.enum(["Detail", "Hidden", "Searchable", "Sortable", "SearchableArray"]).array().optional(),
  update: z.enum(["Updatable"]).array().optional(),
  delete: z.enum([]).array().optional(),
});
export type DefinitionIndex = z.infer<typeof DefinitionIndex>;
export type APIDefinition = z.infer<typeof APIDefinition>;

export interface Definition {
  key: string;
  type: z.ZodTypeAny;
  index?: DefinitionIndex[];
  api?: APIDefinition;
}

interface InputDefinition {
  key?: string;
  type: z.ZodTypeAny;
  index?: DefinitionIndex[];
  api?: APIDefinition
}

// Collection Name.
// Database Name.
export interface ModelDefinition {
  [field: string]: Definition;
};

interface InputModelDefinition {
  [field: string]: InputDefinition
};

// Never permit directional m:n relation.
export interface ViewDefinition {
  baseModel: ModelDefinition;
  viewDefinition: {
    [field: string]: Definition & {
      model?: Definition;
    };
  };
  relations: {
    relationModel: ModelDefinition;
    baseKey: string;
    relationKey: string;
  }[];
  index?: [];
};

export function defineModel<const T extends InputModelDefinition>(model: T) {
  const definition = (Object.keys(model) as Array<keyof T>).reduce(
    (acc, key) => {
      const value = model[key];

      type Value = T[typeof key];
      type HasKeyField = Value extends { key: any } ? true : false;

      // 🔹 타입 레벨에서는 조건부
      type Result = HasKeyField extends true
        ? Value // 이미 key가 있다면 그대로
        : Value & { key: typeof key }; // 없으면 보강

      (acc as any)[key] = {
        ...value,
        key: value.key ?? key,
      } as Result;

      return acc;
    },
    {} as {
      [K in keyof T]: T[K] extends { key: any }
        ? T[K]
        : T[K] & { key: K };
    },
  );

  return definition;
}

export function registerModel(params: {
  definition: ModelDefinition;
  collectionName: string;
  dbName: string;
}){
  Context.RepositoryContext.push({
    model: params.definition,
    collectionName: params.collectionName,
    dbName: params.dbName,
  })
  return;
};

import { z } from 'zod';

export type PrimitiveIndex = 'Identifier' | 'ForeignIdentifier' | 'ObjectId';
export type CreateCapability = 'Optional' | 'System';
export type ReadCapability =
  | 'Detail'
  | 'Hidden'
  | 'Searchable'
  | 'SystemSearchable'
  | 'Sortable'
  | 'SearchableArray';
export type UpdateCapability = 'Filter' | 'Updatable';

export interface APIIndex {
  index: readonly never[];
  create: readonly CreateCapability[];
  read: readonly ReadCapability[];
  update: readonly UpdateCapability[];
  delete: readonly never[];
}

export interface PrimitiveDefinition<
  TType extends z.ZodTypeAny = z.ZodTypeAny,
  TIndex extends readonly PrimitiveIndex[] = readonly PrimitiveIndex[],
  TApi extends APIIndex = APIIndex,
  TKey extends string = string
> {
  type: TType;
  index: TIndex;
  api: TApi;
  key: TKey;
  kind: "primitive";
};

export interface ArrayDefinition<
  TType extends PrimitiveDefinition | ObjectDefinition = PrimitiveDefinition | ObjectDefinition,
  TKey extends string = string
> {
  type: TType;
  key: TKey;
  kind: "array";
}

export interface ObjectDefinition<
  TType extends Definition = Definition,
  TKey extends string = string
> {
  type: TType;
  key: TKey;
  kind: "object";
}

export interface Definition {
  [field: string]: PrimitiveDefinition | ArrayDefinition | ObjectDefinition;
}

export interface InputPrimitiveDefinition<
  TType extends z.ZodTypeAny = z.ZodTypeAny,
  TIndex extends readonly PrimitiveIndex[] = readonly PrimitiveIndex[],
  TApi extends Partial<APIIndex> = Partial<APIIndex>
> {
  type: TType;
  index?: TIndex;
  api?: TApi;
}

export interface InputArrayDefinition<
  Titem extends InputPrimitiveDefinition | InputObjectDefinition 
    = InputPrimitiveDefinition | InputObjectDefinition
> {
  type: readonly [Titem];
};

export interface InputObjectDefinition<
  Ttype extends InputDefinition = InputDefinition
> {
  type: Ttype;
}

export interface InputDefinition {
  [field: string]: InputPrimitiveDefinition | InputArrayDefinition | InputObjectDefinition;
};

type NormalizeAPI<TApi extends Partial<APIIndex> | undefined> = {
  index: TApi extends { index: infer TIndex extends APIIndex['index'] } ? TIndex : [];
  create: TApi extends { create: infer TCreate extends APIIndex['create'] } ? TCreate : [];
  read: TApi extends { read: infer TRead extends APIIndex['read'] } ? TRead : [];
  update: TApi extends { update: infer TUpdate extends APIIndex['update'] } ? TUpdate : [];
  delete: TApi extends { delete: infer TDelete extends APIIndex['delete'] } ? TDelete : [];
};

type NormalizeArrayItem<TItem, TKey extends string> =
  TItem extends InputPrimitiveDefinition<infer TType, infer TIndex, infer TApi>
    ? PrimitiveDefinition<TType, TIndex, NormalizeAPI<TApi>, `${TKey}Item`>
    : TItem extends InputObjectDefinition<infer TObject>
      ? ObjectDefinition<DefinitionFrom<TObject>, `${TKey}Item`>
      : never;

type NormalizeField<TField, TKey extends string> =
  TField extends InputPrimitiveDefinition<infer TType, infer TIndex, infer TApi>
    ? PrimitiveDefinition<TType, TIndex, NormalizeAPI<TApi>, TKey>
    : TField extends InputArrayDefinition<infer TItem>
      ? ArrayDefinition<NormalizeArrayItem<TItem, TKey>, TKey>
      : TField extends InputObjectDefinition<infer TObject>
        ? ObjectDefinition<DefinitionFrom<TObject>, TKey>
        : never;

export type DefinitionFrom<T extends InputDefinition> = {
  [K in keyof T & string]: NormalizeField<T[K], K>;
};

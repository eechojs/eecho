import { z } from 'zod';
import { Definition, PrimitiveDefinition, APIIndex } from '../model/model.define.type';

export function extractCreateRequiredField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const createRequiredFields = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.create?.includes("Optional") || value.api?.create?.includes("System")) return false;
      return true;
    }).map(([key, value])=>([key, value.type]))
  );

  return createRequiredFields as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { create: infer Indices }
          ? Indices extends APIIndex['create']
            ? 'Optional' extends Indices[number]
              ? never
              : 'System' extends Indices[number]
                ? never
                : K
            : K
          : K
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? T : never;
  };
};

export function extractReadbleField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const readbleFile =  Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.read?.includes("Hidden") || value.api?.read?.includes("Detail")) return false;
      return true;
    }).map(([key, value])=>([key, value.type]))
  );

  return readbleFile as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { read: infer Indices }
          ? Indices extends APIIndex['read']
            ? 'Hidden' extends Indices[number]
              ? never
              : 'Detail' extends Indices[number]
                ? never
                : K
            : K
          : K
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? T : never;
  };
}

export function extractUpdateOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const updatableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.update?.includes("Updatable")) return true;
      return false;
    }).map(([key, value])=>([key, (value as PrimitiveDefinition).type.optional()]))
  );
  
  return updatableOption as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { update: infer Indices }
          ? Indices extends APIIndex['update']
            ? 'Updatable' extends Indices[number]
              ? K
              : never
            : never
          : never
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? z.ZodOptional<T> : never;
  };
};

export function extractSearchOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const searchableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.read?.includes("Searchable")) return true;
      return false;
    }).map(([key, value])=>([key, (value as PrimitiveDefinition).type.optional()]))
  );

  return searchableOption as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { read: infer Indices }
          ? Indices extends APIIndex['read']
            ? 'Searchable' extends Indices[number]
              ? K
              : never
            : never
          : never
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? z.ZodOptional<T> : never;
  };
};

export function extractSearchArrayOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const searchableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.read?.includes("SearchableArray")) return true;
      return false;
    }).map(([key, value])=>([key, (value as PrimitiveDefinition).type.optional().array().optional()]))
  );

  return searchableOption as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { read: infer Indices }
          ? Indices extends APIIndex['read']
            ? 'SearchableArray' extends Indices[number]
              ? K
              : never
            : never
          : never
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? z.ZodOptional<z.ZodArray<z.ZodOptional<T>>> : never;
  };
};

export function extractSortableOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const sortableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.kind !== 'primitive') return false;
      if(value.api?.read?.includes("Sortable")) return true;
      return false;
    }).map(([key, value])=>([key, (value as PrimitiveDefinition).type.optional()]))
  );
  
  return sortableOption as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { read: infer Indices }
          ? Indices extends APIIndex['read']
            ? 'Sortable' extends Indices[number]
              ? K
              : never
            : never
          : never
        : never
    ] : TDefinition[K] extends PrimitiveDefinition<infer T> ? z.ZodOptional<T> : never;
  };
};

export function extractObjectIdFields<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const objectIdFields = Object.entries(definition)
    .filter(([, value]) => value.kind === 'primitive' && value.index?.includes('ObjectId'))
    .map(([key]) => key);

  return objectIdFields as Array<{
    [K in keyof TDefinition]:
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['index'] extends (infer TIndices)[]
          ? 'ObjectId' extends TIndices
            ? K
            : never
          : never
        : never;
  }[keyof TDefinition]>;
}

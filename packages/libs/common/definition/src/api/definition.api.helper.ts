import { z } from 'zod';

import { APIDefinition, ModelDefinition } from "../model.definition";

export function extractCreateRequiredField<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const createRequiredFields = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.create?.includes("Optional") || value.api?.create?.includes("System")) return false
      else return true;
    }).map(([key, value])=>([key, value.type]))
  );

  return createRequiredFields as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { create: infer Indices }
        ? Indices extends APIDefinition['create']
          ? 'Optional' extends NonNullable<Indices>[number]
            ? never
            : 'System' extends NonNullable<Indices>[number]
              ? never
              : K
          : K
        : K
    ] : TDefinition[K]['type'];
  };
};

export function extractReadbleField<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const readbleFile =  Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.read?.includes("Hidden") || value.api?.read?.includes("Detail"))
      {
        return false;
      } else { 
        return true;
      }
    }).map(([key, value])=>([key, value.type]))
  );

  return readbleFile as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { read: infer Indices }
        ? Indices extends APIDefinition['read']
          ? 'Hidden' extends NonNullable<Indices>[number]
            ? never
            : 'Detail' extends NonNullable<Indices>[number]
              ? never
              : K
          : K
        : K
    ] : TDefinition[K]['type'];
  };
}

export function extractUpdateOption<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const updatableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.update?.includes("Updatable")) 
     { 
        return true;
      }
      else {
        return false;
      }
    }).map(([key, value])=>([key, value.type.optional()]))
  );
  
  return updatableOption as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { update: infer Indices }
        ? Indices extends APIDefinition['update']
          ? 'Updatable' extends NonNullable<Indices>[number]
            ? K
            : never
          : never
        : never
    ] : z.ZodOptional<TDefinition[K]['type']>;
  };
};

export function extractSearchOption<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const searchableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.read?.includes("Searchable")) 
     { 
        return true;
      }
      else {
        return false;
      }
    }).map(([key, value])=>([key, value.type.optional()]))
  );

  return searchableOption as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { read: infer Indices }
        ? Indices extends APIDefinition['read']
          ? 'Searchable' extends NonNullable<Indices>[number]
            ? K
            : never
          : never
        : never
    ] : z.ZodOptional<TDefinition[K]['type']>;
  };
};

export function extractSearchArrayOption<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const searchableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.read?.includes("SearchableArray")) 
     { 
        return true;
      }
      else {
        return false;
      }
    }).map(([key, value])=>([key, value.type.optional().array().optional()]))
  );

  return searchableOption as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { read: infer Indices }
        ? Indices extends APIDefinition['read']
          ? 'Searchable' extends NonNullable<Indices>[number]
            ? K
            : never
          : never
        : never
    ] : z.ZodOptional<z.ZodArray<z.ZodOptional<TDefinition[K]['type']>>>;
  };
};

export function extractSortableOption<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const sortableOption = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      if(value.api?.read?.includes("Sortable")) 
     { 
        return true;
      }
      else {
        return false;
      }
    }).map(([key, value])=>([key, value.type.optional()]))
  );
  
  return sortableOption as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { read: infer Indices }
        ? Indices extends APIDefinition['read']
          ? 'Sortable' extends NonNullable<Indices>[number]
            ? K
            : never
          : never
        : never
    ] : z.ZodOptional<TDefinition[K]['type']>;
  };
};

export function extractObjectIdFields<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const objectIdFields = Object.entries(definition)
    .filter(([, value]) => value.index?.includes('ObjectId'))
    .map(([key]) => key);

  return objectIdFields as Array<{
    [K in keyof TDefinition]:
      TDefinition[K]['index'] extends (infer TIndices)[]
        ? 'ObjectId' extends TIndices
          ? K
          : never
        : never;
  }[keyof TDefinition]>;
}

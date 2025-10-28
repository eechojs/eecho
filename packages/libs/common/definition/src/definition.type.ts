import { z } from 'zod';

const DefinitionIndex = z.enum([
  "Identifier",
]);

const APIDefinition = z.enum(["Searchable", "Sortable", "Detail", "Updatable"]);

type DefinitionIndex = z.infer<typeof DefinitionIndex>;
type APIDefinition = z.infer<typeof APIDefinition>;

export interface Definition {
  [field: string]: {
    type: z.ZodTypeAny;
    index?: DefinitionIndex[];
    api?: {
      index: APIDefinition[];
    }
  }
}

export type DefinitionDocument<T extends Definition> = {
  [K in keyof T]: z.infer<T[K]['type']>;
}

export type UpdateField<T extends Definition> = {
  [K in keyof T as T[K]['api'] extends { index: infer Indices }
    ? Indices extends APIDefinition[]
      ? 'Updatable' extends Indices[number]
        ? K
        : never
      : never
    : never] ?: z.infer<T[K]['type']>;
};

export type SearchField<T extends Definition> = {
  [K in keyof T as T[K]['api'] extends { index: infer Indices }
    ? Indices extends APIDefinition[]
      ? 'Searchable' extends Indices[number]
        ? K
        : never
      : never
    : never]?: z.infer<T[K]['type']> extends string
      ? z.infer<T[K]['type']> | z.infer<T[K]['type']>[]
      : z.infer<T[K]['type']>;
};

export type IdentifierField <T extends Definition> = {
  [K in keyof T as T[K]['index'] extends DefinitionIndex[]
    ? T[K]['index'] extends DefinitionIndex[]
      ? 'Identifier' extends T[K]['index'][number]
        ? K
        : never
      : never
    : never]: z.infer<T[K]['type']>;
};

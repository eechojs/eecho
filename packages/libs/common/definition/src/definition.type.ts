import { z } from 'zod';
import type { Definition } from './model/model.define.type'

export type DefinitionDocument<T extends Definition> = {
  [K in keyof T]: z.infer<T[K]['type']>;
}

export type UpdateField<T extends Definition> = {
  [K in keyof T as T[K] extends { api: { update: infer U } }
    ? U extends readonly (infer Item)[]
      ? 'Updatable' extends Item
        ? K
        : never
      : never
    : never]?: z.infer<T[K]['type']>;
};

export type SearchField<T extends Definition> = {
  [K in keyof T as T[K] extends { api: { read: infer R } }
    ? R extends readonly (infer Item)[]
      ? 'Searchable' extends Item
        ? K
        : never
      : never
    : never]?: z.infer<T[K]['type']> extends string
      ? z.infer<T[K]['type']> | z.infer<T[K]['type']>[]
      : z.infer<T[K]['type']>;
};

export type IdentifierField<T extends Definition> = {
  [K in keyof T as T[K] extends { index: infer I }
    ? I extends readonly (infer Item)[]
      ? 'Identifier' extends Item
        ? K
        : never
      : never
    : never]: z.infer<T[K]['type']>;
};

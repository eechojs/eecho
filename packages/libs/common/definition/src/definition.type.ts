import { z } from 'zod';
import type { Definition, PrimitiveDefinition, PrimitiveIndex, APIIndex } from './model/model.define.type.js';

type InferDefinitionValue<TField> =
  TField extends { kind: 'primitive'; type: infer TSchema extends z.ZodTypeAny }
    ? z.infer<TSchema>
    : TField extends { kind: 'array'; type: infer TItem }
      ? InferDefinitionValue<TItem>[]
      : TField extends { kind: 'object'; type: infer TObject extends Definition }
        ? DefinitionDocument<TObject>
        : never;

type PrimitiveKeysWithIndexFlag<TDefinition extends Definition, TFlag extends PrimitiveIndex> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<any, infer TIndices>
      ? TFlag extends TIndices[number]
        ? K
        : never
      : never;
}[keyof TDefinition];

type PrimitiveKeysWithApiFlag<
  TDefinition extends Definition,
  TSection extends keyof APIIndex,
  TFlag extends string
> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<any, any, infer TApi>
      ? TApi[TSection] extends readonly unknown[]
        ? TFlag extends TApi[TSection][number]
          ? K
          : never
        : never
      : never;
}[keyof TDefinition];

type SearchInput<TValue> = TValue extends string ? TValue | TValue[] : TValue;

export type DefinitionValue<TField> = InferDefinitionValue<TField>;

export type DefinitionDocument<T extends Definition> = {
  [K in keyof T]: DefinitionValue<T[K]>;
};

export type ModelDocument<T extends Definition> = DefinitionDocument<T>;

export type UpdateField<T extends Definition> = {
  [K in PrimitiveKeysWithApiFlag<T, 'update', 'Updatable'>]?: DefinitionValue<T[K]>;
};

export type SearchField<T extends Definition> = {
  [K in PrimitiveKeysWithApiFlag<T, 'read', 'Searchable'>]?: SearchInput<DefinitionValue<T[K]>>;
};

export type IdentifierField<T extends Definition> = {
  [K in PrimitiveKeysWithIndexFlag<T, 'Identifier'>]: DefinitionValue<T[K]>;
};

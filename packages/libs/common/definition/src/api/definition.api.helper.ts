import { z } from 'zod';
import { Definition, PrimitiveDefinition } from '../model/model.define.type';

type APISection = 'create' | 'read' | 'update';
type PrimitiveEntry<TDefinition extends Definition> = [
  keyof TDefinition & string,
  PrimitiveDefinition
];

type PrimitiveSchemaMap<TDefinition extends Definition, TKeys extends keyof TDefinition = keyof TDefinition> = {
  [K in TKeys as TDefinition[K] extends PrimitiveDefinition ? K : never]:
    TDefinition[K] extends PrimitiveDefinition<infer TSchema> ? TSchema : never;
};

type OptionalSchemaMap<TShape extends Record<string, z.ZodTypeAny>> = {
  [K in keyof TShape]: z.ZodOptional<TShape[K]>;
};

type OptionalArraySchemaMap<TShape extends Record<string, z.ZodTypeAny>> = {
  [K in keyof TShape]: z.ZodOptional<z.ZodArray<z.ZodOptional<TShape[K]>>>;
};

type PrimitiveKeysWithApiFlag<
  TDefinition extends Definition,
  TSection extends APISection,
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

type PrimitiveKeysWithoutApiFlags<
  TDefinition extends Definition,
  TSection extends APISection,
  TFlags extends readonly string[]
> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<any, any, infer TApi>
      ? TApi[TSection] extends readonly unknown[]
        ? Extract<TFlags[number], TApi[TSection][number]> extends never
          ? K
          : never
        : K
      : never;
}[keyof TDefinition];

type PrimitiveKeysWithIndexFlag<TDefinition extends Definition, TFlag extends string> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<any, infer TIndex>
      ? TFlag extends TIndex[number]
        ? K
        : never
      : never;
}[keyof TDefinition];

function getPrimitiveEntries<TDefinition extends Definition>(definition: TDefinition): PrimitiveEntry<TDefinition>[] {
  return Object.entries(definition).filter(([, value]) => value.kind === 'primitive') as PrimitiveEntry<TDefinition>[];
}

function hasAPIFlag<TSection extends APISection>(
  definition: PrimitiveDefinition,
  section: TSection,
  flag: string,
): boolean {
  return (definition.api[section] as readonly string[]).includes(flag);
}

function hasAnyAPIFlag<TSection extends APISection>(
  definition: PrimitiveDefinition,
  section: TSection,
  flags: readonly string[],
): boolean {
  return flags.some((flag) => hasAPIFlag(definition, section, flag));
}

function pickPrimitiveSchemaShape<TDefinition extends Definition>(
  definition: TDefinition,
  predicate: (definition: PrimitiveDefinition, key: keyof TDefinition & string) => boolean,
  transform?: (schema: z.ZodTypeAny) => z.ZodTypeAny,
) {
  return Object.fromEntries(
    getPrimitiveEntries(definition)
      .filter(([key, value]) => predicate(value, key))
      .map(([key, value]) => [key, transform ? transform(value.type) : value.type]),
  );
}

export function extractCreateRequiredField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const createRequiredFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => !hasAnyAPIFlag(field, 'create', ['Optional', 'System']),
  );

  return createRequiredFields as PrimitiveSchemaMap<
    TDefinition,
    PrimitiveKeysWithoutApiFlags<TDefinition, 'create', ['Optional', 'System']>
  >;
}

export function extractReadbleField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const readableFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => !hasAnyAPIFlag(field, 'read', ['Hidden', 'Detail']),
  );

  return readableFields as PrimitiveSchemaMap<
    TDefinition,
    PrimitiveKeysWithoutApiFlags<TDefinition, 'read', ['Hidden', 'Detail']>
  >;
}

export function extractUpdateOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const updatableFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'update', 'Updatable'),
    (schema) => schema.optional(),
  );

  return updatableFields as OptionalSchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'update', 'Updatable'>>
  >;
}

export function extractSearchOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const searchableFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'Searchable'),
    (schema) => schema.optional(),
  );

  return searchableFields as OptionalSchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'read', 'Searchable'>>
  >;
}

export function extractSearchArrayOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const searchableArrayFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'SearchableArray'),
    (schema) => schema.optional().array().optional(),
  );

  return searchableArrayFields as OptionalArraySchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'read', 'SearchableArray'>>
  >;
}

export function extractSortableOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const sortableFields = pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'Sortable'),
    (schema) => schema.optional(),
  );

  return sortableFields as OptionalSchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'read', 'Sortable'>>
  >;
}

export function extractObjectIdFields<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const objectIdFields = getPrimitiveEntries(params.definition)
    .filter(([, value]) => value.index.includes('ObjectId'))
    .map(([key]) => key);

  return objectIdFields as Array<PrimitiveKeysWithIndexFlag<TDefinition, 'ObjectId'>>;
}

import { z } from 'zod';

import type { PrimitiveKeysWithApiFlag, PrimitiveKeysWithIndexFlag } from '../definition.type.js';
import type { Definition, PrimitiveDefinition, PrimitiveIndex } from '../model/model.define.type.js';

type APISection = 'create' | 'read' | 'update';

type PrimitiveKeysWithoutApiFlags<
  TDefinition extends Definition,
  TSection extends APISection,
  TFlags extends readonly string[]
> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<z.ZodTypeAny, readonly PrimitiveIndex[], infer TApi>
      ? TApi[TSection] extends readonly unknown[]
        ? Extract<TFlags[number], TApi[TSection][number]> extends never
          ? K
          : never
        : K
      : never;
}[keyof TDefinition];

type PrimitiveSchemaMap<TDefinition extends Definition, TKeys extends keyof TDefinition> = {
  [K in TKeys as TDefinition[K] extends PrimitiveDefinition ? K : never]:
    TDefinition[K] extends PrimitiveDefinition<infer TSchema> ? TSchema : never;
};

type OptionalSchemaMap<TShape extends Record<string, z.ZodTypeAny>> = {
  [K in keyof TShape]: z.ZodOptional<TShape[K]>;
};

type OptionalArraySchemaMap<TShape extends Record<string, z.ZodTypeAny>> = {
  [K in keyof TShape]: z.ZodOptional<z.ZodArray<TShape[K]>>;
};

const sortDirectionSchema = z.enum(['asc', 'desc']);

function getPrimitiveEntries(definition: Definition) {
  return Object.entries(definition).filter(
    (entry): entry is [string, PrimitiveDefinition] => entry[1].kind === 'primitive',
  );
}

function hasAPIFlag(field: PrimitiveDefinition, section: APISection, ...flags: string[]) {
  const declaredFlags: readonly string[] = field.api[section];
  return flags.some((flag) => declaredFlags.includes(flag));
}

function pickPrimitiveSchemaShape(
  definition: Definition,
  predicate: (field: PrimitiveDefinition) => boolean,
  transform: (schema: z.ZodTypeAny) => z.ZodTypeAny = (schema) => schema,
) {
  return Object.fromEntries(
    getPrimitiveEntries(definition)
      .filter(([, field]) => predicate(field))
      .map(([key, field]) => [key, transform(field.type)]),
  );
}

export function extractCreateRequiredField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => !hasAPIFlag(field, 'create', 'Optional', 'System'),
  ) as PrimitiveSchemaMap<
    TDefinition,
    PrimitiveKeysWithoutApiFlags<TDefinition, 'create', ['Optional', 'System']>
  >;
}

export function extractCreateOptionalField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'create', 'Optional') && !hasAPIFlag(field, 'create', 'System'),
    (schema) => schema.optional(),
  ) as OptionalSchemaMap<
    PrimitiveSchemaMap<
      TDefinition,
      Extract<
        PrimitiveKeysWithApiFlag<TDefinition, 'create', 'Optional'>,
        PrimitiveKeysWithoutApiFlags<TDefinition, 'create', ['System']>
      >
    >
  >;
}

export function extractReadableField<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => !hasAPIFlag(field, 'read', 'Hidden', 'Detail'),
  ) as PrimitiveSchemaMap<
    TDefinition,
    PrimitiveKeysWithoutApiFlags<TDefinition, 'read', ['Hidden', 'Detail']>
  >;
}

// Keep the original misspelled export so existing consumers can migrate without a breaking release.
export const extractReadbleField = extractReadableField;

export function extractUpdateOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'update', 'Updatable'),
    (schema) => schema.optional(),
  ) as OptionalSchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'update', 'Updatable'>>
  >;
}

export function extractSearchOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'Searchable'),
    (schema) => schema.optional(),
  ) as OptionalSchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'read', 'Searchable'>>
  >;
}

export function extractSearchArrayOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'SearchableArray'),
    (schema) => z.array(schema).optional(),
  ) as OptionalArraySchemaMap<
    PrimitiveSchemaMap<TDefinition, PrimitiveKeysWithApiFlag<TDefinition, 'read', 'SearchableArray'>>
  >;
}

export function extractSortableOption<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return pickPrimitiveSchemaShape(
    params.definition,
    (field) => hasAPIFlag(field, 'read', 'Sortable'),
    () => sortDirectionSchema.optional(),
  ) as {
    [K in PrimitiveKeysWithApiFlag<TDefinition, 'read', 'Sortable'>]: z.ZodOptional<typeof sortDirectionSchema>;
  };
}

export function extractObjectIdFields<TDefinition extends Definition>(params: { definition: TDefinition }) {
  return getPrimitiveEntries(params.definition)
    .filter(([, field]) => field.index.includes('ObjectId'))
    .map(([key]) => key) as PrimitiveKeysWithIndexFlag<TDefinition, 'ObjectId'>[];
}

import { z } from 'zod';

import {
  APIIndex,
  ArrayDefinition,
  Definition,
  DefinitionFrom,
  InputArrayDefinition,
  InputDefinition,
  InputObjectDefinition,
  InputPrimitiveDefinition,
  PrimitiveDefinition,
} from './model.define.type.js';

type InputFieldDefinition = InputPrimitiveDefinition | InputArrayDefinition | InputObjectDefinition;
type NormalizedFieldDefinition = Definition[string];

const EMPTY_API_INDEX = {
  index: [],
  create: [],
  read: [],
  update: [],
  delete: [],
} as const satisfies APIIndex;

function normalizeAPIIndex(api?: Partial<APIIndex>): APIIndex {
  return {
    index: api?.index ?? EMPTY_API_INDEX.index,
    create: api?.create ?? EMPTY_API_INDEX.create,
    read: api?.read ?? EMPTY_API_INDEX.read,
    update: api?.update ?? EMPTY_API_INDEX.update,
    delete: api?.delete ?? EMPTY_API_INDEX.delete,
  };
}

function definePrimitive(input: InputPrimitiveDefinition, key: string): PrimitiveDefinition {
  return {
    ...input,
    key,
    kind: 'primitive',
    index: input.index ?? [],
    api: normalizeAPIIndex(input.api),
  };
}

function defineObject(input: InputObjectDefinition, key: string) {
  return {
    kind: 'object' as const,
    key,
    type: defineModel(input.type),
  };
}

function defineArray(input: InputArrayDefinition, key: string): ArrayDefinition {
  const itemDefinition = input.type[0];

  return {
    kind: 'array',
    key,
    type: isPrimitiveDefinitionInput(itemDefinition)
      ? definePrimitive(itemDefinition, `${key}Item`)
      : defineObject(itemDefinition, `${key}Item`),
  };
}

function isZodSchema(value: unknown): value is z.ZodTypeAny {
  return value instanceof z.ZodType || (
    typeof value === 'object' &&
    value !== null &&
    'safeParse' in value &&
    typeof value.safeParse === 'function'
  );
}

function isPrimitiveDefinitionInput(input: InputFieldDefinition): input is InputPrimitiveDefinition {
  return isZodSchema(input.type);
}

function isArrayDefinitionInput(input: InputFieldDefinition): input is InputArrayDefinition {
  return Array.isArray(input.type);
}

function normalizeFieldDefinition(input: InputFieldDefinition, key: string): NormalizedFieldDefinition {
  if (isArrayDefinitionInput(input)) {
    return defineArray(input, key);
  }

  if (isPrimitiveDefinitionInput(input)) {
    return definePrimitive(input, key);
  }

  return defineObject(input, key);
}

export function defineModel<const T extends InputDefinition>(input: T): DefinitionFrom<T> {
  const entries = Object.entries(input).map(([key, fieldDefinition]) => [
    key,
    normalizeFieldDefinition(fieldDefinition, key),
  ]);

  return Object.fromEntries(entries) as DefinitionFrom<T>;
}

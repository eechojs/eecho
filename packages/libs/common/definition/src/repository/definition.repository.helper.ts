import { z } from 'zod';

import type {
  ArrayDefinition,
  Definition,
  ObjectDefinition,
  PrimitiveDefinition,
  PrimitiveIndex,
} from '../model/model.define.type.js';
import type { DefinitionDocument } from '../definition.type.js';

type CreateFieldKeys<TDefinition extends Definition> = {
  [K in keyof TDefinition]:
    TDefinition[K] extends PrimitiveDefinition<z.ZodTypeAny, readonly PrimitiveIndex[], infer TApi>
      ? 'Optional' extends TApi['create'][number]
        ? never
        : K
      : K;
}[keyof TDefinition];

type FieldSchema<TField> =
  TField extends PrimitiveDefinition<infer TSchema>
    ? TSchema
    : TField extends ArrayDefinition<infer TItem>
      ? z.ZodArray<FieldSchema<TItem>>
      : TField extends ObjectDefinition<infer TObject>
        ? z.ZodType<DefinitionDocument<TObject>>
        : never;

function createFieldSchema(field: Definition[string]): z.ZodTypeAny {
  if (field.kind === 'primitive') {
    return field.type;
  }

  if (field.kind === 'array') {
    return z.array(createFieldSchema(field.type));
  }

  const shape = Object.fromEntries(
    Object.entries(field.type).map(([key, nestedField]) => [key, createFieldSchema(nestedField)]),
  );

  return z.object(shape);
}

export function extractCreateFieldWithSystem<TDefinition extends Definition>(params: {
  definition: TDefinition;
}) {
  const createFields = Object.fromEntries(
    Object.entries(params.definition)
      .filter(([, field]) => field.kind !== 'primitive' || !field.api.create.includes('Optional'))
      .map(([key, field]) => [key, createFieldSchema(field)]),
  );

  return createFields as {
    [K in CreateFieldKeys<TDefinition>]: FieldSchema<TDefinition[K]>;
  };
}

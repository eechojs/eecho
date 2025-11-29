import { ObjectId } from 'bson';
import { z } from 'zod';

import {
  ServerAPISpecification,
  extractCreateRequiredField,
  extractReadbleField,
  extractSearchArrayOption,
  extractSearchOption,
  extractSortableOption,
  extractUpdateOption,
  extractObjectIdFields, 
  Definition
 } from '@eecho/definition';

import { ObjectIdCompatible } from './mongo.util';

const convertToObjectId = (value: unknown): unknown => {
  if (value === undefined || value === null) {
    return value;
  }

  if (value instanceof ObjectId) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertToObjectId(item));
  }

  return new ObjectId(value as string);
};

const applyObjectIdTransforms = <TShape extends Record<string, z.ZodTypeAny>>(
  shape: TShape,
  objectIdFields: Set<string>,
) => {
  if (objectIdFields.size === 0) {
    return shape;
  }

  return Object.fromEntries(
    Object.entries(shape).map(([key, schema]) => {
      if (!objectIdFields.has(key)) {
        return [key, schema];
      }

      return [key, schema.transform((val) => convertToObjectId(val))];
    }),
  ) as TShape;
};

export function genAPISpec<TDefinition extends Definition, const TPrefix extends string>(params: {
  definition: TDefinition;
  endpointPrefix: TPrefix;
}) {
  const { definition, endpointPrefix } = params;

  const createRequiredField = extractCreateRequiredField({ definition });
  const readableField = extractReadbleField({ definition });
  const searchableOption = extractSearchOption({ definition })
  const searchableArrayOption = extractSearchArrayOption({ definition });
  const sortableOption = extractSortableOption({ definition });
  const updatableOption = extractUpdateOption({ definition });
  const objectIdFields = new Set(
    extractObjectIdFields({ definition }).map((key) => String(key)),
  );

  const createBodyShape = applyObjectIdTransforms(createRequiredField, objectIdFields);
  const updateBodyShape = applyObjectIdTransforms(updatableOption, objectIdFields);
  const searchableShape = applyObjectIdTransforms(searchableOption, objectIdFields);
  const searchableArrayShape = applyObjectIdTransforms(searchableArrayOption, objectIdFields);
  const sortableShape = applyObjectIdTransforms(sortableOption, objectIdFields);
  
  const CreateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/createItems`,
    Method: 'POST',
    Request: {
      body: z.object({ data: z.object(createBodyShape) }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.object({
          id: ObjectIdCompatible,
        }),
      }),
    },
  } as const satisfies ServerAPISpecification;

  const ReadAPISpecification = {
    APIEndpoint: `${endpointPrefix}/getItems`,
    Method: 'GET',
    Request: {
      queryParams: z.object({
        page: z.coerce.number().default(1).optional(),
        limit: z.coerce.number().default(15).optional(),
        filter: z.union([z.object(searchableShape).optional(), z.object(searchableArrayShape).optional()]),
        sort: z.object(sortableShape).optional(),
      }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.array(z.object(readableField)),
      }),
    },
  } as const satisfies ServerAPISpecification;

  const UpdateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/updateItem`,
    Method: 'POST',
    Request: {
      body: z.object({
            id: ObjectIdCompatible.transform((val): ObjectId => new ObjectId(val ?? 'Undefined ObjectId')),
            data: z.object(updateBodyShape),
          })
    },
    Response: {
      body: z.object({})
    },
  } as const satisfies ServerAPISpecification;

  const DeleteAPISpecification = {
    APIEndpoint: `${endpointPrefix}/deleteItems`,
    Method: 'POST',
    Request: {
      body: z.object({
        ids: z.array(z.object({})),
      }),
    },
    Response: {
      body: z.object({})
    },
  } as const satisfies ServerAPISpecification;

  const PutAPISpecification = {
    APIEndpoint: `${endpointPrefix}/putItem`,
    Method: 'PUT',
    Request: {
      body: z.object({ data: z.object(createBodyShape) }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.object({
          id: ObjectIdCompatible,
        }),
      }),
    },

  } as const satisfies ServerAPISpecification;

  return {
    CreateAPISpecification,
    ReadAPISpecification,
    UpdateAPISpecification,
    DeleteAPISpecification,
    PutAPISpecification
  };
}

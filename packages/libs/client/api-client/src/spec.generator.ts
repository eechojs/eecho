import { z } from 'zod';

import { ClientAPISpecification } from '@eecho/definition';

import {
  extractCreateRequiredField,
  extractReadbleField,
  extractSearchArrayOption,
  extractSearchOption,
  extractSortableOption,
  extractUpdateOption,
  Definition
} from '@eecho/definition';

export function genAPIDefinition<TDefinition extends Definition, const TPrefix extends string>(params: {
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
  
  const CreateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/createItems`,
    Method: 'POST',
    operationId: 'createItems',
    Request: {
      body: z.object({ data: z.object(createRequiredField) }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.object({}),
      }),
    },
  } as const satisfies ClientAPISpecification;

  const ReadAPISpecification = {
    APIEndpoint: `${endpointPrefix}/getItems`,
    Method: 'GET',
    operationId: 'getItems',
    Request: {
      queryParams: z.object({
        page: z.coerce.number().default(1).optional(),
        limit: z.coerce.number().default(15).optional(),
        filter: 
        z.union([
          z.object(searchableOption).optional(),
          z.object(searchableArrayOption).optional()
        ]),
        sort: z.object(sortableOption).optional(),
      }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.array(z.object(readableField)),
      })
    },
  } as const satisfies ClientAPISpecification;

  const UpdateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/updateItem`,
    Method: 'POST',
    operationId: 'updateItem',
    Request: {
      body: z.object({
        id: z.any(),
        data: z.object(updatableOption),
      })
    },
    Response: {
      body: z.object({
        success: z.literal(true),
      }),
    },
  } as const satisfies ClientAPISpecification;

  const DeleteAPISpecification = {
    APIEndpoint: `${endpointPrefix}/deleteItems`,
    Method: 'POST',
    operationId: 'deleteItems',
    Request: {
      body: z.object({
        ids: z.array(z.object({})),
      }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
      }),
    },
  } as const satisfies ClientAPISpecification;

  const PutAPISpecification = {
    ...CreateAPISpecification,
    APIEndpoint: `${endpointPrefix}/putItem`,
    Method: 'PUT',
    operationId: 'putItem'
  } as const satisfies ClientAPISpecification;

  return {
    CreateAPISpecification,
    ReadAPISpecification,
    UpdateAPISpecification,
    DeleteAPISpecification,
    PutAPISpecification
  };
}

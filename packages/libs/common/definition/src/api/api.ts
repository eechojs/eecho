import { z } from 'zod';

import type { ClientAPISpecification } from '../spec.js';
import type { Definition } from '../model/model.define.type.js';
import {
  extractCreateRequiredField,
  extractReadableField,
  extractSearchArrayOption,
  extractSearchOption,
  extractSortableOption,
  extractUpdateOption,
} from './definition.api.helper.js';

/**
 * Creates the transport contract shared by API clients and server adapters.
 * Database-specific coercion belongs in the repository adapter, not in this contract.
 */
export function genAPIDefinition<
  TDefinition extends Definition,
  const TPrefix extends string,
>(params: {
  definition: TDefinition;
  endpointPrefix: TPrefix;
}) {
  const { definition, endpointPrefix } = params;
  const createRequiredFields = extractCreateRequiredField({ definition });
  const readableFields = extractReadableField({ definition });
  const searchableFields = extractSearchOption({ definition });
  const searchableArrayFields = extractSearchArrayOption({ definition });
  const sortableFields = extractSortableOption({ definition });
  const updatableFields = extractUpdateOption({ definition });

  const CreateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/createItems`,
    Method: 'POST',
    operationId: 'createItems',
    Request: {
      body: z.object({ data: z.object(createRequiredFields) }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.object({ id: z.unknown() }),
      }),
    },
  } as const satisfies ClientAPISpecification;

  const ReadAPISpecification = {
    APIEndpoint: `${endpointPrefix}/getItems`,
    Method: 'GET',
    operationId: 'getItems',
    Request: {
      queryParams: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(15),
        filter: z.object({
          ...searchableFields,
          ...searchableArrayFields,
        }).optional(),
        sort: z.object(sortableFields).optional(),
      }),
    },
    Response: {
      body: z.object({
        success: z.literal(true),
        data: z.array(z.object(readableFields)),
      }),
    },
  } as const satisfies ClientAPISpecification;

  const UpdateAPISpecification = {
    APIEndpoint: `${endpointPrefix}/updateItem`,
    Method: 'POST',
    operationId: 'updateItem',
    Request: {
      body: z.object({
        id: z.unknown(),
        data: z.object(updatableFields),
      }),
    },
    Response: {
      body: z.object({ success: z.literal(true) }),
    },
  } as const satisfies ClientAPISpecification;

  const DeleteAPISpecification = {
    APIEndpoint: `${endpointPrefix}/deleteItems`,
    Method: 'POST',
    operationId: 'deleteItems',
    Request: {
      body: z.object({
        ids: z.array(z.unknown()).min(1),
      }),
    },
    Response: {
      body: z.object({ success: z.literal(true) }),
    },
  } as const satisfies ClientAPISpecification;

  const PutAPISpecification = {
    ...CreateAPISpecification,
    APIEndpoint: `${endpointPrefix}/putItem`,
    Method: 'PUT',
    operationId: 'putItem',
  } as const satisfies ClientAPISpecification;

  return {
    CreateAPISpecification,
    ReadAPISpecification,
    UpdateAPISpecification,
    DeleteAPISpecification,
    PutAPISpecification,
  };
}

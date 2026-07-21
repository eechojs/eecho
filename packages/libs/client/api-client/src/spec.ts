import { stringify } from 'qs';
import { z } from 'zod';

import type { ClientAPISpecification } from '@eecho/definition';

import { createHttpClient } from './client.js';

type InferInputIfSchema<T> = T extends z.ZodTypeAny ? z.input<T> : never;
type InferOutputIfSchema<T> = T extends z.ZodTypeAny ? z.output<T> : never;

export type APIMapOf<TSpec extends ClientAPISpecification> = {
  [K in TSpec['operationId']]: (input?: {
    queryParams?: InferInputIfSchema<TSpec['Request']['queryParams']>;
    body?: InferInputIfSchema<TSpec['Request']['body']>;
  }) => Promise<InferOutputIfSchema<TSpec['Response']['body']>>;
};

function createValidationError(label: string, error: z.ZodError) {
  const validationError = new Error(`${label}: ${error.message}`);
  Object.assign(validationError, { cause: error });
  return validationError;
}

function parseRequestPart<TSchema extends z.ZodTypeAny>(
  schema: TSchema | undefined,
  value: unknown,
  label: string,
) {
  if (!schema) {
    return undefined;
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    throw createValidationError(label, result.error);
  }

  return result.data as z.output<TSchema>;
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendFormValue(formData, key, item));
    return;
  }

  formData.append(key, value instanceof Blob ? value : String(value));
}

function serializeBody(value: unknown, contentType: 'application/json' | 'multipart/form-data') {
  if (value === undefined) {
    return {};
  }

  if (contentType === 'application/json') {
    return {
      body: JSON.stringify(value),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const formData = new FormData();
  if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([key, item]) => appendFormValue(formData, key, item));
  }

  return { body: formData };
}

export function createAPI<TSpec extends ClientAPISpecification>(options: {
  apiSpec: TSpec;
  httpClient: ReturnType<typeof createHttpClient>;
  contentType?: 'application/json' | 'multipart/form-data';
  responseType?: 'json' | 'blob';
}) {
  const {
    apiSpec,
    httpClient,
    contentType = 'application/json',
    responseType = 'json',
  } = options;
  const operation = `${apiSpec.operationId} ${apiSpec.Method} ${apiSpec.APIEndpoint}`;

  const handler = async (input?: {
    queryParams?: InferInputIfSchema<TSpec['Request']['queryParams']>;
    body?: InferInputIfSchema<TSpec['Request']['body']>;
  }) => {
    const queryParams = parseRequestPart(
      apiSpec.Request.queryParams,
      input?.queryParams ?? {},
      `Invalid query parameters for ${operation}`,
    );
    const bodyParams = parseRequestPart(
      apiSpec.Request.body,
      input?.body,
      `Invalid request body for ${operation}`,
    );
    const queryString = queryParams
      ? stringify(queryParams, { addQueryPrefix: true, arrayFormat: 'brackets' })
      : '';
    const requestBody = serializeBody(bodyParams, contentType);

    const response = await httpClient.fetch({
      url: `${apiSpec.APIEndpoint}${queryString}`,
      options: {
        method: apiSpec.Method,
        ...requestBody,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed for ${operation}: ${response.status} ${response.statusText}`);
    }

    const data: unknown = responseType === 'json'
      ? await response.json()
      : await response.blob();

    const parsedResult = apiSpec.Response.body.safeParse(data);
    if (!parsedResult.success) {
      throw createValidationError(`Invalid API response for ${operation}`, parsedResult.error);
    }

    return parsedResult.data;
  };

  return {
    [apiSpec.operationId]: handler,
  } as APIMapOf<TSpec>;
}

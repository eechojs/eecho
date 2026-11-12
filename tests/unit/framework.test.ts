import assert from 'node:assert/strict';
import test from 'node:test';

import type { Router } from 'express';
import { z } from 'zod';

import {
  defineModel,
  extractCreateFieldWithSystem,
  genAPIDefinition,
} from '../../packages/libs/common/definition/src/index.ts';
import {
  createAPI,
  createHttpClient,
} from '../../packages/libs/client/api-client/src/index.ts';
import type { FetchExceptionContext } from '../../packages/libs/client/api-client/src/index.ts';
import {
  MongoGenerator,
  setAPIEndpoint,
} from '../../packages/libs/server/express/src/index.ts';

const ProductDefinition = defineModel({
  _id: {
    type: z.string().regex(/^[0-9a-f]{24}$/),
    index: ['Identifier', 'ObjectId'],
    api: {
      create: ['System'],
      read: ['Searchable'],
    },
  },
  name: {
    type: z.string(),
    api: {
      read: ['Searchable', 'Sortable'],
      update: ['Updatable'],
    },
  },
  createdAt: {
    type: z.coerce.date(),
    api: {
      create: ['System'],
    },
  },
  secret: {
    type: z.string(),
    api: {
      create: ['Optional'],
      read: ['Hidden'],
    },
  },
});

test('one model definition produces the shared client and server contract', () => {
  const contract = genAPIDefinition({
    definition: ProductDefinition,
    endpointPrefix: '/products',
  });
  const compatibilityContract = MongoGenerator.genAPISpec({
    definition: ProductDefinition,
    endpointPrefix: '/products',
  });

  assert.equal(contract.ReadAPISpecification.APIEndpoint, '/products/getItems');
  assert.equal(contract.ReadAPISpecification.Method, 'GET');
  assert.equal(
    compatibilityContract.ReadAPISpecification.APIEndpoint,
    contract.ReadAPISpecification.APIEndpoint,
  );

  const query = contract.ReadAPISpecification.Request.queryParams.parse({});
  assert.deepEqual(query, { page: 1, limit: 15 });
  assert.throws(() => (
    contract.ReadAPISpecification.Request.queryParams.parse({ page: 0 })
  ), z.ZodError);

  const createBody = contract.CreateAPISpecification.Request.body.parse({
    data: { name: 'Notebook' },
  });
  assert.deepEqual(createBody, { data: { name: 'Notebook' } });

  const createBodyWithOptional = contract.CreateAPISpecification.Request.body.parse({
    data: { name: 'Notebook', secret: 'optional on create', createdAt: 'system-owned' },
  });
  assert.deepEqual(createBodyWithOptional, {
    data: { name: 'Notebook', secret: 'optional on create' },
  });
  assert.deepEqual(
    contract.PutAPISpecification.Request.body.parse({ data: { name: 'Notebook', secret: 's' } }),
    { data: { name: 'Notebook', secret: 's' } },
  );

  const repositorySchema = z.object(extractCreateFieldWithSystem({ definition: ProductDefinition }));
  const systemFields = { _id: '0123456789abcdef01234567', createdAt: new Date(0) };
  assert.equal(repositorySchema.parse({ ...systemFields, name: 'Notebook', secret: 's' }).secret, 's');
  assert.equal('secret' in repositorySchema.parse({ ...systemFields, name: 'Notebook' }), false);
  assert.throws(() => repositorySchema.parse({ name: 'Notebook' }), z.ZodError);

  const readResponse = contract.ReadAPISpecification.Response.body.parse({
    success: true,
    data: [{
      _id: '0123456789abcdef01234567',
      name: 'Notebook',
      createdAt: '2026-07-21T00:00:00.000Z',
      secret: 'must not cross the transport boundary',
    }],
  });
  assert.equal('secret' in readResponse.data[0], false);
  assert.ok(readResponse.data[0].createdAt instanceof Date);
});

test('the generated client applies defaults and validates the response', async () => {
  const contract = genAPIDefinition({
    definition: ProductDefinition,
    endpointPrefix: '/products',
  });
  const httpClient = createHttpClient();
  httpClient.setHost('https://example.test');

  const originalFetch = globalThis.fetch;
  let requestedUrl = '';

  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      success: true,
      data: [{
        _id: '0123456789abcdef01234567',
        name: 'Notebook',
        createdAt: '2026-07-21T00:00:00.000Z',
      }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const api = createAPI({
      apiSpec: contract.ReadAPISpecification,
      httpClient,
    });
    const response = await api.getItems();

    assert.equal(
      requestedUrl,
      'https://example.test/products/getItems?page=1&limit=15',
    );
    assert.equal(response.data[0].name, 'Notebook');
    assert.ok(response.data[0].createdAt instanceof Date);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function withFetch(
  stub: typeof globalThis.fetch,
  run: () => Promise<void>,
) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('exception handlers run in order and can recover a failed response', async () => {
  const httpClient = createHttpClient();
  httpClient.setHost('https://example.test/');
  httpClient.setHeader({ Authorization: 'token' });

  const observed: FetchExceptionContext[] = [];
  httpClient.addExceptionHandler(async (context) => {
    observed.push(context);
    return { isNext: true };
  });
  httpClient.addExceptionHandler(async () => ({
    result: new Response('recovered'),
    isNext: false,
  }));

  await withFetch(async () => new Response('unavailable', { status: 503 }), async () => {
    const response = await httpClient.fetch({ url: 'products' });

    assert.equal(await response.text(), 'recovered');
    assert.equal(observed.length, 1);
    assert.equal(observed[0].errorType, 'FetchException');
    assert.equal(observed[0].requestUrl, 'https://example.test/products');
    assert.equal(observed[0].response?.status, 503);
    assert.deepEqual(observed[0].options.headers, { Authorization: 'token' });
    assert.ok(observed[0].timestamp instanceof Date);
  });
});

test('an unhandled network failure rejects with its cause', async () => {
  const httpClient = createHttpClient();
  httpClient.setHost('https://example.test');
  const failure = new TypeError('network down');

  await withFetch(async () => { throw failure; }, async () => {
    await assert.rejects(
      httpClient.fetch({ url: '/products' }),
      (error: Error) => (
        error.name === 'FetchException'
        && error.cause === failure
        && error.message === 'Fetch failed for https://example.test/products'
      ),
    );
  });
});

test('setAPIEndpoint registers the contract route and parses its request', async () => {
  const contract = genAPIDefinition({
    definition: ProductDefinition,
    endpointPrefix: '/products',
  });
  const routes: { method: string; endpoint: string; middlewares: Function[] }[] = [];
  const router = Object.fromEntries(
    ['get', 'post', 'put', 'patch', 'delete'].map((method) => [
      method,
      (endpoint: string, ...middlewares: Function[]) => {
        routes.push({ method, endpoint, middlewares });
      },
    ]),
  ) as unknown as Router;
  const received: unknown[] = [];

  setAPIEndpoint({
    router,
    apiSpec: contract.UpdateAPISpecification,
    handler: ({ params }) => {
      received.push(params);
      return { success: true } as const;
    },
  });
  setAPIEndpoint({
    router,
    apiSpec: contract.ReadAPISpecification,
    handler: ({ params }) => {
      received.push(params);
      return { success: true as const, data: [] };
    },
  });

  assert.deepEqual(
    routes.map(({ method, endpoint }) => [method, endpoint]),
    [['post', '/products/updateItem'], ['get', '/products/getItems']],
  );

  const errors: unknown[] = [];
  const next = (error?: unknown) => { errors.push(error); };

  await routes[0].middlewares[0](
    { query: {}, body: { id: '1', data: { name: 'Pen', ignored: true } } },
    {},
    next,
  );
  await routes[1].middlewares[0]({ query: { page: '2' }, body: undefined }, {}, next);
  await routes[1].middlewares[0]({ query: { page: '0' }, body: undefined }, {}, next);

  assert.deepEqual(received, [
    { query: {}, body: { id: '1', data: { name: 'Pen' } } },
    { query: { page: 2, limit: 15 }, body: {} },
  ]);
  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof z.ZodError);
});

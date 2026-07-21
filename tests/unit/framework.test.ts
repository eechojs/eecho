import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import {
  defineModel,
  genAPIDefinition,
} from '../../packages/libs/common/definition/src/index.ts';
import {
  createAPI,
  createHttpClient,
} from '../../packages/libs/client/api-client/src/index.ts';
import { MongoGenerator } from '../../packages/libs/server/express/src/index.ts';

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

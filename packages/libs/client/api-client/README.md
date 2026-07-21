# @eecho/api-client

Validated HTTP execution for API contracts created by `@eecho/definition`.

## Installation

```bash
npm install @eecho/api-client @eecho/definition zod
```

## Usage

```ts
import { createAPI, createHttpClient, createRetryHandler } from '@eecho/api-client';
import { PetAPI } from './pet-api.js';

const httpClient = createHttpClient();
httpClient.setHost('https://api.example.com');
httpClient.addExceptionHandler(createRetryHandler({
  retryCount: 2,
  timeout: 250,
}));

const petAPI = createAPI({
  apiSpec: PetAPI.ReadAPISpecification,
  httpClient,
});

const response = await petAPI.getItems({
  queryParams: {
    filter: { species: 'Dog' },
    sort: { name: 'asc' },
  },
});
```

Requests are validated before they are sent. JSON responses are validated
before they are returned to application code. HTTP failures can be handled by
ordered exception handlers; retry behavior is opt-in.

`genAPIDefinition` is re-exported for compatibility. New code should import the
contract generator from `@eecho/definition`, which owns the shared contract.

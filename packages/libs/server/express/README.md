# @eecho/express

Express and MongoDB adapters for contracts created by `@eecho/definition`.

## Installation

```bash
npm install @eecho/express @eecho/definition express mongodb zod
```

## Generated Mongo read endpoint

```ts
import { Router } from 'express';
import { MongoGenerator, registerMongoReadEndpoint } from '@eecho/express';
import { PetAPI, PetDefinition } from './pet-api.js';

const repository = MongoGenerator.genRepository({
  definition: PetDefinition,
  collectionName: 'Pet',
  dbClient,
});

const router = Router();
registerMongoReadEndpoint({
  router,
  apiSpec: PetAPI.ReadAPISpecification,
  repository,
});
```

The generated read path supports positive-integer pagination, declared search
fields, declared sort fields, MongoDB ObjectIds, response serialization, and
response-schema validation.

## Custom endpoint

Use `setAPIEndpoint` when application policy is part of the operation:

```ts
setAPIEndpoint({
  router,
  apiSpec: PetAPI.UpdateAPISpecification,
  handler: async ({ res, params }) => {
    await updatePet(params.body);
    const response = { success: true } as const;
    res.json(response);
    return response;
  },
});
```

Mount `ExceptionMiddleware` after the routers. Zod request failures become a
structured HTTP 400 response; unexpected errors become HTTP 500 without leaking
internal details.

`MongoGenerator.genAPISpec` is a compatibility alias. The server should normally
import the contract instance already shared with the client.

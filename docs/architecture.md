# Architecture

## Product intent

EEcho reduces the drift between four representations that normally evolve
independently:

1. domain model types;
2. runtime request and response validation;
3. browser client calls;
4. Express and MongoDB implementation details.

A normalized model definition is the source. `genAPIDefinition` turns its field
capabilities into a transport contract. Both sides consume that same contract;
neither side recreates it.

## Ownership boundaries

### `@eecho/definition`

This package owns concepts that are independent of HTTP execution, Express, and
MongoDB:

- normalized model definitions;
- inferred document, filter, sort, and update types;
- field capability extraction;
- Zod request and response contracts.

It must not import a client, web framework, or database driver.

### `@eecho/api-client`

This package turns one contract operation into a callable function. It owns URL
resolution, query serialization, request and response validation, headers, and
retry hooks. It does not define model policy or regenerate contracts.

The `genAPIDefinition` export remains as a compatibility re-export. New code
should import it from `@eecho/definition`.

### `@eecho/express`

This package adapts shared contracts to Express and MongoDB. It owns request
parsing, route registration, HTTP error mapping, ObjectId conversion, query
construction, and repository operations.

`MongoGenerator.genAPISpec` remains a compatibility alias for the shared
generator. New server code should import the already-created contract from its
shared API package.

### `examples/pestore`

The example is an executable architecture test:

```text
api-lib/model.definition.ts
  -> api-lib/api.definition.ts
  -> api-lib browser client
  -> server route + Mongo repository
  -> Astro UI and Playwright tests
```

If a public usage pattern cannot be expressed cleanly here, the library API
should be reconsidered before adding another abstraction.

## Request flow

For a generated read operation:

1. The browser client validates and applies query defaults.
2. The query is serialized and sent through the configured HTTP client.
3. Express parses the same query schema from the shared contract.
4. The Mongo repository converts storage-specific values such as ObjectIds.
5. `registerMongoReadEndpoint` converts Mongo values back to transport values
   and validates the response schema.
6. The browser client validates the received response again.

The validation on both sides is intentional: the server protects its boundary,
and the client detects a server or deployment that no longer matches the
contract it was built against.

## Extension rules

- Add a field capability in `definition` before teaching adapters to interpret
  it.
- Keep database coercion in the database adapter; transport contracts must stay
  portable.
- Add one shared contract operation, then trace it through the client, Express,
  and Petstore example.
- Prefer small registration functions over framework classes and global state.
- Validate the narrow package first, then run `npm run verify` for public API
  changes.

## Legacy path

`packages/server/eecho` is an incomplete earlier server prototype. It is not an
active workspace and should not receive new features. Useful ideas should be
implemented in `packages/libs/server/express` after their behavior is defined by
the active contract flow.

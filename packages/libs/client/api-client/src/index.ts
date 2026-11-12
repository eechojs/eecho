export { createHttpClient } from './client.js';
export type { APIExceptionHandler, FetchExceptionContext, RequestHandler } from './client.js';
export { createRetryHandler } from './handlers.js';
export { createAPI } from './spec.js';
export type { APIMapOf } from './spec.js';
// Compatibility re-export: API contracts are owned by @eecho/definition.
export { genAPIDefinition } from '@eecho/definition';

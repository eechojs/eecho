import type { Definition } from './model/model.define.type.js';

export interface RepositoryContextEntry {
  model: Definition;
  collectionName: string;
  dbName: string;
}

export const Context: { RepositoryContext: RepositoryContextEntry[] } = {
  RepositoryContext: [],
};

export function registerRepositoryContext(entry: RepositoryContextEntry) {
  Context.RepositoryContext.push(entry);
}

export function findRepositoryContext(model: Definition) {
  return Context.RepositoryContext.find((entry) => entry.model === model);
}

export function registerModel(params: {
  definition: Definition;
  collectionName: string;
  dbName: string;
}) {
  const { definition, ...location } = params;
  registerRepositoryContext({ model: definition, ...location });
}

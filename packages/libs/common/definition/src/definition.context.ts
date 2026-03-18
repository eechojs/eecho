import { Definition } from "./model/model.define.type";

export interface RepositoryContextEntry {
  model: Definition;
  collectionName: string;
  dbName: string;
}

interface DefinitionContext {
  RepositoryContext: {
    model: Definition;
    collectionName: string;
    dbName: string;
  }[];
}

export const Context: DefinitionContext = {
  RepositoryContext: []
};

export function registerRepositoryContext(entry: RepositoryContextEntry) {
  Context.RepositoryContext.push(entry);
}

export function findRepositoryContext(model: Definition) {
  return Context.RepositoryContext.find((entry) => entry.model === model);
}

import { ModelDefinition } from "./model.definition";

interface Context {
  RepositoryContext: {
    model: ModelDefinition;
    collectionName: string;
    dbName: string;
  }[];
}

export const Context: Context = {
  RepositoryContext: []
};

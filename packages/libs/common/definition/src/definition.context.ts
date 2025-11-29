import { Definition } from "./model/model.define.type";

interface Context {
  RepositoryContext: {
    model: Definition;
    collectionName: string;
    dbName: string;
  }[];
}

export const Context: Context = {
  RepositoryContext: []
};

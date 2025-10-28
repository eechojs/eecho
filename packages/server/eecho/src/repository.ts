import { ObjectId } from "mongodb";
import type { ZodType } from "zod";

import { Definition, DefinitionDocument, IdentifierField, SearchField, UpdateField } from "@eecho/definition";

type ObjectIdField = Definition[string] & {
  type: ZodType<ObjectId>;
};

export interface DefaultRepository<T extends Definition> {
  createItems(params: {
    data: DefinitionDocument<T>[];
  }, option?: any): Promise<any>;
  readItems(params: {
    page?: number;
    limit?: number;
    search?: SearchField<T>;
  }, option?: any
  ): Promise<any>;
  updateItems(params: {
    id: IdentifierField<T>;
    data: UpdateField<T>;
  }[], option?: any): Promise<any>;
  deleteItems(params: {
    id: IdentifierField<T>;
  }[], option?: any): Promise<any>;
};

export interface MongoDefinition extends Definition {
  _id: ObjectIdField;
}
export interface DefaultMongoRepository<T extends MongoDefinition> extends DefaultRepository<T> {}

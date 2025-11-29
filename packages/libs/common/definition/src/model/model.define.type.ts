import { z } from 'zod';

const PrimitiveIndex = z.enum([
  "Identifier",
  "ForeignIdentifier",
  "ObjectId"
])
export type PrimitiveIndex = z.infer<typeof PrimitiveIndex>;

const APIIndex = z.object({
  index: z.enum([]).array(),
  create: z.enum(["Optional", "System"]).array(),
  read: z.enum(["Detail", "Hidden", "Searchable", "SystemSearchable", "Sortable", "SearchableArray"]).array(),
  update: z.enum(["Filter", "Updatable"]).array(),
  delete: z.enum([]).array(),
});
export type APIIndex = z.infer<typeof APIIndex>;

export interface PrimitiveDefinition<
  Ttype extends z.ZodTypeAny = z.ZodTypeAny,
  Tindex extends PrimitiveIndex[] = PrimitiveIndex[],
  Tapi extends APIIndex = APIIndex,
  Tkey extends string = string
> {
  type: Ttype;
  index: Tindex;
  api: Tapi;
  key: Tkey;
  kind: "primitive";
};

export interface ArrayDefinition< 
  Ttype extends Omit<PrimitiveDefinition, 'key'> | Omit<ObjectDefinition, 'key'> 
        = Omit<PrimitiveDefinition, 'key'> | Omit<ObjectDefinition, 'key'>,
  Tkey extends string = string
> {
  type: Ttype;
  key: Tkey;
  kind: "array";
}

export interface ObjectDefinition< 
  Ttype extends Definition = Definition,
  Tkey extends string = string
> {
  type: Ttype;
  key: Tkey;
  kind: "object";
}

export interface Definition {
  [field: string]: PrimitiveDefinition | ArrayDefinition | ObjectDefinition;
}

export interface InputPrimitiveDefinition<
  Ttype extends z.ZodTypeAny = z.ZodTypeAny,
  Tindex extends PrimitiveIndex[] = PrimitiveIndex[],
  Tapi extends APIIndex = APIIndex
> extends Omit<PrimitiveDefinition<Ttype, Tindex, Tapi>, 'key' | 'kind' | 'index' | 'api'> {
  index?: Tindex;
  api?: Partial<Tapi>;
}

export interface InputArrayDefinition<
  Titem extends InputPrimitiveDefinition | InputObjectDefinition 
    = InputPrimitiveDefinition | InputObjectDefinition
> {
  type: [Titem];
};

export interface InputObjectDefinition<
  Ttype extends InputDefinition = InputDefinition
> {
  type: Ttype;
}

export interface InputDefinition {
  [field: string]: InputPrimitiveDefinition | InputArrayDefinition | InputObjectDefinition;
};

// T[K]가 어떤 Input 타입인지에 따라 대응하는 Output 타입으로 변환
type TransformField<T, K extends string> = 
  T extends InputPrimitiveDefinition<infer Ttype, infer Tindex>
    ? PrimitiveDefinition<Ttype, Tindex, Required<APIIndex>, K>
    : T extends InputArrayDefinition<infer Titem>
      ? ArrayDefinition<
          Titem extends InputPrimitiveDefinition<infer Ttype, infer Tindex>
            ? Omit<PrimitiveDefinition<Ttype, Tindex, Required<APIIndex>, `${K}Item`>, 'key'>
            : Omit<PrimitiveDefinition, 'key'>,
          K
        >
      : T extends InputObjectDefinition<infer Ttype>
        ? ObjectDefinition<DefinitionFrom<Ttype>, K>
        : never;

// InputDefinition T를 Definition으로 변환
export type DefinitionFrom<T extends InputDefinition>  = {
  [K in keyof T & string]: TransformField<T[K], K>
};
import { z } from 'zod';
import { ArrayDefinition, ObjectDefinition, PrimitiveDefinition } from './model.define.type';

type PureType<T> = 
  T extends PrimitiveDefinition 
    ? z.infer<T['type']> 
  : T extends ArrayDefinition 
    ? PureType<T['type']>[]
  : T extends ObjectDefinition 
    ? PureType<T['type']> 
  : never;

export type DefinedModel<T> = {
  
}
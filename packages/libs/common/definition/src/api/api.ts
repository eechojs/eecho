import { z } from "zod";

import { Definition } from "../model/model.define.type";
import { ServerAPISpecification } from "../spec";



export function genAPIDefinition(params: {
  definition: Definition;
  endpointPrefix: string;
}){
  const CreateAPISpecification = {
    APIEndpoint: `${params.endpointPrefix}/create`,
    Method: 'POST',
    Request: {

    },
    Response: {
      body: z.object({})
    }
  } as const satisfies ServerAPISpecification;
  
  const ReadAPISpecification = {};
  const UpdateAPISpecification = {};
  const DeleteAPISpecification = {};

}
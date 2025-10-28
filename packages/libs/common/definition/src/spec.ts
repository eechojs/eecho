import { z } from "zod";

interface APISpecification {
  APIEndpoint: string;
  Method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  Request: {
    queryParams?: z.ZodTypeAny;
    body?: z.ZodTypeAny;
  };
  Response: {
    body: z.ZodTypeAny;
  };
}

export interface ClientAPISpecification extends APISpecification{
  operationId: string;
}

export interface ServerAPISpecification extends APISpecification {}

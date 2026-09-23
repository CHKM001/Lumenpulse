import { OpenAPIObject } from '@nestjs/swagger';
import {
  API_KEY_SECURITY_SCHEME,
  JWT_SECURITY_SCHEME,
  WEBHOOK_SIGNATURE_SECURITY_SCHEME,
} from './openapi.constants';
import { NO_RESPONSE_BODY_EXTENSION } from './api-no-body-response.decorator';

type OperationObject = OpenAPIObject['paths'][string]['get'] & object;
type SchemaObject = Record<string, unknown>;

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'] as const;

/**
 * Guard class name → security scheme the operation must declare.
 * Guards not listed here (rate limiting, IP allowlists, feature flags) don't
 * need client credentials.
 */
export const GUARD_SECURITY_SCHEMES: Record<string, string> = {
  JwtAuthGuard: JWT_SECURITY_SCHEME,
  RolesGuard: JWT_SECURITY_SCHEME,
  ContractAdminGuard: JWT_SECURITY_SCHEME,
  ContractAdminTrustedCallerGuard: API_KEY_SECURITY_SCHEME,
  WebhookVerificationGuard: WEBHOOK_SIGNATURE_SECURITY_SCHEME,
  SorobanEventIngestionGuard: WEBHOOK_SIGNATURE_SECURITY_SCHEME,
};

/** operationId → names of guard classes protecting that route. */
export type RouteGuardMap = Map<string, string[]>;

/**
 * Returns human-readable violations that make the spec an unreliable contract
 * for generated clients. An empty list means the document is complete.
 */
export function lintOpenApiDocument(
  document: OpenAPIObject,
  routeGuards: RouteGuardMap = new Map(),
): string[] {
  const violations: string[] = [];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      const where = `${method.toUpperCase()} ${path} [${operation.operationId}]`;
      violations.push(
        ...lintOperation(operation, routeGuards).map(
          (message) => `${where}: ${message}`,
        ),
      );
    }
  }

  for (const [name, schema] of Object.entries(
    document.components?.schemas ?? {},
  )) {
    if (isEmptySchema(schema as SchemaObject)) {
      violations.push(
        `schema ${name}: has no properties (add @ApiProperty or use a *.dto.ts file)`,
      );
    }
  }

  return violations;
}

function lintOperation(
  operation: OperationObject,
  routeGuards: RouteGuardMap,
): string[] {
  const problems: string[] = [];

  if (!operation.tags?.length) {
    problems.push('missing @ApiTags on the controller');
  }
  if (!operation.summary?.trim()) {
    problems.push('missing @ApiOperation({ summary })');
  }

  const successStatuses = Object.keys(operation.responses).filter((status) =>
    /^[23]\d\d$/.test(status),
  );
  if (successStatuses.length === 0) {
    problems.push('missing a documented 2xx/3xx response');
  }
  const bodyless = (operation as Record<string, unknown>)[
    NO_RESPONSE_BODY_EXTENSION
  ];
  for (const status of bodyless ? [] : successStatuses) {
    const response = operation.responses[status];
    if (!/^2/.test(status) || status === '204') continue;
    if (!response || '$ref' in response) continue;
    if (!response.content || Object.keys(response.content).length === 0) {
      problems.push(
        `${status} response has no body schema (add @ApiOkResponse/@ApiCreatedResponse with a type; @ApiNoBodyResponse if the handler returns nothing)`,
      );
    }
  }

  const body = operation.requestBody;
  if (body && !('$ref' in body)) {
    const schemas = Object.values(body.content ?? {}).map(
      (media) => media.schema as SchemaObject | undefined,
    );
    if (schemas.length === 0 || schemas.some((s) => !s || isEmptySchema(s))) {
      problems.push('request body has no schema (type the @Body() with a DTO)');
    }
  }

  const declared = new Set(
    (operation.security ?? []).flatMap((req) => Object.keys(req)),
  );
  const guards = operation.operationId
    ? (routeGuards.get(operation.operationId) ?? [])
    : [];
  for (const guard of guards) {
    const scheme = GUARD_SECURITY_SCHEMES[guard];
    if (scheme && !declared.has(scheme)) {
      problems.push(
        `guarded by ${guard} but does not declare the "${scheme}" security scheme`,
      );
    }
  }

  return problems;
}

function isEmptySchema(schema: SchemaObject): boolean {
  if (!schema || typeof schema !== 'object') return true;
  if (Object.keys(schema).length === 0) return true;
  if (schema.$ref || schema.enum || schema.allOf || schema.oneOf) return false;
  if (schema.anyOf || schema.items || schema.additionalProperties) return false;
  if (schema.type && schema.type !== 'object') return false;
  const properties = schema.properties as SchemaObject | undefined;
  return !properties || Object.keys(properties).length === 0;
}

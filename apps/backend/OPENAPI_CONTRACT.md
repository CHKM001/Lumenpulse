# OpenAPI Contract

The backend's HTTP contract is committed as a generated artifact:

```
apps/backend/openapi.json
```

This file is the single source of truth for client code generation (the webapp's
`npm run generate:api-types` reads it from `../backend/openapi.json`) and for
external integrators. Do not edit it by hand.

## Commands (run in `apps/backend`)

| Command | What it does |
| --- | --- |
| `npm run build` | `nest build`, then regenerates `openapi.json`. |
| `npm run openapi:generate` | Regenerates `openapi.json` from the last build in `dist/`. |
| `npm run openapi:check` | Exits non-zero if `openapi.json` differs from what the current `dist/` would produce. |

Generation doesn't need a database, Redis or Stellar RPC. The generator
(`scripts/generate-openapi.ts`) scans the module and controller graph without
instantiating providers, and uses fixed placeholder env values
(`scripts/openapi-env.ts`), so a local `.env` never changes the output.

It runs from `dist/` because DTO schemas come from the `@nestjs/swagger`
compiler plugin (configured in `nest-cli.json`), and that plugin only runs
inside `nest build`.

## CI

`.github/workflows/backend.yml` runs `npm run build` and then:

1. **Fails if `openapi.json` changed**, which means the committed spec is stale
   relative to the code. To fix it, run `npm run build` locally and commit
   `openapi.json`.
2. **Fails if the webapp's generated types are stale**
   (`apps/webapp/scripts/generate-api-types.mjs --check`). To fix it, run
   `npm run generate:api-types` in `apps/webapp` and commit `generated/`.

The build also fails if the spec is **incomplete**. `src/openapi/openapi.lint.ts`
rejects:

- operations without `@ApiTags` or an `@ApiOperation` summary
- 2xx responses (other than 204) without a body schema
- request bodies without a schema
- routes protected by `JwtAuthGuard`, `RolesGuard`, `ContractAdminGuard`,
  `ContractAdminTrustedCallerGuard`, `WebhookVerificationGuard` or
  `SorobanEventIngestionGuard` that do not declare the matching security scheme
- component schemas with no properties
- two DTO classes that publish the same schema name (rename one with
  `@ApiSchema({ name })`)

Each violation names the route and `Controller_method` to fix.

## What the generator adds automatically

`src/openapi/openapi.document.ts` adds the parts of the contract that come
from global infrastructure rather than individual controllers:

| Concern | Source in code | In the spec |
| --- | --- | --- |
| Error envelope | `GlobalExceptionFilter` | Every 4xx/5xx response uses `#/components/schemas/ErrorResponseDto` (`code`, `message`, `details?`, `requestId`). |
| Standard errors | validation pipe, guards, rate limiter | `400` if the operation takes input, `401`/`403` if it is secured, `404` for path parameters, and `429`/`500` everywhere. |
| Idempotency | `IdempotencyInterceptor` (global) | Optional `Idempotency-Key` header on every `POST`/`PUT`/`PATCH`/`DELETE`, plus `409` (still in progress) and `422` (key reused with a different body). |
| Correlation id | `RequestIdMiddleware` | `X-Request-Id` response header on every response. |

## Security schemes

| Scheme | Transport | Used by |
| --- | --- | --- |
| `JWT-auth` | `Authorization: Bearer <jwt>` | User and admin routes (`@ApiBearerAuth(JWT_SECURITY_SCHEME)`) |
| `api-key` | `X-API-Key: <key>` | Contract admin trusted callers (`@ApiSecurity(API_KEY_SECURITY_SCHEME)`) |
| `webhook-signature` | `X-Webhook-Signature` (+ timestamp/nonce headers per route) | Inbound webhooks and Soroban event ingestion |

Constants live in `src/openapi/openapi.constants.ts`. Import them instead of
using string literals.

## Adding or changing an endpoint

1. Use DTO classes in `*.dto.ts` files for bodies, queries and responses. The
   compiler plugin documents their properties; add `@ApiProperty` for
   descriptions and examples.
2. Add `@ApiTags`, `@ApiOperation({ summary })` and a typed success response
   (`@ApiOkResponse({ type: Dto })`).
3. If the route is guarded, declare the matching security decorator.
4. Run `npm run build` and commit the updated `openapi.json`. If schemas the
   webapp uses changed, also run `npm run generate:api-types` in `apps/webapp`.

The same document is served at runtime at `/api/docs` (Swagger UI) and
`/api/docs-json`.

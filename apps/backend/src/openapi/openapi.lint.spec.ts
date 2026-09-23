import { OpenAPIObject } from '@nestjs/swagger';
import { lintOpenApiDocument } from './openapi.lint';
import { JWT_SECURITY_SCHEME } from './openapi.constants';

type Operation = NonNullable<OpenAPIObject['paths'][string]['get']>;

const validOperation = (overrides: Partial<Operation> = {}): Operation => ({
  operationId: 'ItemsController_list',
  tags: ['items'],
  summary: 'List items',
  responses: {
    '200': {
      description: 'ok',
      content: { 'application/json': { schema: { type: 'array' } } },
    },
  },
  ...overrides,
});

const doc = (
  operation: Operation,
  schemas: Record<string, object> = {},
): OpenAPIObject => ({
  openapi: '3.0.0',
  info: { title: 'test', version: '1' },
  paths: { '/items': { get: operation } },
  components: { schemas },
});

describe('lintOpenApiDocument', () => {
  it('accepts a complete operation', () => {
    expect(lintOpenApiDocument(doc(validOperation()))).toEqual([]);
  });

  it('requires tags and a summary', () => {
    const violations = lintOpenApiDocument(
      doc(validOperation({ tags: [], summary: '' })),
    );

    expect(violations).toEqual([
      expect.stringContaining('missing @ApiTags'),
      expect.stringContaining('missing @ApiOperation'),
    ]);
  });

  it('requires a body schema on 2xx responses other than 204', () => {
    expect(
      lintOpenApiDocument(
        doc(validOperation({ responses: { '200': { description: 'ok' } } })),
      ),
    ).toEqual([expect.stringContaining('200 response has no body schema')]);

    expect(
      lintOpenApiDocument(
        doc(validOperation({ responses: { '204': { description: 'gone' } } })),
      ),
    ).toEqual([]);
  });

  it('accepts a bodiless 2xx marked with @ApiNoBodyResponse', () => {
    expect(
      lintOpenApiDocument(
        doc({
          ...validOperation({ responses: { '200': { description: 'ok' } } }),
          'x-no-response-body': true,
        } as Operation),
      ),
    ).toEqual([]);
  });

  it('flags guarded routes that do not declare the matching scheme', () => {
    const guards = new Map([['ItemsController_list', ['JwtAuthGuard']]]);

    expect(lintOpenApiDocument(doc(validOperation()), guards)).toEqual([
      expect.stringContaining(
        `guarded by JwtAuthGuard but does not declare the "${JWT_SECURITY_SCHEME}"`,
      ),
    ]);
    expect(
      lintOpenApiDocument(
        doc(validOperation({ security: [{ [JWT_SECURITY_SCHEME]: [] }] })),
        guards,
      ),
    ).toEqual([]);
  });

  it('ignores guards that need no client credentials', () => {
    const guards = new Map([['ItemsController_list', ['FeatureFlagGuard']]]);

    expect(lintOpenApiDocument(doc(validOperation()), guards)).toEqual([]);
  });

  it('flags untyped request bodies and empty component schemas', () => {
    const violations = lintOpenApiDocument(
      doc(
        validOperation({
          requestBody: {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        }),
        { EmptyDto: { type: 'object', properties: {} } },
      ),
    );

    expect(violations).toEqual([
      expect.stringContaining('request body has no schema'),
      'schema EmptyDto: has no properties (add @ApiProperty or use a *.dto.ts file)',
    ]);
  });
});

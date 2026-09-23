import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authorization Matrix Test
 *
 * This test validates that every controller route has an explicit authorization decision.
 * It ensures that new routes cannot be added without proper authorization guards.
 *
 * The test:
 * 1. Discovers all controllers in the application
 * 2. Extracts all routes and their decorators
 * 3. Validates each route has an authorization decision (public, authenticated, or role-based)
 * 4. Tests each role (USER, REVIEWER, ADMIN) against routes to verify expected behavior
 */

interface RouteInfo {
  path: string;
  method: string;
  hasJwtGuard: boolean;
  hasRolesGuard: boolean;
  hasContractAdminGuard: boolean;
  hasIpAllowlistGuard: boolean;
  hasPublicDecorator: boolean;
  requiredRoles: UserRole[];
  isPublic: boolean;
  authorizationDecision:
    | 'public'
    | 'authenticated'
    | 'role-based'
    | 'ip-allowlist'
    | 'none';
}

interface ControllerInfo {
  name: string;
  routes: RouteInfo[];
}

// Expected authorization matrix - this should be the source of truth
// Routes not in this list will fail the test
const EXPECTED_AUTHORIZATION_MATRIX: Record<
  string,
  {
    path: string;
    method: string;
    expectedAuth: 'public' | 'authenticated' | 'role-based' | 'ip-allowlist';
    expectedRoles?: UserRole[];
  }[]
> = {
  'admin-audit.controller': [
    {
      path: '/admin/audit/blockchain',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'audit.controller': [
    {
      path: '/admin/audit-logs',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'cache.controller': [
    {
      path: '/cache/warm',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/cache/warm/status',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'config.controller': [
    { path: '/config/stellar', method: 'GET', expectedAuth: 'public' },
  ],
  'contracts.controller': [
    { path: '/contracts/capabilities', method: 'GET', expectedAuth: 'public' },
    {
      path: '/contracts/capabilities/:contractId',
      method: 'GET',
      expectedAuth: 'public',
    },
  ],
  'contributor-registry.controller': [
    {
      path: '/contributor-registry/register',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/contributor-registry/register-with-sig',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/contributor-registry/wallet/:address',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/contributor-registry/github/:handle',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/contributor-registry/reputation/:address',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/contributor-registry/nonce/:address',
      method: 'GET',
      expectedAuth: 'public',
    },
  ],
  'crowdfund.controller': [
    { path: '/crowdfund/projects', method: 'GET', expectedAuth: 'public' },
    { path: '/crowdfund/projects/:id', method: 'GET', expectedAuth: 'public' },
    {
      path: '/crowdfund/projects',
      method: 'POST',
      expectedAuth: 'authenticated',
    },
    { path: '/crowdfund/contribute', method: 'POST', expectedAuth: 'public' },
    {
      path: '/crowdfund/admin/bootstrap-demo-data',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/crowdfund/projects/:id/contributors',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/crowdfund/projects/:id/balance',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/crowdfund/projects/:id/my-contributions',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
  ],
  'demo-bootstrap.controller': [
    { path: '/demo-bootstrap/status', method: 'GET', expectedAuth: 'public' },
    {
      path: '/demo-bootstrap/seed',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/demo-bootstrap/reset',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/demo-bootstrap/runs',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/demo-bootstrap/runs/:runId/teardown',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'export.controller': [
    { path: '/exports', method: 'POST', expectedAuth: 'authenticated' },
    {
      path: '/exports/admin/analytics',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    { path: '/exports', method: 'GET', expectedAuth: 'authenticated' },
    { path: '/exports/:id', method: 'GET', expectedAuth: 'authenticated' },
    {
      path: '/exports/:id/download',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
  ],
  'feature-flags.controller': [
    { path: '/feature-flags', method: 'GET', expectedAuth: 'public' },
    {
      path: '/feature-flags/check/:key',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/feature-flags/:key/history',
      method: 'GET',
      expectedAuth: 'public',
    },
    { path: '/feature-flags/:key', method: 'GET', expectedAuth: 'public' },
    {
      path: '/feature-flags',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/feature-flags/:key',
      method: 'DELETE',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'grants.controller': [
    { path: '/grants/rounds', method: 'GET', expectedAuth: 'public' },
    { path: '/grants/rounds/:id', method: 'GET', expectedAuth: 'public' },
    {
      path: '/grants/rounds/:id/summary',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/grants/rounds/:id/export',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/grants/rounds',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/grants/rounds/:id/finalize',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/grants/rounds/fund',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/grants/rounds/projects/approve',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN, UserRole.REVIEWER],
    },
    {
      path: '/grants/rounds/:roundId/projects/:projectId',
      method: 'DELETE',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    { path: '/grants/contributions', method: 'POST', expectedAuth: 'public' },
    {
      path: '/grants/rounds/distribute',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    { path: '/grants/leaderboard', method: 'GET', expectedAuth: 'public' },
  ],
  'health.controller': [
    { path: '/health', method: 'GET', expectedAuth: 'public' },
    { path: '/health/live', method: 'GET', expectedAuth: 'public' },
    { path: '/health/ready', method: 'GET', expectedAuth: 'public' },
    { path: '/health/contracts', method: 'GET', expectedAuth: 'public' },
    { path: '/health/latency', method: 'GET', expectedAuth: 'public' },
    { path: '/health/smoke', method: 'GET', expectedAuth: 'public' },
  ],
  'metrics.controller': [
    { path: '/metrics', method: 'GET', expectedAuth: 'ip-allowlist' },
    { path: '/metrics/json', method: 'GET', expectedAuth: 'ip-allowlist' },
    { path: '/metrics/health', method: 'GET', expectedAuth: 'public' },
  ],
  'moderation.controller': [
    {
      path: '/moderation/report',
      method: 'POST',
      expectedAuth: 'authenticated',
    },
    {
      path: '/moderation/my-reports',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
    {
      path: '/moderation/queue',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/moderation/queue/stats',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/moderation/queue/:id',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/moderation/queue/:id',
      method: 'PATCH',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/moderation/queue/:id/assign',
      method: 'PATCH',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'news.controller': [
    { path: '/news', method: 'GET', expectedAuth: 'public' },
    { path: '/news/search', method: 'GET', expectedAuth: 'public' },
    { path: '/news/categories', method: 'GET', expectedAuth: 'public' },
    { path: '/news/sentiment-summary', method: 'GET', expectedAuth: 'public' },
    { path: '/news/article', method: 'GET', expectedAuth: 'public' },
    { path: '/news/coin/:symbol', method: 'GET', expectedAuth: 'public' },
  ],
  'notification-preference.controller': [
    {
      path: '/notification-preferences',
      method: 'POST',
      expectedAuth: 'authenticated',
    },
    {
      path: '/notification-preferences',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
    {
      path: '/notification-preferences/:userId',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
    {
      path: '/notification-preferences/:id',
      method: 'PUT',
      expectedAuth: 'authenticated',
    },
    {
      path: '/notification-preferences/:id',
      method: 'DELETE',
      expectedAuth: 'authenticated',
    },
    {
      path: '/notification-preferences/:userId/channels/:eventCategory',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
  ],
  'price-alert.controller': [
    { path: '/price-alerts', method: 'GET', expectedAuth: 'authenticated' },
    { path: '/price-alerts/:id', method: 'GET', expectedAuth: 'authenticated' },
    { path: '/price-alerts', method: 'POST', expectedAuth: 'authenticated' },
    {
      path: '/price-alerts/:id',
      method: 'PATCH',
      expectedAuth: 'authenticated',
    },
    {
      path: '/price-alerts/:id',
      method: 'DELETE',
      expectedAuth: 'authenticated',
    },
  ],
  'projects.controller': [
    { path: '/projects', method: 'GET', expectedAuth: 'public' },
    { path: '/projects/:projectId', method: 'GET', expectedAuth: 'public' },
    {
      path: '/projects/:projectId/health',
      method: 'GET',
      expectedAuth: 'public',
    },
  ],
  'read-model-rebuild.controller': [
    {
      path: '/api/read-model/rebuild',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/api/read-model/jobs/:jobId',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/api/read-model/jobs',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/api/read-model/jobs/:jobId/cancel',
      method: 'DELETE',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/api/read-model/jobs/cleanup',
      method: 'DELETE',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/api/read-model/datasets',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'search.controller': [
    { path: '/search/projects', method: 'GET', expectedAuth: 'public' },
    { path: '/search/assets', method: 'GET', expectedAuth: 'public' },
    { path: '/search/ecosystem', method: 'GET', expectedAuth: 'public' },
    { path: '/search/entity-links', method: 'GET', expectedAuth: 'public' },
  ],
  'scheduler-health.controller': [
    { path: '/health/schedulers', method: 'GET', expectedAuth: 'public' },
  ],
  'matching-pool-admin.controller': [
    {
      path: '/admin/matching-pool/rounds',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/admin/matching-pool/rounds/:roundId/approve-project',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'telegram-bot.controller': [
    {
      path: '/telegram-bot/broadcast',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
  ],
  'treasury.controller': [
    {
      path: '/treasury/streams',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/treasury/streams/:beneficiary',
      method: 'GET',
      expectedAuth: 'public',
    },
    {
      path: '/treasury/streams/:beneficiary/history',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/treasury/beneficiary-history',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/treasury/streams/rotate',
      method: 'POST',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/treasury/streams/preview',
      method: 'GET',
      expectedAuth: 'public',
    },
  ],
  'users.controller': [
    {
      path: '/users',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    {
      path: '/users/:id',
      method: 'GET',
      expectedAuth: 'role-based',
      expectedRoles: [UserRole.ADMIN],
    },
    { path: '/users/me', method: 'GET', expectedAuth: 'authenticated' },
    { path: '/users/me', method: 'PATCH', expectedAuth: 'authenticated' },
    {
      path: '/users/me/accounts',
      method: 'POST',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/accounts',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/accounts/:id',
      method: 'GET',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/accounts/:id',
      method: 'DELETE',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/accounts/:id/label',
      method: 'PATCH',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/avatar',
      method: 'PATCH',
      expectedAuth: 'authenticated',
    },
    {
      path: '/users/me/accounts/:id/primary',
      method: 'POST',
      expectedAuth: 'authenticated',
    },
  ],
};

describe('Authorization Matrix Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [], // We'll dynamically discover controllers
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Route Authorization Validation', () => {
    it('should validate all routes have explicit authorization decisions', () => {
      const controllers = discoverControllers();
      const allRoutes: RouteInfo[] = [];

      for (const controller of controllers) {
        allRoutes.push(...controller.routes);
      }

      const routesWithoutAuth = allRoutes.filter(
        (route) => route.authorizationDecision === 'none',
      );

      if (routesWithoutAuth.length > 0) {
        const errorMessages = routesWithoutAuth.map(
          (route) => `  - ${route.method} ${route.path}`,
        );
        fail(
          `Found ${routesWithoutAuth.length} route(s) without explicit authorization:\n${errorMessages.join('\n')}\n\n` +
            'Every route must have an explicit authorization decision. ' +
            'Add guards (@UseGuards) or mark as public (@Public()).',
        );
      }

      expect(routesWithoutAuth.length).toBe(0);
    });

    it('should validate routes match expected authorization matrix', () => {
      const controllers = discoverControllers();
      const mismatches: string[] = [];

      for (const controller of controllers) {
        const expectedRoutes =
          EXPECTED_AUTHORIZATION_MATRIX[controller.name] || [];

        for (const route of controller.routes) {
          const expected = expectedRoutes.find(
            (e) => e.path === route.path && e.method === route.method,
          );

          if (!expected) {
            mismatches.push(
              `${controller.name}: ${route.method} ${route.path} - Route not in expected matrix. ` +
                'Add this route to EXPECTED_AUTHORIZATION_MATRIX in the test file.',
            );
            continue;
          }

          // Validate authorization type matches
          if (route.authorizationDecision !== expected.expectedAuth) {
            mismatches.push(
              `${controller.name}: ${route.method} ${route.path} - ` +
                `Expected auth type '${expected.expectedAuth}', got '${route.authorizationDecision}'`,
            );
          }

          // Validate roles match for role-based auth
          if (
            expected.expectedAuth === 'role-based' &&
            expected.expectedRoles
          ) {
            const routeRoles = route.requiredRoles.sort();
            const expectedRoles = expected.expectedRoles.sort();

            if (JSON.stringify(routeRoles) !== JSON.stringify(expectedRoles)) {
              mismatches.push(
                `${controller.name}: ${route.method} ${route.path} - ` +
                  `Expected roles [${expectedRoles.join(', ')}], got [${routeRoles.join(', ')}]`,
              );
            }
          }
        }

        // Check for missing routes (routes in expected but not found)
        for (const expected of expectedRoutes) {
          const found = controller.routes.find(
            (r) => r.path === expected.path && r.method === expected.method,
          );
          if (!found) {
            mismatches.push(
              `${controller.name}: Expected route ${expected.method} ${expected.path} not found in controller`,
            );
          }
        }
      }

      if (mismatches.length > 0) {
        fail(
          `Authorization matrix validation failed:\n${mismatches.join('\n')}\n\n` +
            'Update EXPECTED_AUTHORIZATION_MATRIX in the test file to match current implementation.',
        );
      }
    });

    it('should flag security concerns for routes without proper authorization', () => {
      const securityConcerns: string[] = [];
      const controllers = discoverControllers();

      for (const controller of controllers) {
        for (const route of controller.routes) {
          // Flag mutation endpoints (POST, PUT, PATCH, DELETE) that are public
          if (
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method) &&
            route.authorizationDecision === 'public'
          ) {
            securityConcerns.push(
              `${controller.name}: ${route.method} ${route.path} - ` +
                'Mutation endpoint is public (no authentication required)',
            );
          }

          // Flag admin endpoints without proper guards
          if (
            route.path.includes('/admin') &&
            !route.hasJwtGuard &&
            !route.hasRolesGuard
          ) {
            securityConcerns.push(
              `${controller.name}: ${route.method} ${route.path} - ` +
                'Admin endpoint lacks authentication/authorization guards',
            );
          }
        }
      }

      // Known security concerns (documented in AUTHORIZATION_MATRIX.md)
      const knownConcerns = [
        'feature-flags.controller: POST /feature-flags',
        'feature-flags.controller: DELETE /feature-flags/:key',
        'telegram-bot.controller: POST /telegram-bot/broadcast',
      ];

      const newConcerns = securityConcerns.filter(
        (concern) => !knownConcerns.some((known) => concern.includes(known)),
      );

      if (newConcerns.length > 0) {
        console.warn('\n⚠️  New Security Concerns Detected:');
        newConcerns.forEach((concern) => console.warn(`  - ${concern}`));
        console.warn(
          '\nThese should be reviewed and fixed or documented in AUTHORIZATION_MATRIX.md\n',
        );
      }
    });
  });

  describe('Role Access Validation', () => {
    it('should validate USER role access', () => {
      const controllers = discoverControllers();
      const violations: string[] = [];

      for (const controller of controllers) {
        for (const route of controller.routes) {
          const canAccess = canRoleAccessRoute(UserRole.USER, route);
          const expected = EXPECTED_AUTHORIZATION_MATRIX[controller.name]?.find(
            (e) => e.path === route.path && e.method === route.method,
          );

          if (expected) {
            const expectedCanAccess =
              expected.expectedAuth === 'authenticated' ||
              (expected.expectedAuth === 'role-based' &&
                expected.expectedRoles?.includes(UserRole.USER));

            if (canAccess !== expectedCanAccess) {
              violations.push(
                `${controller.name}: ${route.method} ${route.path} - ` +
                  `USER role access mismatch (expected: ${expectedCanAccess}, actual: ${canAccess})`,
              );
            }
          }
        }
      }

      if (violations.length > 0) {
        fail(`USER role access validation failed:\n${violations.join('\n')}`);
      }
    });

    it('should validate REVIEWER role access', () => {
      const controllers = discoverControllers();
      const violations: string[] = [];

      for (const controller of controllers) {
        for (const route of controller.routes) {
          const canAccess = canRoleAccessRoute(UserRole.REVIEWER, route);
          const expected = EXPECTED_AUTHORIZATION_MATRIX[controller.name]?.find(
            (e) => e.path === route.path && e.method === route.method,
          );

          if (expected) {
            const expectedCanAccess =
              expected.expectedAuth === 'authenticated' ||
              (expected.expectedAuth === 'role-based' &&
                expected.expectedRoles?.includes(UserRole.REVIEWER));

            if (canAccess !== expectedCanAccess) {
              violations.push(
                `${controller.name}: ${route.method} ${route.path} - ` +
                  `REVIEWER role access mismatch (expected: ${expectedCanAccess}, actual: ${canAccess})`,
              );
            }
          }
        }
      }

      if (violations.length > 0) {
        fail(
          `REVIEWER role access validation failed:\n${violations.join('\n')}`,
        );
      }
    });

    it('should validate ADMIN role access', () => {
      const controllers = discoverControllers();
      const violations: string[] = [];

      for (const controller of controllers) {
        for (const route of controller.routes) {
          const canAccess = canRoleAccessRoute(UserRole.ADMIN, route);
          const expected = EXPECTED_AUTHORIZATION_MATRIX[controller.name]?.find(
            (e) => e.path === route.path && e.method === route.method,
          );

          if (expected) {
            const expectedCanAccess =
              expected.expectedAuth !== 'public' &&
              (expected.expectedAuth !== 'role-based' ||
                expected.expectedRoles?.includes(UserRole.ADMIN));

            if (canAccess !== expectedCanAccess) {
              violations.push(
                `${controller.name}: ${route.method} ${route.path} - ` +
                  `ADMIN role access mismatch (expected: ${expectedCanAccess}, actual: ${canAccess})`,
              );
            }
          }
        }
      }

      if (violations.length > 0) {
        fail(`ADMIN role access validation failed:\n${violations.join('\n')}`);
      }
    });
  });

  describe('Guard Combination Validation', () => {
    it('should validate ContractAdminGuard is always used with RolesGuard', () => {
      const controllers = discoverControllers();
      const violations: string[] = [];

      for (const controller of controllers) {
        for (const route of controller.routes) {
          if (route.hasContractAdminGuard && !route.hasRolesGuard) {
            violations.push(
              `${controller.name}: ${route.method} ${route.path} - ` +
                'ContractAdminGuard used without RolesGuard',
            );
          }
        }
      }

      if (violations.length > 0) {
        fail(
          `Guard combination validation failed:\n${violations.join('\n')}\n\n` +
            'ContractAdminGuard should always be used with RolesGuard and @Roles(UserRole.ADMIN)',
        );
      }
    });
  });
});

/**
 * Discover all controllers in the application
 */
function discoverControllers(): ControllerInfo[] {
  const controllersPath = path.join(__dirname, '..');
  const controllers: ControllerInfo[] = [];

  // Recursively find all controller files
  const controllerFiles = findControllerFiles(controllersPath);

  for (const filePath of controllerFiles) {
    const controllerInfo = analyzeControllerFile(filePath);
    if (controllerInfo) {
      controllers.push(controllerInfo);
    }
  }

  return controllers;
}

/**
 * Find all controller files recursively
 */
function findControllerFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      entry.name !== 'node_modules'
    ) {
      files.push(...findControllerFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Analyze a controller file to extract route information
 */
function analyzeControllerFile(filePath: string): ControllerInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.controller.ts');

    // Extract controller class name
    const controllerMatch = content.match(/export class (\w+Controller)/);
    if (!controllerMatch) return null;

    const routes: RouteInfo[] = [];

    // Extract routes by looking for method decorators
    const methodDecorators = ['@Get', '@Post', '@Put', '@Patch', '@Delete'];

    for (const decorator of methodDecorators) {
      const regex = new RegExp(
        `${decorator}\\(['"]([^'"]+)['"]\\)[\\s\\S]*?\\n[\\s\\S]*?(?:@UseGuards|@Roles|@Public|async |function )`,
        'g',
      );

      let match;
      while ((match = regex.exec(content)) !== null) {
        const path = match[1];
        const method = decorator.substring(1).toUpperCase();

        // Extract the surrounding context to check for guards
        const routeStart = match.index;
        const routeEnd = content.indexOf(')', routeStart) + 1;
        const routeContext = content.substring(routeStart, routeEnd + 500);

        const routeInfo: RouteInfo = {
          path,
          method,
          hasJwtGuard: routeContext.includes('JwtAuthGuard'),
          hasRolesGuard: routeContext.includes('RolesGuard'),
          hasContractAdminGuard: routeContext.includes('ContractAdminGuard'),
          hasIpAllowlistGuard: routeContext.includes('IpAllowlistGuard'),
          hasPublicDecorator: routeContext.includes('@Public()'),
          requiredRoles: extractRoles(routeContext),
          isPublic: routeContext.includes('@Public()'),
          authorizationDecision: determineAuthorizationDecision(routeContext),
        };

        routes.push(routeInfo);
      }
    }

    return { name: fileName, routes };
  } catch (error) {
    console.warn(`Failed to analyze controller file: ${filePath}`, error);
    return null;
  }
}

/**
 * Extract required roles from route context
 */
function extractRoles(context: string): UserRole[] {
  const roles: UserRole[] = [];

  // Look for @Roles decorator
  const rolesMatch = context.match(/@Roles\(([^)]+)\)/);
  if (rolesMatch) {
    const rolesContent = rolesMatch[1];

    if (rolesContent.includes('UserRole.ADMIN')) {
      roles.push(UserRole.ADMIN);
    }
    if (rolesContent.includes('UserRole.REVIEWER')) {
      roles.push(UserRole.REVIEWER);
    }
    if (rolesContent.includes('UserRole.USER')) {
      roles.push(UserRole.USER);
    }
  }

  return roles;
}

/**
 * Determine authorization decision based on guards and decorators
 */
function determineAuthorizationDecision(
  context: string,
): 'public' | 'authenticated' | 'role-based' | 'ip-allowlist' | 'none' {
  if (context.includes('@Public()')) {
    return 'public';
  }

  if (context.includes('IpAllowlistGuard')) {
    return 'ip-allowlist';
  }

  if (context.includes('RolesGuard')) {
    return 'role-based';
  }

  if (context.includes('JwtAuthGuard')) {
    return 'authenticated';
  }

  return 'none';
}

/**
 * Determine if a role can access a route
 */
function canRoleAccessRoute(role: UserRole, route: RouteInfo): boolean {
  switch (route.authorizationDecision) {
    case 'public':
    case 'ip-allowlist':
      return true;
    case 'authenticated':
      return true; // All authenticated users can access
    case 'role-based':
      return route.requiredRoles.includes(role);
    case 'none':
      return false; // No authorization decision made
    default:
      return false;
  }
}

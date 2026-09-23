import { Type } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { NestContainer } from '@nestjs/core/injector/container';
import { RouteGuardMap } from './openapi.lint';

const guardName = (guard: unknown): string | undefined =>
  typeof guard === 'function'
    ? guard.name
    : (guard as { constructor?: { name?: string } })?.constructor?.name;

const guardsOf = (target: object): unknown[] =>
  (Reflect.getMetadata(GUARDS_METADATA, target) as unknown[] | undefined) ?? [];

/**
 * Maps every route's operationId (`Controller_method`, matching
 * `createOpenApiDocument`) to the guard classes applied to it, so the spec
 * lint can check that guarded routes declare a security scheme.
 */
export function collectRouteGuards(container: NestContainer): RouteGuardMap {
  const routes: RouteGuardMap = new Map();

  for (const moduleRef of container.getModules().values()) {
    for (const wrapper of moduleRef.controllers.values()) {
      const controller = wrapper.metatype as Type<unknown> | null;
      if (!controller) continue;

      const classGuards = guardsOf(controller);

      for (const methodName of Object.getOwnPropertyNames(
        controller.prototype,
      )) {
        const handler = (controller.prototype as Record<string, unknown>)[
          methodName
        ];
        if (typeof handler !== 'function') continue;
        if (Reflect.getMetadata(METHOD_METADATA, handler) === undefined) {
          continue;
        }

        const methodGuards = guardsOf(handler);
        routes.set(
          `${controller.name}_${methodName}`,
          [...classGuards, ...methodGuards]
            .map(guardName)
            .filter((name): name is string => Boolean(name)),
        );
      }
    }
  }

  return routes;
}

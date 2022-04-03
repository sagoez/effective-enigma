import { APIRequest } from "@core/cloudfare/ApiRequest"
import { Tagged } from "@effect-ts/core/Case"
import * as T from "@effect-ts/core/Effect"
import { Effect } from "@effect-ts/core/Effect"
import { UnionToIntersection } from "@effect-ts/core/Utils"

// Primitives
// Initial or Declarative encoding

export type RouterMethods =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
export namespace Router {
  export class Merge<R> extends Tagged("Merge")<{
    readonly routes: readonly Router<R>[]
  }> {}

  export class Route<R> extends Tagged("Route")<{
    readonly path: string | RegExp
    readonly handler: Effect<R, never, Response>
    readonly method: RouterMethods
  }> {}

  export class Empty extends Tagged("Empty")<{}> {}

  export class Middleware<R> extends Tagged("Middleware")<{
    readonly child: Router<any>
    readonly middleware: (route: Route<any>["handler"]) => Route<R>["handler"]
  }> {}
}

// (Syntax) ADT's
export type Router<Context> =
  | Router.Merge<Context>
  | Router.Route<Context>
  | Router.Middleware<Context>
  | Router.Empty

// Combinator
export type MergeEnv<RoutesArray extends Array<Router<any>>> =
  UnionToIntersection<
    {
      readonly [K in keyof RoutesArray]: RoutesArray[K] extends Router<infer R>
        ? unknown extends R
          ? never
          : R
        : never
    }[number]
  >

// Inputs are contravariant which compose with &
// Outputs are covariant which compose with |
// For input types if you consider & as a multiplicative operator then unknown is 1 and never is 0
// For the output type if you consider | as a multiplicative operator then never is 1 and unknown is 0
export const empty: Router<unknown> = Router.Empty.make()

export const route =
  ({
    path,
    version,
    method,
  }: {
    path: string | RegExp
    version: string
    method: RouterMethods
  }) =>
  <R>(handler: Effect<R, never, Response>): Router<R> =>
    new Router.Route({ path: `/${version}/${path}`, handler, method })

export const merge = <RoutesArray extends Array<Router<any>>>(
  ...routes: RoutesArray
): Router<MergeEnv<RoutesArray>> => new Router.Merge({ routes })

export const middleware = <R, R1>(
  child: Router<R>,
  middleware: (
    route: Router.Route<R>["handler"],
  ) => Router.Route<R1>["handler"],
): Router<R1> => new Router.Middleware({ child, middleware })

export class RouteNotFound extends Tagged("RouteNotFound")<{}> {}

export class ForbiddenRoute extends Tagged("ForbiddenRoute")<{}> {}

// Interpreter
const collectRoutes = <R>(router: Router<R>): Array<Router.Route<R>> => {
  switch (router._tag) {
    case "Middleware":
      const routes = collectRoutes(router.child)
      return routes.map((route) =>
        route.copy({ handler: router.middleware(route.handler) }),
      )
    case "Merge":
      return router.routes.flatMap(collectRoutes)
    case "Route":
      return [router]
    case "Empty":
      return []
  }
}

export const routerRequestHandler = <R>(router: Router<R>) => {
  const routes = collectRoutes(router)

  return T.accessServiceM(APIRequest)(({ request }) => {
    const { pathname } = new URL(request.url)
    const { method } = request
    const route = routes
      .filter(({ method }) => method === request.method)
      .find(({ path }) => {
        if (typeof path === "string") {
          if (path.includes("/:") && !path.startsWith("/:")) {
            const regexp = new RegExp(`^${path.replace(/\/\:(.*)/, "(.*)")}$`)
            return regexp.test(pathname)
          }
          return pathname === path
        } else {
          return path.test(pathname)
        }
      })

    if (!route || method !== route?.method) {
      return T.fail(new RouteNotFound())
    }

    return route.handler
  })
}

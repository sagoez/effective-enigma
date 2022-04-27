import { getAssetFromKV as unsafeGetAssetFromKV } from "@cloudflare/kv-asset-handler"
import { Tagged } from "@effect-ts/core/Case" // To be used with classes
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as App from "./routes"
import { APIRequest, currentRequest } from "@core/cloudfare/ApiRequest"
import { Worker } from "@core/cloudfare/Worker"

// @ts-ignore
import manifestJSON from "__STATIC_CONTENT_MANIFEST"

class AssetNotFoundError extends Tagged("AssetNotFoundError")<{
  readonly message: string
}> {}

const manifest = JSON.parse(manifestJSON)

const redirectTo404 = pipe(
  T.do,
  T.bind("request", () => currentRequest),
  T.chain(({ request }) =>
    T.succeed(
      Response.redirect(`${new URL(request.url).origin}/404.html`, 301),
    ),
  ),
)

const getAssetFromKV = T.gen(function* (_) {
  const { ctx, env } = yield* _(WorkerContext)
  const { request } = yield* _(APIRequest)

  const response = yield* _(
    T.tryCatchPromise(
      () =>
        unsafeGetAssetFromKV(
          {
            request,
            waitUntil: (promise) => ctx.waitUntil(promise),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: manifest,
          },
        ),
      () =>
        AssetNotFoundError.make({
          message: `Asset not found ${request.headers}`,
        }),
    ),
  )
  //throw new Error('ouch')
  return response
})

export const program = pipe(
  App.program,
  T.catchTag("RouteNotFound", () => getAssetFromKV),
  T.catchTag("AssetNotFoundError", () => redirectTo404),
  T.provideSomeLayer(App.AppContextLive),
)

import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as App from "./routes"

const redirectTo404 = T.succeedWith(
  () =>
    new Response("404 Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
      },
    }),
)

export const program = pipe(
  App.program,
  T.catchTag("RouteNotFound", () => redirectTo404),
  T.provideSomeLayer(App.AppContextLive),
)

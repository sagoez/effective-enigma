import { string } from "@core/codec"
import * as R from "@core/router"
import { pretty } from "@effect-ts/system/Cause"
import { logMiddleware } from "@utils/middleware"
import { createErrorResponse } from "@utils/request"
import { createUserRoute, getUserRoute, loginUserRoute } from "../routes"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"

// Routes
const storageRoutes = logMiddleware(
  R.merge(createUserRoute, getUserRoute, loginUserRoute),
)

// Storage Program
export const storageProgram = pipe(
  R.routerRequestHandler(storageRoutes),
  T.sandbox,
  T.catchAll((cause) =>
    pipe(
      T.succeedWith(() => console.error(pretty(cause))),
      T.map(() =>
        createErrorResponse(string)({
          value: "Internal server error",
        }),
      ),
    ),
  ),
)

import { currentRequest } from "@core/cloudfare/ApiRequest"
import { currentEnv } from "@core/cloudfare/WorkerContext"
import { string } from "@core/codec"
import { middleware, Router } from "@core/router"
import * as T from "@effect-ts/core/Effect"
import { Logger } from "@streaming/services/Logger"
import JWT from "@tsndr/cloudflare-worker-jwt"
import { createErrorResponse } from "@utils/request"

//TODO: Abstract common logic in authMiddleware and adminMiddleware to a  common function

export const authMiddleware = <R>(child: Router<R>) =>
  middleware(child, (handler) =>
    T.gen(function* (_) {
      const request = yield* _(currentRequest)
      const { JWT_SECRET } = yield* _(currentEnv)

      const maybeToken = request.headers.get("authorization")

      if (!maybeToken) {
        return createErrorResponse(string)({
          status: 401,
          value: "You are not authorized",
        })
      }

      const maybeDecodedToken = maybeToken.split("Bearer")[1]

      if (!maybeDecodedToken) {
        return createErrorResponse(string)({
          status: 400,
          value: "Error decoding token",
        })
      }

      const decoded = yield* _(T.succeed(JWT.decode(maybeDecodedToken.trim())))

      if (!decoded) {
        return createErrorResponse(string)({
          status: 401,
          value: "Error decoding token",
        })
      }

      const token = yield* _(
        T.promise(() => JWT.verify(maybeDecodedToken.trim(), JWT_SECRET)),
      )

      if (!token) {
        return createErrorResponse(string)({
          status: 401,
          value: "You are not authorized",
        })
      }

      const response = yield* _(handler)
      return response
    }),
  )

export const adminMiddleware = <R>(child: Router<R>) =>
  middleware(child, (handler) =>
    T.gen(function* (_) {
      const request = yield* _(currentRequest)
      const { JWT_SECRET } = yield* _(currentEnv)

      const maybeToken = request.headers.get("authorization")

      if (!maybeToken) {
        return createErrorResponse(string)({
          status: 401,
          value: "You are not authorized",
        })
      }

      const maybeDecodedToken = maybeToken.split("Bearer")[1]

      if (!maybeDecodedToken) {
        return createErrorResponse(string)({
          status: 400,
          value: "Error decoding token",
        })
      }

      const decoded = yield* _(T.succeed(JWT.decode(maybeDecodedToken.trim())))

      if (!decoded || !(decoded as { [k: string]: unknown }).isAdmin) {
        return createErrorResponse(string)({
          status: 401,
          value: "You are not authorized",
        })
      }

      const token = yield* _(
        T.promise(() => JWT.verify(maybeDecodedToken.trim(), JWT_SECRET)),
      )

      if (!token) {
        return createErrorResponse(string)({
          status: 401,
          value: "You are not authorized",
        })
      }

      const response = yield* _(handler)
      return response
    }),
  )

export const logMiddleware = <R>(child: Router<R>) =>
  middleware(child, (handler) =>
    T.gen(function* (_) {
      const request = yield* _(currentRequest)
      const { log } = yield* _(Logger)

      yield* _(log(`Request: ${request.method} ${request.url}`))
      return yield* _(handler)
    }),
  )

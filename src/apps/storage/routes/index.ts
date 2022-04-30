import { currentRequest } from "@core/cloudfare/ApiRequest"
import { currentClient } from "@core/cloudfare/Storage"
import { currentEnv } from "@core/cloudfare/Worker"
import { DecodeError, string } from "@core/codec"
import * as R from "@core/router"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { AuthUser, JWTToken } from "@streaming/algebras/Auth"
import { CommonUser, CreateUser, User } from "@streaming/algebras/User"
import JWT from "@tsndr/cloudflare-worker-jwt"
import {
  createDataResponse,
  createErrorResponse,
  discriminator,
  hashPassword,
} from "@utils/request"

export const loginUserRoute = R.route({
  v: "v1",
  method: "POST",
  path: "login.user",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const client = yield* _(currentClient)

    const env = yield* _(currentEnv)

    const authUser = yield* _(
      pipe(
        discriminator(AuthUser)(request.clone()),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (authUser instanceof DecodeError) {
      return yield* _(
        T.succeed(
          createErrorResponse(string)({
            status: 400,
            value: authUser.message,
          }),
        ),
      )
    }

    const payload = yield* _(
      T.promise(() =>
        Promise.resolve(
          client.from<User>("users").select("*").eq("email", authUser.email),
        ),
      ),
    )

    if (payload.error) {
      return createErrorResponse(string)({
        value: `${payload.error.message} ${payload.error.details}`,
        status: payload.status,
      })
    }
    const [user] = payload.data

    if (!user) {
      return createErrorResponse(string)({
        value: "User not found",
        status: 404,
      })
    }

    const hashed = yield* _(hashPassword(authUser.password))
    if (user.password && hashed !== user.password) {
      return yield* _(
        T.succeed(
          createErrorResponse(string)({
            status: 401,
            value: "You are not authorized",
          }),
        ),
      )
    }

    const token = yield* _(
      T.promise(() =>
        JWT.sign(
          {
            email: user.email,
            isAdmin: user.isAdmin,
            exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // Expires: Now + 2h
          },
          env.JWT_SECRET,
        ),
      ),
    )

    return yield* _(
      T.succeed(
        createDataResponse(JWTToken)({
          value: { token },
        }),
      ),
    )
  }),
)

export const createUserRoute = R.route({
  v: "v1",
  path: "create.user",
  method: "POST",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const client = yield* _(currentClient)
    const env = yield* _(currentEnv)

    const createUser = yield* _(
      pipe(
        discriminator(CreateUser)(request.clone()),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (createUser instanceof DecodeError) {
      return createErrorResponse(string)({
        value: createUser.message,
        status: 400,
      })
    }

    const password = yield* _(hashPassword(createUser.password))

    const token = request.headers.get("X-EffEng-PSK")

    const payload = yield* _(
      T.promise(() =>
        Promise.resolve(
          client.from<User>("users").insert([
            {
              name: createUser.name,
              // Password shall never be encrypted
              password,
              phone: createUser.phone,
              isAdmin: env.AUTH_HEADER_KEY === token,
              email: createUser.email,
              surname: createUser.surname,
            },
          ]),
        ),
      ),
    )

    if (payload.error) {
      return createErrorResponse(string)({
        value: `${payload.error.message} ${payload.error.details}`,
        status: payload.status,
      })
    }

    const [user] = payload.data

    if (!user) {
      return createErrorResponse(string)({
        value: "User not found",
        status: 404,
      })
    }

    return createDataResponse(CommonUser)({
      value: CommonUser.encode({
        id: user.id,
        name: user.name,
      }) as CommonUser, //TODO: Encoding should give back the same type
    })
  }),
)

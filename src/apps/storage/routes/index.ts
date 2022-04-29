import { currentRequest } from "@core/cloudfare/ApiRequest"
import { currentState } from "@core/cloudfare/Storage"
import { currentEnv } from "@core/cloudfare/Worker"
import { DecodeError, deserialize, string } from "@core/codec"
import * as R from "@core/router"
import * as T from "@effect-ts/core/Effect"
import { isLeft } from "@effect-ts/system/Either"
import { pipe } from "@effect-ts/system/Function"
import { AuthUser, JWTToken } from "@streaming/algebras/Auth"
import {
  UserNotFoundError,
  CommonUser,
  User,
  CreateUser,
  UnableToCreateUserError,
} from "@streaming/algebras/User"
import JWT from "@tsndr/cloudflare-worker-jwt"
import {
  getSearchParams,
  createDataResponse,
  createErrorResponse,
  discriminator,
  getPasswordHash,
} from "@utils/request"

export const getUserRoute = R.route({
  v: "v1",
  method: "GET",
  path: "get.user",
})(
  pipe(
    T.do,
    T.bind("state", () => currentState),
    T.bind("request", () => currentRequest),
    T.chain(({ state, request }) => {
      const email = getSearchParams({ url: request.url, key: "email" })
      switch (email._tag) {
        case "Right":
          return pipe(
            T.tryCatchPromise(
              () => state.storage.get(email.right),
              () => UserNotFoundError.make({ message: "User not found" }),
            ),
            T.chain((user) =>
              T.succeedWith(() => {
                if (user) {
                  return createDataResponse(CommonUser)({
                    value: user as CommonUser, // TODO: fix this
                  })
                }
                return createErrorResponse(string)({
                  value: "User not found",
                  status: 404,
                })
              }),
            ),
            T.catchTag("UserNotFoundError", (error) =>
              T.succeedWith(() =>
                createErrorResponse(string)({
                  value: error.message,
                }),
              ),
            ),
          )
        case "Left":
          return T.succeedWith(() =>
            createErrorResponse(string)({
              value: "Unable to decode search param email",
              status: 400,
            }),
          )
      }
    }),
  ),
)

export const loginUserRoute = R.route({
  v: "v1",
  method: "POST",
  path: "login.user",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const state = yield* _(currentState)

    const env = yield* _(currentEnv)

    const maybeAuthUser = yield* _(
      pipe(
        discriminator(AuthUser)(request.clone()),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (maybeAuthUser instanceof DecodeError) {
      return yield* _(
        T.succeed(
          createErrorResponse(string)({
            status: 400,
            value: maybeAuthUser.message,
          }),
        ),
      )
    }

    const authUser = maybeAuthUser

    const maybeUserPayload = deserialize(User)(
      yield* _(T.promise(() => state.storage.get(authUser.email))),
    )

    if (isLeft(maybeUserPayload)) {
      return yield* _(
        T.succeed(
          createErrorResponse(string)({
            status: 404,
            value: "User not found",
          }),
        ),
      )
    }

    const user = maybeUserPayload.right

    const hashed = yield* _(getPasswordHash(user.id, authUser.password))

    if (hashed !== user.password) {
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
    const state = yield* _(currentState)
    const env = yield* _(currentEnv)
    const id = yield* _(T.succeedWith(() => crypto.randomUUID()))

    const maybeCreateUser = yield* _(
      pipe(
        discriminator(CreateUser)(request.clone()),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (maybeCreateUser instanceof DecodeError) {
      return createErrorResponse(string)({
        value: maybeCreateUser.message,
        status: 400,
      })
    }

    const createUser = maybeCreateUser

    const saltedPassword = yield* _(getPasswordHash(id, createUser.password))

    const maybeToken = request.headers.get("X-EffEng-PSK")

    const maybeUser = yield* _(
      pipe(
        T.tryCatchPromise(
          () =>
            state.storage.put(createUser.email, {
              name: createUser.name,
              id,
              // Password shall never be encrypted
              password: saltedPassword,
              phone: createUser.phone,
              isAdmin: env.AUTH_HEADER_KEY === maybeToken,
              email: createUser.email,
              surname: createUser.surname,
            }),
          () =>
            UnableToCreateUserError.make({ message: "Unable to create user" }),
        ),
        T.catchTag("UnableToCreateUserError", (error) =>
          T.succeedWith(() => error),
        ),
      ),
    )
    if (maybeUser instanceof UnableToCreateUserError) {
      return createErrorResponse(string)({
        value: maybeUser.message,
        status: 400,
      })
    }

    return createDataResponse(CommonUser)({
      value: CommonUser.encode({
        id,
        name: createUser.name,
      }) as CommonUser, //TODO: Encoding should give back the same type
    })
  }),
)

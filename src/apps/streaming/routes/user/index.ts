import { API_V1 } from "@constants/versions"
import * as R from "@core/router"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { UserStorage } from "@streaming/http"
import { log } from "@streaming/services/Logger"

export const foo = R.route({ path: "foo", version: API_V1, method: "GET" })(
  pipe(
    log("foo route called!"),
    T.chain(() => T.succeedWith(() => new Response("You're on foo"))),
  ),
)

export const createUser = R.route({
  path: "user",
  version: API_V1,
  method: "POST",
})(UserStorage.create)

export const getUser = R.route({
  path: "user/:email",
  version: API_V1,
  method: "GET",
})(UserStorage.get)

export const loginUser = R.route({
  path: "login",
  version: API_V1,
  method: "POST",
})(UserStorage.login)

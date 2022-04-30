import { currentRequest } from "@core/cloudfare/ApiRequest"
import { UniqueStorage } from "@core/cloudfare/Storage"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { API_V1 } from "@streaming/http/version"

export const create = T.accessServiceM(UniqueStorage)(({ stub }) => {
  return pipe(
    T.do,
    T.bind("request", () => currentRequest),
    T.map(({ request }) => {
      return stub.fetch(
        new Request(
          `${new URL(request.url).origin}/${API_V1}/create.user`,
          request,
        ),
      )
    }),
    T.chain((response) => T.promise(() => response)),
  )
})

export const login = T.accessServiceM(UniqueStorage)(({ stub }) => {
  return pipe(
    currentRequest,
    T.chain((request) => {
      return T.promise(() =>
        stub.fetch(
          new Request(
            `${new URL(request.url).origin}/${API_V1}/login.user`,
            request,
          ),
        ),
      )
    }),
  )
})

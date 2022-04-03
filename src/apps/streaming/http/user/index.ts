import { API_V1 } from "@constants/versions"
import { currentRequest } from "@core/cloudfare/ApiRequest"
import { UniqueStorageContext } from "@core/cloudfare/StorageContext"
import { string } from "@core/codec"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { createErrorResponse, getPathParams } from "@utils/request"

export const create = T.accessServiceM(UniqueStorageContext)(({ stub }) => {
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

export const login = T.accessServiceM(UniqueStorageContext)(({ stub }) => {
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

export const get = T.accessServiceM(UniqueStorageContext)(({ stub }) => {
  return pipe(
    currentRequest,
    T.chain((request) => {
      const email = getPathParams({
        url: new URL(request.url),
        key: "email",
        isLast: true,
      })

      switch (email._tag) {
        case "Right":
          return T.promise(() => {
            return stub.fetch(
              new Request(
                `${
                  new URL(request.url).origin
                }/${API_V1}/get.user?${new URLSearchParams({
                  email: email.right,
                })}`,
                request,
              ),
            )
          })

        case "Left":
          return T.promise(() =>
            Promise.resolve(
              createErrorResponse(string)({
                value: email.left.message,
                status: 400,
              }),
            ),
          )
      }
    }),
  )
})

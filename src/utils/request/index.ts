import {
  Codec,
  DecodeError,
  deserialize,
  Options,
  serialize,
} from "@core/codec"
import * as T from "@effect-ts/core/Effect"
import * as E from "@effect-ts/core/Either"
import { pipe } from "@effect-ts/system/Function"

export const discriminator =
  <A>(codec: Codec<A>) =>
  (request: Request) => {
    const { headers } = request
    const contentType = headers.get("content-type") || ""

    if (
      contentType.includes("application/json") ||
      contentType.includes("text/json")
    ) {
      return pipe(
        T.promise(() => request.json()),
        T.map((json) => deserialize(codec)(json)),
        T.chain((e) => {
          switch (e._tag) {
            case "Right":
              return T.succeedWith(() => e.right)
            case "Left":
              return T.failWith(() => e.left)
          }
        }),
      )
    }
    return T.failWith(() => new DecodeError("Unsupported content type"))
  }

const removeVersion = (pathname: string): string => {
  const version = pathname.match(/\/v\d+\//)
  return version && version[0] ? pathname.replace(version[0], "/") : pathname
}

const removeLastSlash = (pathname: string): string => {
  const lastSlash = pathname.lastIndexOf("/")
  return lastSlash > 0 ? pathname.substring(lastSlash + 1) : pathname
}

/**
 *  This function takes a request and returns a string that is the pathname of the request
 * @param request - A request object
 * @param errorMessage -  A string that is the error message to return if the pathname is not found
 * @param isLast - A boolean that is true if the pathname is the last part of the path
 * @returns A string that is the pathname of the request
 * @example
 * const request = new Request('/v1/users/1', {
 *  method: 'GET',
 *  headers: {
 *      'content-type': 'application/json',
 *      'accept': 'application/json',
 *      'x-api-key': '12345'
 *    }
 * })
 * getPathName(request) // returns '/users/1'
 */
export const getPathParams = ({
  url,
  key,
  isLast,
}: {
  url: string | URL
  key: string
  isLast?: boolean
}) => {
  const { search, pathname } = url instanceof URL ? url : new URL(url)
  const param = `${search}${removeVersion(pathname)}`
  return param
    ? E.right(isLast ? removeLastSlash(param) : param)
    : E.left(new DecodeError(`Error decoding pathname for key: ${key}`))
}

export const getSearchParams = ({
  url,
  key,
}: {
  url: string | URL
  key: string
}) => {
  const { searchParams } = url instanceof URL ? url : new URL(url)

  const param = searchParams.get(key)
  return param
    ? E.right(param)
    : E.left(new DecodeError(`Missing param: ${key}`))
}

export const createErrorResponse =
  <A>(codec: Codec<A>) =>
  ({
    status,
    headers,
    value,
  }: {
    value: string
    status?: number
    headers?: Headers
  }) => {
    const statusCode = status || 500

    return createResponse(codec)({
      status: statusCode,
      headers,
      key: "error",
      value,
    })
  }

export const createDataResponse =
  <A>(codec: Codec<A>) =>
  ({
    status,
    headers,
    value,
  }: {
    value: A
    status?: number
    headers?: Headers
  }) => {
    const statusCode = status || 200

    return createResponse(codec)({
      status: statusCode,
      headers,
      key: "data",
      value,
    })
  }

const createResponse =
  <A>(codec: Codec<A>) =>
  <K extends keyof Options<A>>({
    status,
    headers,
    key,
    value,
  }: {
    key: K
    value: Options<A>[K]
    status: number
    headers?: Headers
  }) => {
    return new Response(serialize(codec)(key, value), {
      status,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    })
  }

export const getPasswordHash = (salt: string, password: string) => {
  return T.gen(function* (_) {
    const textEncoder = new TextEncoder()
    const textDecoder = new TextDecoder()
    const passwordBuffer = textEncoder.encode(password)
    const importedKey = yield* _(
      T.promise(() =>
        crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, [
          "deriveBits",
        ]),
      ),
    )
    const saltBuffer = textEncoder.encode(salt)

    const params = {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations: 512,
    }
    const derivation = yield* _(
      T.promise(() => crypto.subtle.deriveBits(params, importedKey, 16 * 8)),
    )

    return textDecoder.decode(derivation)
  })
}

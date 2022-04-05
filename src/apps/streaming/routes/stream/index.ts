import { currentRequest } from "@core/cloudfare/ApiRequest"
import { DecodeError, string } from "@core/codec"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { StreamingId, StreamingName } from "@streaming/algebras/Streaming"
import {
  createStreamWithName,
  deleteStreamWithStreamId,
  UnableToCreateStreamError,
  UnableToDeleteStreamError,
} from "@streaming/services/Streaming"
import * as R from "@core/router"
import { createErrorResponse, discriminator } from "@utils/request"

export const createStreamFromName = R.route({
  path: "create.stream",
  method: "POST",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const maybeName = yield* _(
      pipe(
        discriminator(StreamingName)(request),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (maybeName instanceof DecodeError) {
      return createErrorResponse(string)({
        value: maybeName.message,
        status: 400,
      })
    }

    const result = yield* _(
      pipe(
        createStreamWithName(maybeName),
        T.catchTag("UnableToCreateStreamError", (e) => T.succeedWith(() => e)),
      ),
    )

    if (result instanceof UnableToCreateStreamError) {
      return createErrorResponse(string)({ value: result.message, status: 400 })
    }
    return result
  }),
)

export const deleteStreamFromName = R.route({
  path: "delete.stream",
  method: "DELETE",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const maybeId = yield* _(
      pipe(
        discriminator(StreamingId)(request),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (maybeId instanceof DecodeError) {
      return createErrorResponse(string)({
        value: maybeId.message,
        status: 400,
      })
    }

    const result = yield* _(
      pipe(
        deleteStreamWithStreamId(maybeId),
        T.catchTag("UnableToDeleteStreamError", (e) => T.succeedWith(() => e)),
      ),
    )

    if (result instanceof UnableToDeleteStreamError) {
      return createErrorResponse(string)({ value: result.message, status: 400 })
    }
    return result
  }),
)

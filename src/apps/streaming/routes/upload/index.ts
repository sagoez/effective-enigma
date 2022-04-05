import { currentRequest } from "@core/cloudfare/ApiRequest"
import { DecodeError, string } from "@core/codec"
import * as R from "@core/router"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { FileUrl } from "@streaming/algebras/Upload"
import {
  UnableToUploadError,
  uploadWithFile,
  uploadWithUrl,
} from "@streaming/services/Upload"
import { createErrorResponse, discriminator } from "@utils/request"

export const uploadFromUrl = R.route({
  path: "upload.copy",
  method: "POST",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const maybeUrl = yield* _(
      pipe(
        discriminator(FileUrl)(request),
        T.catchAll((cause) => {
          return T.succeedWith(() => cause)
        }),
      ),
    )

    if (maybeUrl instanceof DecodeError) {
      return createErrorResponse(string)({ value: maybeUrl.message })
    }

    const result = yield* _(
      pipe(
        uploadWithUrl(maybeUrl),
        T.catchTag("UnableToUploadError", (e) => T.succeedWith(() => e)),
      ),
    )

    if (result instanceof UnableToUploadError) {
      return createErrorResponse(string)({ value: result.message, status: 400 })
    }
    return result
  }),
)

export const uploadFromFile = R.route({
  path: "upload.file",
  method: "POST",
})(
  T.gen(function* (_) {
    const request = yield* _(currentRequest)
    const formData = yield* _(T.promise(() => request.formData()))

    const maybeFile = formData.get("file")

    if (!maybeFile || typeof maybeFile === "string") {
      return createErrorResponse(string)({
        value: "File not found",
        status: 400,
      })
    }

    const result = yield* _(
      pipe(
        uploadWithFile(formData),
        T.catchTag("UnableToUploadError", (e) => T.succeedWith(() => e)),
      ),
    )

    if (result instanceof UnableToUploadError) {
      return createErrorResponse(string)({ value: result.message, status: 400 })
    }

    return result
  }),
)

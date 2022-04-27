import { currentEnv } from "@core/cloudfare/Worker"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"
import { Tagged } from "@effect-ts/system/Case"
import { pipe } from "@effect-ts/system/Function"
import { _A } from "@effect-ts/system/Utils"
import { FileUrl } from "@streaming/algebras/Upload"

export class DetailedError {
  causingError: Error

  constructor(causingError: Error) {
    this.causingError = causingError
  }
}

export class UnableToUploadError extends Tagged("UnableToUploadError")<{
  readonly message: string
}> {}

export class UnableToReadFile extends Tagged("UnableToReadFile")<{}> {}

const makeUploadContextLive = T.succeedWith(() => ({
  uploadWithUrl: (data: FileUrl) => {
    return pipe(
      currentEnv,
      T.chain(({ CF_ACCOUNT_ID, CF_TOKEN }) => {
        return T.tryCatchPromise(
          async () => {
            return fetch(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/copy`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${CF_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...data }),
              },
            )
          },
          () => UnableToUploadError.make({ message: "Unable to upload" }),
        )
      }),
    )
  },

  uploadWithFile: (file: FormData) => {
    return pipe(
      currentEnv,
      T.chain(({ CF_ACCOUNT_ID, CF_TOKEN }) => {
        return T.tryCatchPromise(
          async () => {
            return fetch(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${CF_TOKEN}`,
                },
                body: file,
              },
            )
          },
          () => UnableToUploadError.make({ message: "Unable to upload" }),
        )
      }),
    )
  },
}))

export type UploadContext = _A<typeof makeUploadContextLive>

export const Upload = tag<UploadContext>(Symbol.for("@server/upload-context"))

export const UploadLive = L.fromEffect(Upload)(makeUploadContextLive)

export const uploadWithUrl = (data: FileUrl) =>
  T.accessServiceM(Upload)(({ uploadWithUrl }) => uploadWithUrl(data))

export const uploadWithFile = (file: FormData) =>
  T.accessServiceM(Upload)(({ uploadWithFile }) => uploadWithFile(file))

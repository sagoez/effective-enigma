import { currentEnv } from "@core/cloudfare/Worker"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"
import { Tagged } from "@effect-ts/system/Case"
import { pipe } from "@effect-ts/system/Function"
import { _A } from "@effect-ts/system/Utils"
import { StreamingId, StreamingName } from "@streaming/algebras/Streaming"

export class UnableToCreateStreamError extends Tagged(
  "UnableToCreateStreamError",
)<{
  readonly message: string
}> {}

export class UnableToDeleteStreamError extends Tagged(
  "UnableToDeleteStreamError",
)<{
  readonly message: string
}> {}

const makeStreamingContextLive = T.succeedWith(() => ({
  createStream: (data: StreamingName) => {
    return pipe(
      currentEnv,
      T.chain(({ CF_ACCOUNT_ID, CF_TOKEN }) => {
        return T.tryCatchPromise(
          async () => {
            return fetch(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${CF_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  meta: { name: data.name },
                  recording: {
                    mode: "automatic",
                    timeoutSeconds: 10,
                    requireSignedURLs: false,
                  },
                }),
              },
            )
          },
          () => UnableToCreateStreamError.make({ message: "Unable to upload" }),
        )
      }),
    )
  },

  deleteStream: (data: StreamingId) => {
    return pipe(
      currentEnv,
      T.chain(({ CF_ACCOUNT_ID, CF_TOKEN }) => {
        return T.tryCatchPromise(
          async () => {
            return fetch(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs/${data.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${CF_TOKEN}`,
                  "Content-Type": "application/json",
                },
              },
            )
          },
          () => UnableToDeleteStreamError.make({ message: "Unable to delete" }),
        )
      }),
    )
  },
}))

export type StreamingContext = _A<typeof makeStreamingContextLive>

export const Streaming = tag<StreamingContext>(
  Symbol.for("@server/streaming-context"),
)

export const StreamingLive = L.fromEffect(Streaming)(makeStreamingContextLive)

export const createStreamWithName = (data: StreamingName) =>
  T.accessServiceM(Streaming)(({ createStream }) => createStream(data))

export const deleteStreamWithStreamId = (data: StreamingId) =>
  T.accessServiceM(Streaming)(({ deleteStream }) => deleteStream(data))

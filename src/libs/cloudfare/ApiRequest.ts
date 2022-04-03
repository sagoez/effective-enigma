import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"

// EventContext
export interface APIRequest {
  readonly request: Request
}

export const APIRequest = tag<APIRequest>(
  Symbol.for("@server/api-request-event"),
) // Representation of where you can find the event in the environment

export const APIRequestLive = ({ request }: APIRequest) =>
  L.fromEffect(APIRequest)(T.succeed({ request }))

export const { request: currentRequest } = T.deriveLifted(APIRequest)(
  [],
  [],
  ["request"],
)

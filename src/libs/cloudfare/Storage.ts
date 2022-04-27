import { tag } from "@effect-ts/core/Has"
import * as T from "@effect-ts/core/Effect"

export interface UniqueStorage {
  readonly stub: DurableObjectStub
}
export const UniqueStorage = tag<UniqueStorage>(
  Symbol.for("@server/storage-context"),
)

export interface Storage {
  readonly state: DurableObjectState
}
export const Storage = tag<Storage>(Symbol.for("@server/storage-context"))
export const { state: currentState } = T.deriveLifted(Storage)(
  [],
  [],
  ["state"],
)

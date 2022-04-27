import { tag } from "@effect-ts/core/Has"
import * as T from "@effect-ts/core/Effect"

export interface UniqueStorageContext {
  readonly stub: DurableObjectStub
}
export const UniqueStorageContext = tag<UniqueStorageContext>(
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

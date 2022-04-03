import { tag } from "@effect-ts/core/Has"
import * as T from "@effect-ts/core/Effect"

export interface UniqueStorageContext {
  readonly stub: DurableObjectStub
}
export const UniqueStorageContext = tag<UniqueStorageContext>(
  Symbol.for("@server/storage-context"),
)

export interface StorageContext {
  readonly state: DurableObjectState
}
export const StorageContext = tag<StorageContext>(
  Symbol.for("@server/storage-context"),
)
export const { state: currentState } = T.deriveLifted(StorageContext)(
  [],
  [],
  ["state"],
)

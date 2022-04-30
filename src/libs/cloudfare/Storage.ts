import { tag } from "@effect-ts/core/Has"
import * as T from "@effect-ts/core/Effect"
import { PostgrestClient } from "@supabase/postgrest-js"

export interface UniqueStorage {
  readonly stub: DurableObjectStub
}

export const UniqueStorage = tag<UniqueStorage>(
  Symbol.for("@server/storage-context"),
)

export interface Storage {
  readonly state: PostgrestClient
}
export const Storage = tag<Storage>(Symbol.for("@server/storage-context"))
export const { state: currentClient } = T.deriveLifted(Storage)(
  [],
  [],
  ["state"],
)

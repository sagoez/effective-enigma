import { APIRequestLive } from "@core/cloudfare/ApiRequest"
import { Storage as StorageContext } from "@core/cloudfare/Storage"
import { Env, WorkerContextLive } from "@core/cloudfare/Worker"

import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { LoggerLive } from "@streaming/services/Logger"
import { storageProgram } from "./interpreter"
import { PostgrestClient } from "@supabase/postgrest-js"

export class Storage {
  state: DurableObjectState
  env: Env
  ctx: ExecutionContext

  constructor(state: DurableObjectState, env: Env, ctx: ExecutionContext) {
    this.state = state
    this.env = env
    this.ctx = ctx
  }

  async fetch(request: Request) {
    const StorageContextLive = LoggerLive["+++"](APIRequestLive({ request }))[
      "+++"
    ](WorkerContextLive({ ctx: this.ctx, env: this.env }))
    const main = pipe(
      storageProgram,
      T.provideSomeLayer(StorageContextLive),
      T.provideService(StorageContext)({
        state: new PostgrestClient(this.env.POSTGREST_ENDPOINT, {
          headers: {
            "Content-Type": "application/json",
            apikey: this.env.SUPABASE_KEY,
            Authorization: `Bearer ${this.env.SUPABASE_KEY}`,
            Prefer: "return=representation",
          },
        }),
      }),
    )
    return T.runPromise(main)
  }
}

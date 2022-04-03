import { APIRequestLive } from "@core/cloudfare/ApiRequest"
import { StorageContext } from "@core/cloudfare/StorageContext"
import { Env, WorkerContextLive } from "@core/cloudfare/WorkerContext"

import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/system/Function"
import { LoggerLive } from "@streaming/services/Logger"
import { storageProgram } from "./interpreter"

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
      T.provideService(StorageContext)({ state: this.state }),
    )
    return T.runPromise(main)
  }
}

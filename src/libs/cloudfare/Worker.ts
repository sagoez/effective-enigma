import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"

export type Env = {
  readonly __STATIC_CONTENT: string
  readonly STORAGE: DurableObjectNamespace
  readonly JWT_SECRET: string
  readonly AUTH_HEADER_KEY: string
  readonly CF_TOKEN: string
  readonly CF_ACCOUNT_ID: string
  readonly POSTGREST_ENDPOINT: string
  readonly SUPABASE_KEY: string
  readonly EE_STR_KEY: string
}

// EventContext
export interface Worker {
  readonly env: Env
  readonly ctx: ExecutionContext
}

export const Worker = tag<Worker>(Symbol.for("@server/worker-context")) // Representation of where you can find the event in the environment

export const WorkerContextLive = ({ env, ctx }: Worker) =>
  L.fromEffect(Worker)(T.succeed({ env, ctx }))

export const { env: currentEnv, ctx: currentExecutionContext } = T.deriveLifted(
  Worker,
)([], [], ["env", "ctx"])

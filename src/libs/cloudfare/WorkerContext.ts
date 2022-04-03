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
}

// EventContext
export interface WorkerContext {
  readonly env: Env
  readonly ctx: ExecutionContext
}

export const WorkerContext = tag<WorkerContext>(
  Symbol.for("@server/worker-context"),
) // Representation of where you can find the event in the environment

export const WorkerContextLive = ({ env, ctx }: WorkerContext) =>
  L.fromEffect(WorkerContext)(T.succeed({ env, ctx }))

export const { env: currentEnv, ctx: currentExecutionContext } = T.deriveLifted(
  WorkerContext,
)([], [], ["env", "ctx"])

import { APIRequestLive } from "@core/cloudfare/ApiRequest"
import { UniqueStorage } from "@core/cloudfare/Storage"
import { Env, WorkerContextLive } from "@core/cloudfare/Worker"
import { string } from "@core/codec"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { pretty } from "@effect-ts/system/Cause"
import { createErrorResponse } from "@utils/request"
import { program } from "@streaming"

export { Storage } from "@storage"

// RPC = Remote Procedure Call
export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const uniqueStorageId = env.STORAGE.idFromName("users")
    const uniqueStorage = env.STORAGE.get(uniqueStorageId)

    const AppEnv = APIRequestLive({ request })["+++"](
      WorkerContextLive({ env, ctx }),
    )

    const main = pipe(
      program,
      T.provideSomeLayer(AppEnv),
      T.sandbox,
      T.catchAll((cause) =>
        pipe(
          T.succeedWith(() => console.error(pretty(cause))),
          T.map(() =>
            createErrorResponse(string)({ value: "Internal server error" }),
          ),
        ),
      ),
      T.provideService(UniqueStorage)({ stub: uniqueStorage }),
    )
    return T.runPromise(main)
  },
}

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"

// Usage
export interface Logger {
  readonly log: (...data: any[]) => T.UIO<void>
  readonly debug: (...data: any[]) => T.UIO<void>
}

export const Logger = tag<Logger>(Symbol.for("@server/logger-context"))

export const LoggerLive = L.fromEffect(Logger)(
  T.succeed({
    log: (...data: any[]) => T.succeedWith(() => console.log(data)),
    debug: (...data: any[]) => T.succeedWith(() => console.debug(data)),
  }),
)

export const log = (...data: any[]) =>
  T.accessServiceM(Logger)(({ log }) => log(data))

export const debug = (...data: any[]) =>
  T.accessServiceM(Logger)(({ debug }) => debug(data))

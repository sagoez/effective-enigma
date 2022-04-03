import * as R from "@core/router"
import {
  createStreamFromName,
  deleteStreamFromName,
} from "@streaming/routes/stream"
import { uploadFromFile } from "@streaming/routes/upload"
import { createUser, foo, getUser, loginUser } from "@streaming/routes/user"
import { LoggerLive } from "@streaming/services/Logger"
import { StreamingLive } from "@streaming/services/Streaming"
import { UploadLive } from "@streaming/services/Upload"
import { adminMiddleware, authMiddleware } from "@utils/middleware"

export const AppContextLive =
  LoggerLive["+++"](StreamingLive)["+++"](UploadLive)

const adminRoutes = R.merge(createStreamFromName, deleteStreamFromName)

const authorizedRoutes = R.merge(getUser, uploadFromFile, uploadFromFile)
const nonAuthorizedRouted = R.merge(createUser, foo, loginUser)

const routesWithLogger = R.merge(
  nonAuthorizedRouted,
  authMiddleware(authorizedRoutes),
  adminMiddleware(adminRoutes),
)

export const program = R.routerRequestHandler(routesWithLogger)

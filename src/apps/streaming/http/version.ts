// API Version
export const API_V1 = "v1" as const
export const API_V2 = "v2" as const

// Make a type that is a union of all the versions
export type API_VERSION = typeof API_V1 | typeof API_V2

import { ExtractType, required, string } from "@core/codec"

// Token
export const JWTToken_ = required({
  token: string,
})

export interface JWTToken extends ExtractType<typeof JWTToken_> {}
export const JWTToken = JWTToken_.as<JWTToken>()

// AuthUser
export const AuthUser_ = required({
  email: string,
  password: string,
})

export interface AuthUser extends ExtractType<typeof AuthUser_> {}
export const AuthUser = AuthUser_.as<AuthUser>()

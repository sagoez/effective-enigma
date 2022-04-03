import {
  boolean,
  ExtractType,
  intersection,
  number,
  optional,
  required,
  string,
} from "@core/codec"
import { Tagged } from "@effect-ts/system/Case"

// CommonUser
export const CommonUser_ = intersection(
  required({
    id: string,
    name: string,
  }),
  optional({
    isAdmin: boolean,
  }),
)

export interface CommonUser extends ExtractType<typeof CommonUser_> {}
export const CommonUser = CommonUser_.as<CommonUser>()

// CreateUser
export const CreateUser_ = intersection(
  required({
    name: string,
    surname: string,
    email: string,
    password: string,
  }),
  optional({
    phone: number,
  }),
)

export interface CreateUser extends ExtractType<typeof CreateUser_> {}
export const CreateUser = CreateUser_.as<CreateUser>()

// User
export const User_ = intersection(
  required({
    id: string,
    name: string,
    surname: string,
    email: string,
    password: string,
    isAdmin: boolean,
  }),
  optional({
    phone: number,
  }),
)

export interface User extends ExtractType<typeof User_> {}
export const User = User_.as<User>()

// Errors
export class UserNotFoundError extends Tagged("UserNotFoundError")<{
  readonly message: string
}> {}

export class UnableToCreateUserError extends Tagged("UnableToCreateUserError")<{
  readonly message: string
}> {}

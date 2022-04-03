import * as E from "@effect-ts/core/Either"

export class DecodeError {
  constructor(public readonly message: string) {}
}

// Final or Executable encoding
export class Codec<Type> {
  static make = <A>({
    encode,
    decode,
    is,
  }: {
    encode: (a: A) => unknown
    decode: (u: unknown) => E.Either<DecodeError, A>
    is: (u: unknown) => u is A
  }) => new Codec(encode, decode, is)

  constructor(
    readonly encode: (a: Type) => unknown,
    readonly decode: (u: unknown) => E.Either<DecodeError, Type>,
    readonly is: (u: unknown) => u is Type,
  ) {}

  as<B extends Type>(
    ..._: Type extends B
      ? []
      : [never, "The type", B, "is not assignable to", Type]
  ): Codec<B> {
    // @ts-expect-error
    return this
  }
}

export const string = Codec.make({
  encode: (a: string) => a,
  decode: (u: unknown) =>
    typeof u === "string"
      ? E.right(u)
      : E.left(new DecodeError(`Expected string but got -> ${typeof u}`)),
  is: (u: unknown): u is string => typeof u === "string",
})

export const number = Codec.make({
  encode: (a: number) => a,
  decode: (u: unknown) => {
    if (typeof u === "number") {
      return E.right(u)
    }

    return E.left(new DecodeError(`Expected number but got -> ${typeof u}`))
  },
  is: (u: unknown): u is number => typeof u === "number",
})

export const boolean = Codec.make({
  encode: (a: boolean) => a,
  decode: (u: unknown) => {
    if (typeof u === "boolean") {
      return E.right(u)
    }

    return E.left(new DecodeError(`Expected boolean but got -> ${typeof u}`))
  },
  is: (u: unknown): u is boolean => typeof u === "boolean",
})

export const date = Codec.make({
  encode: (a: Date) => a.toISOString(),
  decode: (u: unknown) => {
    if (u instanceof Date) {
      return E.right(u)
    }

    if (typeof u === "string" || typeof u === "number") {
      const parsed = new Date(u)
      if (isNaN(parsed.getTime())) {
        return E.left(new DecodeError(`Expected valid date but got -> ${u}`))
      }
      return E.right(parsed)
    }

    return E.left(new DecodeError(`Expected Date but got -> ${typeof u}`))
  },
  is: (u: unknown): u is Date => u instanceof Date,
})

export const array = <A>(element: Codec<A>): Codec<Array<A>> =>
  Codec.make({
    encode: (a: Array<A>) => a.map(element.encode),
    decode: (a: unknown) => {
      const errors: DecodeError[] = []
      if (!Array.isArray(a)) {
        return E.left(new DecodeError(`Expected Set but got -> ${typeof a}`))
      }
      const result = a.flatMap((value) => {
        const decoded = element.decode(value)
        switch (decoded._tag) {
          case "Left":
            errors.push(decoded.left)
            return []
          case "Right":
            return [decoded.right]
        }
      })
      if (errors.length > 0) {
        return E.left(
          new DecodeError(
            `Missing field(s): ${errors.map((e) => e.message).join(", ")}`,
          ),
        )
      }
      return E.right(result)
    },
    is: (u): u is Array<A> => Array.isArray(u) && u.every(element.is),
  })

/* export const set = Codec.make({
  encode: (a: Set<unknown>) => new Set([...(encodeV(a) as unknown[])]),
  decode: (u: unknown) => {
    if (u instanceof Set) {
      const values = (
        decodeV(u) as E.Either<DecodeError, string | Date | number | boolean>[]
      ).flat(Infinity)

      const errorIndex = values.findIndex((v) => v?._tag === 'Left')

      if (errorIndex >= 0) {
        return E.left(
          new DecodeError(`Error decoding set values at index ${errorIndex}`),
        )
      }

      return E.right(new Set(values))
    }
    return E.left(new DecodeError(`Expected Set but got -> ${typeof u}`))
  },
  is: (u: unknown): u is Set<unknown> => u instanceof Set,
}) */

export type ExtractType<A extends Codec<any>> = [A] extends [Codec<infer X>]
  ? X
  : never

export function required<
  X extends {
    [key: string]: Codec<any>
  },
>(
  fieldCodecs: X,
): Codec<{
  readonly [key in keyof X]: ExtractType<X[key]>
}> {
  const encode: (a: {
    readonly [key in keyof X]: ExtractType<X[key]>
  }) => unknown = (a) => {
    const result = {}
    for (const [key, codec] of Object.entries(fieldCodecs)) {
      result[key] = codec.encode(a[key])
    }
    return result
  }
  // @ts-expect-error
  const decode: (
    u: unknown,
  ) => E.Either<
    DecodeError,
    { readonly [key in keyof X]: ExtractType<X[key]> }
  > = (u) => {
    if (typeof u !== "object" || u === null) {
      return E.left(new DecodeError(`Expected object but got -> ${typeof u}`))
    }
    const result = {}
    // This error is for the case where the object has missing keys. We want to
    // accumulate all the errors, so we can report them all at once.
    const error = []
    for (const [key, codec] of Object.entries(fieldCodecs)) {
      if (!(key in u)) {
        error.push(new DecodeError(key))
      }
      if (error.length === 0) {
        const value = codec.decode(u[key])
        if (value._tag === "Left") {
          // When we have a decoding error, we want to fail fast.
          return E.left(
            new DecodeError(
              `Error decoding field ${key}: ${value.left.message}`,
            ),
          )
        }
        result[key] = value.right
      }
    }
    if (error.length > 0) {
      return E.left(
        new DecodeError(
          `Missing field(s): ${error.map((e) => e.message).join(", ")}`,
        ),
      )
    }

    return E.right(result)
  }
  // @ts-expect-error
  const is: (
    u: unknown,
  ) => u is { readonly [key in keyof X]: ExtractType<X[key]> } = (u) =>
    typeof u === "object" &&
    u !== null &&
    Object.keys(fieldCodecs).every(
      (field) => field in u && fieldCodecs[field]!.is(u[field]),
    )

  return Codec.make({ encode, decode, is })
}

export function optional<
  X extends {
    [key: string]: Codec<any>
  },
>(
  fieldCodecs: X,
): Codec<{
  readonly [key in keyof X]?: ExtractType<X[key]>
}> {
  const encode: (a: {
    readonly [key in keyof X]?: ExtractType<X[key]> | undefined
  }) => unknown = (a) => {
    const result = {}
    for (const [key, codec] of Object.entries(fieldCodecs)) {
      if (key in a && a[key] !== undefined && a[key] !== null) {
        result[key] = codec.encode(a[key])
      }
    }
    return result
  }
  const decode: (
    u: unknown,
  ) => E.Either<
    DecodeError,
    { readonly [key in keyof X]?: ExtractType<X[key]> | undefined }
  > = (u) => {
    if (typeof u !== "object" || u === null) {
      return E.left(new DecodeError(`Expected object but got -> ${typeof u}`))
    }
    const result = {}
    for (const [key, codec] of Object.entries(fieldCodecs)) {
      if (key in u && u[key] !== undefined && u[key] !== null) {
        const value = codec.decode(u[key])
        if (value._tag === "Left") {
          // When we have a decoding error, we want to fail fast.
          return E.left(
            new DecodeError(
              `Error decoding field ${key}: ${value.left.message}`,
            ),
          )
        }
        result[key] = value.right
      }
    }
    return E.right(result)
  }

  // @ts-expect-error
  const is: (
    u: unknown,
  ) => u is { readonly [key in keyof X]?: ExtractType<X[key]> | undefined } = (
    u,
  ) =>
    typeof u === "object" &&
    u !== null &&
    Object.keys(fieldCodecs).every((key) =>
      key in u && u[key] !== undefined && u[key] !== null
        ? fieldCodecs[key]!.is(u[key])
        : true,
    )
  return Codec.make({ encode, decode, is })
}

export function intersection<
  A extends Record<PropertyKey, unknown>,
  B extends Record<PropertyKey, unknown>,
>(
  leftCodec: Codec<A>,
  rightCodec: Codec<B>,
): Codec<{
  readonly [key in keyof (A & B)]: (A & B)[key]
}> {
  const encode: (a: {
    readonly [key in keyof (A & B)]: (A & B)[key]
  }) => unknown = (a) => {
    const left = leftCodec.encode(a)
    const right = rightCodec.encode(a)
    const result = {}
    if (
      typeof left === "object" &&
      left !== null &&
      typeof right === "object" &&
      right !== null
    ) {
      for (const key of Object.keys(left)) {
        result[key] = left[key]
      }
      for (const key of Object.keys(right)) {
        if (key in right) {
          result[key] = right[key]
        }
      }
    }
    return result
  }

  const decode: (
    u: unknown,
  ) => E.Either<
    DecodeError,
    { readonly [key in keyof (A & B)]: (A & B)[key] }
  > = (u) => {
    if (typeof u !== "object" || u === null) {
      return E.left(new DecodeError(`Expected object but got -> ${typeof u}`))
    }
    const left = leftCodec.decode(u)

    if (left._tag === "Left") {
      return E.left(new DecodeError(left.left.message))
    }
    const right = rightCodec.decode(u)
    if (right._tag === "Left") {
      return E.left(new DecodeError(right.left.message))
    }
    return E.right({ ...left.right, ...right.right })
  }

  // @ts-expect-error
  const is: (
    u: unknown,
  ) => u is { readonly [key in keyof (A & B)]: (A & B)[key] } = (u) =>
    leftCodec.is(u) && rightCodec.is(u)
  return Codec.make({ encode, decode, is })
}

export interface Options<A> {
  data: A
  error: string
}

export function serialize<A, K extends keyof Options<A>>(
  codec: Codec<A>,
): (key: K, value: Options<A>[K]) => string {
  return (key, value) => {
    const encoded = {}
    if (key === "data") {
      encoded["data"] = codec.encode(value as A)
    }
    if (key === "error") {
      encoded["error"] = value as string
    }
    return JSON.stringify(encoded)
  }
}

export function deserialize<A>(codec: Codec<A>) {
  return (s: unknown) => {
    if (typeof s === "string") {
      return codec.decode(JSON.parse(s))
    }

    return codec.decode(s)
  }
}

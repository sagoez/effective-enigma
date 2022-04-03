import { ExtractType, required, string } from "@core/codec"

export const StreamingName_ = required({
  name: string,
})

export interface StreamingName extends ExtractType<typeof StreamingName_> {}
export const StreamingName = StreamingName_.as<StreamingName>()

export const StreamingId_ = required({
  id: string,
})

export interface StreamingId extends ExtractType<typeof StreamingId_> {}
export const StreamingId = StreamingId_.as<StreamingId>()

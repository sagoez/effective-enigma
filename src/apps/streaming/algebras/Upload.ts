import { ExtractType, required, string } from "@core/codec"

export const FileUrl_ = required({
  url: string,
  meta: required({
    name: string,
  }),
})

export interface FileUrl extends ExtractType<typeof FileUrl_> {}
export const FileUrl = FileUrl_.as<FileUrl>()

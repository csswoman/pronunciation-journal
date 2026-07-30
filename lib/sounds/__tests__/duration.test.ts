import { describe, expect, it } from "vitest"
import { parseSoundDuration } from "../duration"

describe("parseSoundDuration", () => {
  it("normalizes the stored English duration labels", () => {
    expect(parseSoundDuration("long")).toBe("long")
    expect(parseSoundDuration("short vowel")).toBe("short")
  })

  it("does not treat unrelated lesson categories as duration", () => {
    expect(parseSoundDuration("vowel")).toBeUndefined()
    expect(parseSoundDuration(null)).toBeUndefined()
  })
})

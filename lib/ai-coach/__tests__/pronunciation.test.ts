// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { getStaticWordIPA, fetchWordIPA } from "../pronunciation";

describe("getStaticWordIPA", () => {
  it("returns static IPA for default phrase words", () => {
    expect(getStaticWordIPA("She")).toBe("ʃiː");
    expect(getStaticWordIPA("works")).toBe("wɜːrks");
    expect(getStaticWordIPA("really")).toBe("ˈriːəli");
    expect(getStaticWordIPA("hard")).toBe("hɑːrd");
    expect(getStaticWordIPA("every")).toBe("ˈɛvri");
    expect(getStaticWordIPA("single")).toBe("ˈsɪŋɡəl");
    expect(getStaticWordIPA("day")).toBe("deɪ");
  });

  it("handles punctuation and capitalization gracefully", () => {
    expect(getStaticWordIPA("day?")).toBe("deɪ");
    expect(getStaticWordIPA("THATS")).toBeNull();
    expect(getStaticWordIPA("I'm")).toBe("aɪm");
  });

  it("returns null for unknown words", () => {
    expect(getStaticWordIPA("supercalifragilistic")).toBeNull();
  });
});

describe("fetchWordIPA", () => {
  it("resolves statically for known words without hitting fetch", async () => {
    const ipa = await fetchWordIPA("hard");
    expect(ipa).toBe("hɑːrd");
  });
});

import { describe, expect, it } from "vitest";
import { extractAddress, shortAddress, validateAddress } from "@/lib/address/validate";
import { looksLikeSecret } from "@/lib/address/seedGuard";

const P2PKH = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
const P2SH = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
const BECH = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

describe("validateAddress", () => {
  it("accepts the three Bitcoin formats", () => {
    expect(validateAddress(P2PKH)).toMatchObject({ ok: true, kind: "p2pkh" });
    expect(validateAddress(P2SH)).toMatchObject({ ok: true, kind: "p2sh" });
    expect(validateAddress(BECH)).toMatchObject({ ok: true, kind: "bech32" });
  });
  it("trims and lower-cases all-uppercase bech32", () => {
    expect(validateAddress(`  ${BECH.toUpperCase()}  `)).toMatchObject({ ok: true, address: BECH });
  });
  it("rejects empty, junk and mixed-case bech32", () => {
    expect(validateAddress("")).toEqual({ ok: false, reason: "empty" });
    expect(validateAddress("hello")).toEqual({ ok: false, reason: "format" });
    expect(validateAddress("bc1Qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toEqual({ ok: false, reason: "mixed_case" });
  });
  it("accepts DEMO- placeholders only when allowed", () => {
    expect(validateAddress("DEMO-ILLICIT-01").ok).toBe(false);
    expect(validateAddress("DEMO-ILLICIT-01", { allowDemo: true })).toMatchObject({ ok: true, kind: "demo" });
    expect(validateAddress("DEMO-w02271", { allowDemo: true })).toMatchObject({ ok: true, kind: "demo" }); // real fixture backend
  });
});

describe("extractAddress", () => {
  it("finds an address inside a sentence", () => {
    expect(extractAddress(`please check ${P2PKH} for me`)).toBe(P2PKH);
  });
  it("finds a spoken address with spaces between characters", () => {
    expect(extractAddress(P2SH.split("").join(" "))).toBe(P2SH);
  });
  it("returns null when there is nothing", () => {
    expect(extractAddress("hello there")).toBeNull();
  });
});

describe("shortAddress", () => {
  it("shortens long values and keeps short ones", () => {
    expect(shortAddress(BECH)).toBe("bc1qar…wf5mdq");
    expect(shortAddress("abc")).toBe("abc");
  });
});

describe("looksLikeSecret", () => {
  const words12 = "legal winner thank year wave sausage worth useful legal winner thank yellow";
  it("flags seed phrases of 12 and 24 words", () => {
    expect(looksLikeSecret(words12)).toBe(true);
    expect(looksLikeSecret(`${words12} ${words12}`)).toBe(true);
  });
  it("flags 64 hex characters, with or without 0x", () => {
    const hex = "a".repeat(64);
    expect(looksLikeSecret(hex)).toBe(true);
    expect(looksLikeSecret(`0x${hex}`)).toBe(true);
  });
  it("flags WIF private keys", () => {
    expect(looksLikeSecret("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ")).toBe(true);
    expect(looksLikeSecret("KwdMAjGmerYanjeui5SHS7JkmpZvVipYvB2LJGU1ZxJwYvP98617")).toBe(true);
  });
  it("does not flag addresses or ordinary text", () => {
    expect(looksLikeSecret(P2PKH)).toBe(false);
    expect(looksLikeSecret(BECH)).toBe(false);
    expect(looksLikeSecret("check this wallet please")).toBe(false);
    expect(looksLikeSecret("")).toBe(false);
  });
  it("does not flag 11 or 13 words", () => {
    expect(looksLikeSecret("legal winner thank year wave sausage worth useful legal winner thank")).toBe(false);
  });
});

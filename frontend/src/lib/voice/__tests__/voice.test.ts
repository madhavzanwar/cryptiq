import { describe, expect, it } from "vitest";
import { finalTranscript, speechLang } from "@/lib/voice/speech";
import { formatTimer, levelsFromTimeDomain, pickMimeType } from "@/lib/voice/record";

describe("pickMimeType", () => {
  it("prefers webm/opus, then falls back in order", () => {
    expect(pickMimeType(() => true)).toBe("audio/webm;codecs=opus");
    expect(pickMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickMimeType((t) => t.startsWith("audio/ogg"))).toBe("audio/ogg;codecs=opus");
  });
  it("returns undefined when nothing is supported", () => {
    expect(pickMimeType(() => false)).toBeUndefined();
  });
});

describe("formatTimer", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTimer(0)).toBe("0:00");
    expect(formatTimer(7.9)).toBe("0:07");
    expect(formatTimer(65)).toBe("1:05");
    expect(formatTimer(-3)).toBe("0:00");
  });
});

describe("levelsFromTimeDomain", () => {
  it("returns zeros for silence (128) and for an empty buffer", () => {
    expect(levelsFromTimeDomain(new Uint8Array(64).fill(128), 4)).toEqual([0, 0, 0, 0]);
    expect(levelsFromTimeDomain(new Uint8Array(0), 3)).toEqual([0, 0, 0]);
  });
  it("is louder for a bigger swing, and capped at 1", () => {
    const quiet = levelsFromTimeDomain(new Uint8Array(32).fill(136), 1)[0]!;
    const loud = levelsFromTimeDomain(new Uint8Array(32).fill(255), 1)[0]!;
    expect(loud).toBeGreaterThan(quiet);
    expect(loud).toBeLessThanOrEqual(1);
  });
  it("splits the buffer into the requested number of bars", () => {
    const data = new Uint8Array(40).fill(128);
    data.fill(255, 30, 40); // only the last quarter is loud
    const bars = levelsFromTimeDomain(data, 4);
    expect(bars).toHaveLength(4);
    expect(bars[3]).toBeGreaterThan(0.5);
    expect(bars[0]).toBe(0);
  });
});

describe("speech helpers", () => {
  it("maps UI language to speech language tags", () => {
    expect(speechLang("hi")).toBe("hi-IN");
    expect(speechLang("en")).toBe("en-IN");
  });
  it("joins only final transcripts", () => {
    const results = {
      length: 3,
      0: { isFinal: true, length: 1, 0: { transcript: " check " } },
      1: { isFinal: false, length: 1, 0: { transcript: "ignored" } },
      2: { isFinal: true, length: 1, 0: { transcript: "this wallet" } },
    };
    expect(finalTranscript(results)).toBe("check this wallet");
  });
});

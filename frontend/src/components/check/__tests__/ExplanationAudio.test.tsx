import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExplanationPanel } from "@/components/check/ExplanationPanel";
import { FIXTURES } from "@/lib/mocks";
import { useSettings } from "@/lib/stores/settings";

const base = FIXTURES["DEMO-LICIT-02"]!;
const spoken: { text: string; lang: string }[] = [];
const created: string[] = [];
let playImpl: () => Promise<void>;

beforeEach(() => {
  spoken.length = 0;
  created.length = 0;
  playImpl = () => Promise.resolve();
  useSettings.setState({ lang: "en" });
  class FakeAudio {
    ontimeupdate: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    duration = 1;
    currentTime = 0;
    constructor(src: string) {
      created.push(src);
    }
    play() {
      return playImpl();
    }
    pause() {}
  }
  class FakeUtterance {
    lang = "";
    onboundary: unknown = null;
    onend: unknown = null;
    onerror: unknown = null;
    constructor(public text: string) {}
  }
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { speak: (u: FakeUtterance) => spoken.push({ text: u.text, lang: u.lang }), cancel() {}, pause() {}, resume() {} },
  });
});
afterEach(() => vi.unstubAllGlobals());

const listen = () => userEvent.click(screen.getByRole("button", { name: /^listen/i }));

describe("Listen", () => {
  it("plays the backend MP3 from the backend origin path when audioUrl is set", async () => {
    render(<ExplanationPanel result={{ ...base, audioUrl: "/api/audio/abc.mp3" }} requestLang="en" />);
    await listen();
    await waitFor(() => expect(created).toEqual(["/api/audio/abc.mp3"]));
    expect(spoken).toHaveLength(0);
  });

  it("uses browser speech synthesis (en-IN) when there is no audioUrl", async () => {
    render(<ExplanationPanel result={{ ...base, audioUrl: null }} requestLang="en" />);
    await listen();
    await waitFor(() => expect(spoken).toHaveLength(1));
    expect(spoken[0]).toMatchObject({ lang: "en-IN", text: base.explanation.en });
    expect(created).toHaveLength(0);
  });

  it("uses hi-IN for the Hindi tab", async () => {
    useSettings.setState({ lang: "hi" });
    render(<ExplanationPanel result={{ ...base, audioUrl: null }} requestLang="hi" />);
    await userEvent.click(screen.getByRole("button", { name: /सुनें|listen/i }));
    await waitFor(() => expect(spoken[0]?.lang).toBe("hi-IN"));
  });

  it("falls back to speech synthesis when the MP3 cannot be played", async () => {
    playImpl = () => Promise.reject(new Error("NotSupportedError"));
    render(<ExplanationPanel result={{ ...base, audioUrl: "/api/audio/broken.mp3" }} requestLang="en" />);
    await listen();
    await waitFor(() => expect(spoken).toHaveLength(1));
    expect(created).toEqual(["/api/audio/broken.mp3"]);
    expect(spoken[0]?.text).toBe(base.explanation.en);
  });
});

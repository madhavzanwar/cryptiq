import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWalletHostReady, useWalletSlots, walletSlots } from "../web3Slots";

describe("wallet slot registry", () => {
  it("adds, replaces and removes slots by id", () => {
    const node = document.createElement("div");
    const { result } = renderHook(() => useWalletSlots());
    expect(result.current).toHaveLength(0);
    act(() => walletSlots.set({ id: "a", node, content: "one" }));
    act(() => walletSlots.set({ id: "b", node, content: "two" }));
    act(() => walletSlots.set({ id: "a", node, content: "uno" }));
    expect(result.current.map((s) => [s.id, s.content])).toEqual([
      ["b", "two"],
      ["a", "uno"],
    ]);
    act(() => walletSlots.remove("a"));
    act(() => walletSlots.remove("missing"));
    expect(result.current.map((s) => s.id)).toEqual(["b"]);
    act(() => walletSlots.remove("b"));
  });
  it("tracks host readiness", () => {
    const { result } = renderHook(() => useWalletHostReady());
    expect(result.current).toBe(false);
    act(() => walletSlots.setHostReady(true));
    expect(result.current).toBe(true);
    act(() => walletSlots.setHostReady(false));
    expect(result.current).toBe(false);
  });
});

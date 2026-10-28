import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DetailsTabs } from "@/components/check/DetailsTabs";
import { FIXTURES } from "@/lib/mocks";

const base = FIXTURES["DEMO-ILLICIT-01"]!;

describe("DetailsTabs: missing metrics say 'Not measured'", () => {
  it("shows Not measured for F1, PageRank and cluster size when the API omitted them", async () => {
    const result = { ...base, model: { name: "m" }, graphFeatures: {}, engine: undefined };
    render(<DetailsTabs result={result} />);
    await userEvent.click(screen.getByRole("tab", { name: /model info/i }));
    expect(screen.getAllByText("Not measured").length).toBeGreaterThanOrEqual(3);
  });
  it("shows the real numbers when the API sent them", async () => {
    const result = { ...base, model: { name: "m", illicitF1Test: 0.5 }, graphFeatures: { pagerank: 0.00012, componentSize: 4321 } };
    render(<DetailsTabs result={result} />);
    await userEvent.click(screen.getByRole("tab", { name: /model info/i }));
    expect(screen.getByText("0.500")).toBeInTheDocument();
    expect(screen.getByText("4321")).toBeInTheDocument();
    expect(screen.queryByText("Not measured")).toBeNull();
  });
});

"use client";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CheckResponse, GraphNode } from "@/lib/api/types";
import { shortAddress } from "@/lib/address/validate";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Route, ZoomIn, ZoomOut } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GraphController } from "./ForceGraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { GraphList } from "./GraphList";
import { capNodes, filterByHop, hopCountRows, maxHop, shortestPathToIllicit } from "./graphUtils";
import { NodeDrawer } from "./NodeDrawer";
import { useReducedMotionPref } from "./useReducedMotionPref";

// The canvas library touches `window`: load it on the client only, with a skeleton in its place.
const ForceGraphCanvas = dynamic(() => import("./ForceGraphCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-card" />,
});

type Depth = 1 | 2 | 3;

function IconButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-button border border-carbon transition-[background-color,color,transform] duration-[120ms] ease-out active:scale-[0.96]",
        pressed ? "bg-carbon text-pure-white" : "bg-pure-white text-carbon hover:bg-bone",
      )}
    >
      {children}
    </button>
  );
}

function Panel({ result }: { result: CheckResponse }) {
  const { t } = useT();
  const reduced = useReducedMotionPref();

  const full = result.subgraph;
  const available = Math.max(1, maxHop(full)) as Depth;
  const [depth, setDepth] = useState<Depth>(Math.min(2, available) as Depth);
  const [paused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hover, setHover] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const controller = useRef<GraphController | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Depth filter first, then the render cap (the checked wallet is always kept).
  const view = useMemo(() => capNodes(filterByHop(full, depth)), [full, depth]);
  const path = useMemo(() => (highlight ? shortestPathToIllicit(view) : null), [highlight, view]);
  const pathNodeIds = useMemo(() => new Set(path?.nodeIds ?? []), [path]);
  const pathLinkKeys = useMemo(() => path?.linkKeys ?? new Set<string>(), [path]);

  // Measure the stage (width and height) so the canvas always fills it, also in fullscreen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: Math.floor(entry.contentRect.width), h: Math.floor(entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void panelRef.current?.requestFullscreen?.();
  };

  const depthOptions = ([1, 2, 3] as const).filter((d) => d <= available).map((d) => ({ value: String(d), label: t("graph.depth.n", { n: d }) }));

  return (
    <div ref={panelRef} className={cn("flex flex-col gap-[18px] bg-pure-white", fullscreen && "h-dvh p-[26px]")}>
      <div className="flex flex-wrap items-center justify-between gap-[13px]">
        <h3 className="sub">{t("graph.title")}</h3>
        <div className="flex flex-wrap items-center gap-[9px]">
          {depthOptions.length > 1 && (
            <Segmented
              label={t("graph.depth.label")}
              value={String(depth)}
              onChange={(v) => {
                setDepth(Number(v) as Depth);
                setSelected(null);
              }}
              options={depthOptions}
            />
          )}
          <IconButton label={t("graph.zoomIn")} onClick={() => controller.current?.zoomIn()}>
            <ZoomIn className="size-5" aria-hidden />
          </IconButton>
          <IconButton label={t("graph.zoomOut")} onClick={() => controller.current?.zoomOut()}>
            <ZoomOut className="size-5" aria-hidden />
          </IconButton>
          <IconButton label={t("graph.reset")} onClick={() => controller.current?.reset()}>
            <RotateCcw className="size-5" aria-hidden />
          </IconButton>
          <IconButton label={fullscreen ? t("graph.fullscreen.exit") : t("graph.fullscreen")} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="size-5" aria-hidden /> : <Maximize2 className="size-5" aria-hidden />}
          </IconButton>
          {!reduced && (
            <IconButton label={paused ? t("graph.play") : t("graph.pause")} pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
            </IconButton>
          )}
          <IconButton label={t("graph.highlight")} pressed={highlight} onClick={() => setHighlight((h) => !h)}>
            <Route className="size-5" aria-hidden />
          </IconButton>
        </div>
      </div>

      <p aria-live="polite" className={cn("text-small text-ash-gray", !highlight && "sr-only")}>
        {highlight ? (path ? t("graph.highlight.found", { n: path.hops }) : t("graph.highlight.none")) : ""}
      </p>

      <div
        ref={stageRef}
        role="img"
        aria-label={t("graph.canvas.aria", { n: view.nodes.length })}
        className={cn(
          "relative w-full overflow-hidden rounded-card border border-slate-gray bg-paper-white",
          fullscreen ? "min-h-0 flex-1" : "h-[320px] sm:h-[420px]",
        )}
      >
        {size.w > 0 && size.h > 0 ? (
          <ForceGraphCanvas
            nodes={view.nodes}
            links={view.links}
            width={size.w}
            height={size.h}
            animate={!reduced}
            paused={paused}
            highlight={highlight}
            pathNodeIds={pathNodeIds}
            pathLinkKeys={pathLinkKeys}
            selectedId={selected?.id ?? null}
            subjectLabel={t("graph.legend.subject")}
            controllerRef={controller}
            onSelect={setSelected}
            onHover={(node, at) => setHover(node && at ? { node, x: at.x, y: at.y } : null)}
          />
        ) : (
          <Skeleton className="size-full" />
        )}
        {hover && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-tag border border-carbon bg-pure-white px-[11px] py-[5px] text-small whitespace-nowrap"
            style={{ left: hover.x, top: hover.y }}
          >
            <span className="mono">{shortAddress(hover.node.id)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[9px]">
        <GraphLegend />
        <ul className="flex flex-wrap gap-x-[18px] gap-y-[4px] text-small text-ash-gray">
          {hopCountRows(result.neighbors).map((r) => (
            <li key={r.hop}>{t("graph.counts.hop", { n: r.hop, illicit: r.counts.illicit, licit: r.counts.licit, unknown: r.counts.unknown })}</li>
          ))}
        </ul>
        {view.capped && <p className="text-small text-ash-gray">{t("graph.showing", { shown: view.nodes.length, total: view.total })}</p>}
      </div>

      <GraphList nodes={view.nodes} />
      <NodeDrawer node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/**
 * Evidence graph for a check result: force-directed neighbourhood of the checked wallet, hop depth filter,
 * path to the nearest flagged wallet, node details, and a text list as the accessible alternative.
 * Contract: `<EvidenceGraph result={checkResponse} />`.
 */
export function EvidenceGraph({ result }: { result: CheckResponse }) {
  const { t } = useT();
  if (result.subgraph.nodes.length === 0) {
    return (
      <EmptyState title={t("graph.empty.title")}>{t("graph.empty.body")}</EmptyState>
    );
  }
  // Remount (fresh depth, selection, path) whenever a different wallet or report is shown.
  return (
    <Card>
      <Panel key={`${result.address}:${result.reportHash ?? ""}`} result={result} />
    </Card>
  );
}

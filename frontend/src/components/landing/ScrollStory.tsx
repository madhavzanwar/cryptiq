"use client";

import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { initStory } from "@/lib/motion/story";
import { useStaticStory } from "@/lib/motion/useStaticStory";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { classes } from "@/lib/motion/classes";
import "./ScrollStory.css";
import { STICKERS, TYPED_ADDRESS, WHEEL_ROWS, type WalletVerdict } from "./storyData";

const styles = classes("cs");

const VERDICT_KEY = { ALLOW: "verdict.allow", BLOCK: "verdict.block", WARN: "verdict.warn", UNKNOWN: "verdict.unknown" } as const;
const VT_CLASS: Record<WalletVerdict, string> = { ALLOW: styles.al ?? "", BLOCK: styles.bk ?? "", WARN: styles.wn ?? "", UNKNOWN: styles.vtUnknown ?? "" };

/** Without JS the pinned track is meaningless: show the same content stacked (see also the CSS static layout). */
const NOSCRIPT_CSS = `
[data-story-track]{height:auto!important}
[data-story-stage]{position:static!important;height:auto!important;overflow:visible!important;padding:96px 18px 70px!important;display:grid!important;gap:26px!important}
[data-story-stage]>*{position:static!important;transform:none!important;opacity:1!important;visibility:visible!important;filter:none!important;width:auto!important;height:auto!important}
[data-s="device"],[data-s="wheel"],[data-s="hint"],[data-s="search"]{display:none!important}
[data-s="lcA"],[data-s="lcB"],[data-s="lcC"]{min-height:200px!important}
[data-s="word"]{opacity:1!important}[data-s="blob"]{width:1.9em!important}
[data-s="lbl"]{max-width:none!important;opacity:1!important}
`;

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

const BOLT = "M13 2 4 14h7l-1 8 9-12h-7l1-8z";
const SHIELD = "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4";

function Bolt({ d, extra }: { d: string; extra?: React.ReactNode }) {
  return (
    <svg className={styles.bolt} viewBox="0 0 24 24" aria-hidden>
      {extra}
      <path d={d} />
    </svg>
  );
}

/**
 * The landing scroll story (ported from animation-preview.html). A pinned stage whose elements are driven by
 * scroll progress (see lib/motion/story.ts). Under reduced motion, in Settings, or without JS it renders as a
 * static stacked layout with the same content.
 */
export function ScrollStory() {
  const { t, lang } = useT();
  const root = useRef<HTMLElement>(null);
  const isStatic = useStaticStory();

  useEffect(() => {
    if (isStatic || !root.current) return;
    return initStory(root.current, { barHeight: 70, typed: TYPED_ADDRESS });
  }, [isStatic, lang]);

  const wordsA = t("story.statement.a").split(" ");
  const wordsB = t("story.statement.b").split(" ");
  const word = (w: string, i: number) => (
    <span key={`${w}-${i}`} data-s="word" className={styles.word}>
      {w}
    </span>
  );

  return (
    <section ref={root} id="story" className={styles.track} data-story-track data-static={isStatic ? "" : undefined} aria-label={t("story.label")}>
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} />
      </noscript>
      <div className={styles.stage} data-s="stage" data-story-stage>
        {/* 1. hero */}
        <div className={cn(styles.layer, styles.hero)} data-s="hero">
          <p className={styles.eyebrow}>{t("story.hero.eyebrow")}</p>
          <h1 className={styles.display}>
            <span className="load-line">
              <span style={{ "--d": "60ms" } as CSSProperties}>{t("story.hero.line1")}</span>
            </span>
            <span className="load-line">
              <span style={{ "--d": "180ms" } as CSSProperties}>{t("story.hero.line2")}</span>
            </span>
          </h1>
        </div>
        <div className={cn(styles.layer, styles.hint)} data-s="hint" aria-hidden>
          <span>{t("story.hero.scroll")}</span>
          <i />
        </div>

        {/* 2. device (decorative, labelled as example data) */}
        <div className={cn(styles.layer, styles.device)} data-s="device" aria-hidden>
          <div className={cn(styles.screen, styles.s0)} data-s="s0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.tile} data-s="tile" src="/brand/logo-mark-static.svg" alt="" />
            <div>
              {STICKERS.map((s) => (
                <div
                  key={s.id}
                  data-s="stk"
                  data-fx={s.fx}
                  data-fy={s.fy}
                  data-r={s.r}
                  className={cn(styles.stk, styles[s.tone])}
                  style={{ width: `${s.w}em`, height: `${s.h}em`, borderRadius: s.rad }}
                >
                  {s.icon ? (
                    <svg viewBox="0 0 24 24">
                      <path d={s.icon} />
                    </svg>
                  ) : s.coin ? (
                    <i className={styles.coin} />
                  ) : s.text ? (
                    t(s.text)
                      .split("|")
                      .map((line, i, a) => (
                        <span key={i}>
                          {line}
                          {i < a.length - 1 && <br />}
                        </span>
                      ))
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.screen} data-s="s1">
            <span className={styles.tag}>{t("story.example")}</span>
            <div className={styles.sTitle}>{t("story.s1.title")}</div>
            <div className={styles.micwrap}>
              <div className={styles.dmic} data-s="dmic">
                <svg viewBox="0 0 24 24">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </div>
              <div className={styles.bars}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <i key={i} style={{ "--i": i } as CSSProperties} />
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <span data-s="typed" />
              <span className={styles.caret} />
            </div>
            <div className={styles.chips}>
              <span className={styles.chip}>{t("story.s1.chip1")}</span>
              <span className={styles.chip}>{t("story.s1.chip2")}</span>
            </div>
            <div className={styles.dbtn}>{t("story.s1.button")}</div>
            <div className={styles.tap} data-s="tap" />
          </div>

          <div className={styles.screen} data-s="s2" style={{ padding: 0 }}>
            <div className={styles.inner} data-s="s2in">
              <span className={styles.tag}>{t("story.example")}</span>
              <span className={styles.vchip}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM10 10l4 4M14 10l-4 4" />
                </svg>
                {t("verdict.block")}
              </span>
              <div className={styles.meter}>
                <span className={styles.n} data-s="score" />
                <div className={styles.mtrack}>
                  <b data-s="mfill" style={{ width: 0 }} />
                </div>
              </div>
              <div className={styles.tg}>
                {t("story.s2.tg")} <b>{t("story.s2.ms")}</b>
              </div>
              <svg className={styles.graph} viewBox="0 0 220 130">
                <g stroke="#6e726e" strokeWidth="1.2">
                  <line x1="110" y1="65" x2="170" y2="30" />
                  <line x1="110" y1="65" x2="170" y2="100" />
                  <line x1="110" y1="65" x2="50" y2="30" />
                  <line x1="110" y1="65" x2="50" y2="100" />
                  <line x1="110" y1="65" x2="110" y2="115" />
                </g>
                <line x1="110" y1="65" x2="170" y2="30" stroke="#000" strokeWidth="2.4" />
                <g data-s="gn"><path d="M170 18l12 12-12 12-12-12z" fill="#c8574f" /></g>
                <g data-s="gn"><circle cx="170" cy="100" r="8" fill="#4b9a6a" /></g>
                <g data-s="gn"><circle cx="50" cy="30" r="8" fill="#fff" stroke="#6e726e" strokeWidth="2" /></g>
                <g data-s="gn"><circle cx="50" cy="100" r="8" fill="#4b9a6a" /></g>
                <g data-s="gn"><circle cx="110" cy="115" r="8" fill="#fff" stroke="#6e726e" strokeWidth="2" /></g>
                <g data-s="gn"><circle cx="110" cy="65" r="15" fill="#000" /><circle cx="110" cy="65" r="5" fill="#fcea59" /></g>
              </svg>
              <div className={styles.reasons}>
                <div><i /><span>{t("story.s2.reason1")}</span></div>
                <div><i /><span>{t("story.s2.reason2")}</span></div>
                <div><i /><span>{t("story.s2.reason3")}</span></div>
              </div>
              <div className={styles.help}>{t("honesty.short")}</div>
            </div>
          </div>

          <div className={styles.screen} data-s="s3">
            <span className={styles.tag}>{t("story.example")}</span>
            <div className={styles.sTitle}>{t("story.s3.title")}</div>
            <div className={styles.steps}>
              {(["action.connectWallet", "story.s3.step2", "story.s3.step3"] as const).map((k) => (
                <div key={k} className={styles.step} data-s="step">
                  <span className={styles.c}><Check /></span>
                  {t(k)}
                </div>
              ))}
            </div>
            <div className={styles.attest} data-s="attest">
              <b>{t("story.s3.attested")}</b>
              <span className="mono" style={{ fontSize: ".9em" }}>{t("story.s3.uid")}</span>
            </div>
            <div className={styles.help}>{t("story.s3.help")}</div>
          </div>
        </div>

        {/* left cards (collapse into chips) and right texts, three scenes */}
        {(
          [
            { id: "lcA", tone: styles.cA, title: "story.cardA.title", tag: "story.cardA.tag", icon: <Bolt d={BOLT} /> },
            { id: "lcB", tone: styles.cB, title: "story.cardB.title", tag: "story.cardB.tag", icon: <Bolt d="M8.3 11l7.4-4M8.3 13l7.4 4" extra={<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /></>} /> },
            { id: "lcC", tone: styles.cC, title: "story.cardC.title", tag: "story.cardC.tag", icon: <Bolt d={SHIELD} /> },
          ] as const
        ).map((c) => (
          <div key={c.id} className={cn(styles.layer, styles.lcard, c.tone)} data-s={c.id}>
            <div className={styles.lcFull}>
              <span className={styles.boltPos}>{c.icon}</span>
              <h3>{t(c.title)}</h3>
              <span className={cn(styles.tag, styles.tagW)}>{t(c.tag)}</span>
            </div>
            <div className={styles.lcChip}>
              <span className={cn(styles.tag, styles.tagW)}>{t(c.tag)}</span>
              {c.icon}
            </div>
          </div>
        ))}
        <div className={cn(styles.layer, styles.rtext)} data-s="rtA">
          <span>{t("story.cardA.text")}</span>
          <div className={styles.row}>
            <span className={styles.rt}>{t("lang.en")}</span>
            <span className={styles.rt} lang="hi">{t("lang.hi")}</span>
          </div>
        </div>
        <div className={cn(styles.layer, styles.rtext)} data-s="rtB">
          <span>{t("story.cardB.text")}</span>
          <div className={styles.row}>
            <span className={cn(styles.rt, styles.pk)}>{t("story.cardB.chip1")}</span>
            <span className={cn(styles.rt, styles.bl)}>{t("story.cardB.chip2")}</span>
          </div>
        </div>
        <div className={cn(styles.layer, styles.rtext)} data-s="rtC">
          <span>{t("story.cardC.text")}</span>
          <div className={styles.row}>
            <span className={cn(styles.rt, styles.y)}>{t("story.cardC.chip")}</span>
          </div>
        </div>

        {/* 3. rolling list of demo wallets */}
        <div className={cn(styles.layer, styles.wheelscene)} data-s="wheelscene">
          <div className={cn(styles.layer, styles.wl)} data-s="wl">
            <h2>{t("story.wheel.title")}</h2>
            <p>{t("story.wheel.text")}</p>
            <div className={styles.search} data-s="search">
              {t("story.wheel.search")}
              <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            </div>
          </div>
          <div className={cn(styles.layer, styles.wheel)} data-s="wheel" aria-hidden>
            {WHEEL_ROWS.map((r) => (
              <div key={r.name} data-s="row" className={styles.wrow}>
                <span className={styles.ic}><VerdictGlyph verdict={r.verdict} /></span>
                <span className="mono" style={{ fontSize: ".8em" }}>{r.name}</span>
                <span className={cn(styles.vt, VT_CLASS[r.verdict])}>{t(VERDICT_KEY[r.verdict])}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. statement with the inline pill */}
        <div className={cn(styles.layer, styles.statement)} data-s="statement">
          <div className={styles.stIn}>
            <span className={styles.label} data-s="slabel">{t("story.statement.label")}</span>
            <h2>
              {wordsA.map(word)} {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className={styles.blob} data-s="blob"><img src="/brand/logo-mark-static.svg" alt="" /></span>
              {wordsB.map(word)}
            </h2>
          </div>
        </div>

        {/* 5. end cards */}
        <div className={cn(styles.layer, styles.ecard)} data-s="ec1">
          <div>
            <h3>{t("story.e1.title")}</h3>
            <p>{t("story.e1.text")}</p>
          </div>
          <svg className={styles.cluster} viewBox="0 0 190 170" aria-hidden>
            <g style={{ "--i": 0 } as CSSProperties}><ellipse cx="62" cy="108" rx="42" ry="30" fill="#a7cbf6" stroke="#0f0f0f" strokeWidth="1.5" /></g>
            <g style={{ "--i": 1 } as CSSProperties}><ellipse cx="120" cy="52" rx="34" ry="42" fill="#ffd0e2" stroke="#0f0f0f" strokeWidth="1.5" /></g>
            <g style={{ "--i": 2 } as CSSProperties}><ellipse cx="42" cy="56" rx="28" ry="28" fill="#fcea59" stroke="#0f0f0f" strokeWidth="1.5" /></g>
            <g style={{ "--i": 3 } as CSSProperties}><ellipse cx="136" cy="122" rx="36" ry="30" fill="#e6f3ea" stroke="#0f0f0f" strokeWidth="1.5" /></g>
            <g style={{ "--i": 4 } as CSSProperties}><ellipse cx="92" cy="78" rx="16" ry="16" fill="#fbe9e7" stroke="#0f0f0f" strokeWidth="1.5" /></g>
          </svg>
        </div>
        <div className={cn(styles.layer, styles.ecard)} data-s="ec2">
          <div>
            <h3>{t("story.e2.title")}</h3>
            <p>{t("story.e2.text")}</p>
          </div>
          <div className={styles.togs}>
            {(["action.connectWallet", "story.e2.t2", "story.e2.t3", "story.e2.t4"] as const).map((k) => (
              <div key={k} className={styles.tog} data-s="tog">
                <span className={styles.tr} />
                {t(k)}
              </div>
            ))}
          </div>
        </div>

        {/* the single saturated green: full pill in the hero, compact pill docked at the bottom */}
        <Link href="/check" className={cn(styles.layer, styles.cta)} data-s="cta">
          <span className={styles.lbl} data-s="lbl">{t("action.getStarted")}</span>
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function VerdictGlyph({ verdict }: { verdict: WalletVerdict }) {
  switch (verdict) {
    case "ALLOW":
      return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" fill="#4b9a6a" /></svg>;
    case "BLOCK":
      return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M12 2l10 10-10 10L2 12z" fill="#c8574f" /></svg>;
    case "WARN":
      return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M12 3l10 18H2z" fill="#e0b93a" stroke="#0f0f0f" strokeWidth="1.2" /></svg>;
    default:
      return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#6e726e" strokeWidth="2.5" /></svg>;
  }
}

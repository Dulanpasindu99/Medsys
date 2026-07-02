"use client";

import { useEffect, useState } from "react";
import { useT } from "@/app/lib/i18n";

// Continuously types out the heading + subheading, holds, erases, and repeats — with a
// blinking caret on whichever line is active. Heights are reserved so the cards below never
// jump as the text grows and shrinks. Restarts (with translated text) when the language changes.
export function TypewriterHero() {
  const t = useT();
  const TITLE = t("Welcome to MedLink");
  const SUB = t("Choose how you would like to continue.");

  const [state, setState] = useState<{ title: number; sub: number; active: "title" | "sub"; forTitle: string }>({
    title: 0,
    sub: 0,
    active: "title",
    forTitle: TITLE
  });
  // Reset to the start when the language (and thus the text) changes — render-phase, no effect.
  if (state.forTitle !== TITLE) {
    setState({ title: 0, sub: 0, active: "title", forTitle: TITLE });
  }

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // phases: 0 type title → 1 type sub → 2 hold → 3 erase sub → 4 erase title → loop
    let phase = 0;
    let title = 0;
    let sub = 0;

    const at = (ms: number) => {
      timer = setTimeout(step, ms);
    };
    const step = () => {
      if (cancelled) return;
      if (phase === 0) {
        if (title < TITLE.length) {
          title += 1;
          setState({ title, sub, active: "title", forTitle: TITLE });
          at(75);
        } else {
          phase = 1;
          at(450);
        }
      } else if (phase === 1) {
        if (sub < SUB.length) {
          sub += 1;
          setState({ title, sub, active: "sub", forTitle: TITLE });
          at(32);
        } else {
          phase = 2;
          at(2400);
        }
      } else if (phase === 2) {
        phase = 3;
        at(30);
      } else if (phase === 3) {
        if (sub > 0) {
          sub -= 1;
          setState({ title, sub, active: "sub", forTitle: TITLE });
          at(16);
        } else {
          phase = 4;
          at(250);
        }
      } else {
        if (title > 0) {
          title -= 1;
          setState({ title, sub, active: "title", forTitle: TITLE });
          at(28);
        } else {
          phase = 0;
          at(600);
        }
      }
    };

    at(600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [TITLE, SUB]);

  return (
    <>
      <style>{"@keyframes tw-blink{0%,49%{opacity:1}50%,100%{opacity:0}}"}</style>
      <h1 className="mt-3 min-h-[1.2em] text-center text-[clamp(1.5rem,4vw,2.4rem)] font-black leading-tight tracking-tight text-slate-900 sm:mt-6">
        {TITLE.slice(0, state.title)}
        {state.active === "title" ? <Caret /> : null}
      </h1>
      <p className="mt-2 min-h-[1.5em] max-w-xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
        {SUB.slice(0, state.sub)}
        {state.active === "sub" ? <Caret /> : null}
      </p>
    </>
  );
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block w-[2px] translate-y-[0.08em] self-stretch bg-sky-500 align-middle"
      style={{ height: "1em", animation: "tw-blink 1s steps(1) infinite" }}
    />
  );
}

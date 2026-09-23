"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    title: "Where will it sit?",
    options: [
      { id: "table", label: "Table / bedside lamp", hint: "Usually 20–30 cm diameter" },
      { id: "floor", label: "Floor lamp", hint: "Usually 40–45 cm diameter" },
      { id: "pendant", label: "Pendant / ceiling", hint: "Balance with room height" },
    ],
  },
  {
    title: "Base width (approx.)",
    options: [
      { id: "narrow", label: "Under 15 cm", hint: "Try 20–30 cm shades" },
      { id: "mid", label: "15–25 cm", hint: "Try 30–40 cm shades" },
      { id: "wide", label: "Over 25 cm", hint: "Try 40–45 cm shades" },
    ],
  },
  {
    title: "Desired presence",
    options: [
      { id: "quiet", label: "Quiet & compact", hint: "Smaller diameter, softer pool of light" },
      { id: "balanced", label: "Balanced", hint: "Classic proportions for most rooms" },
      { id: "statement", label: "Statement", hint: "Wider coolie or tall drum" },
    ],
  },
];

function recommend(answers: string[]) {
  const [place, base, presence] = answers;
  let size = "30cm";
  let shape = "drum";
  if (place === "floor" || base === "wide" || presence === "statement") size = "40cm";
  if (place === "table" && base === "narrow" && presence === "quiet") size = "20cm";
  if (presence === "statement" && place === "pendant") shape = "coolie";
  if (place === "table" && presence === "balanced") shape = "empire";
  return { size, shape };
}

export default function SizeGuidePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const result = useMemo(() => {
    if (answers.length < 3) return null;
    return recommend(answers);
  }, [answers]);

  function pick(id: string) {
    const next = [...answers.slice(0, step), id];
    setAnswers(next);
    setStep(Math.min(step + 1, STEPS.length));
  }

  const sizes = [
    { cm: 20, label: "20 cm" },
    { cm: 30, label: "30 cm" },
    { cm: 40, label: "40 cm" },
    { cm: 45, label: "45 cm" },
  ];

  return (
    <div className="container-site py-10 md:py-14 max-w-3xl">
      <p className="eyebrow mb-2">Fit</p>
      <h1 className="font-display text-4xl md:text-5xl mb-3">Size guide</h1>
      <p className="prose-muted mb-8">
        A short interactive wizard to suggest shade diameter and form. Toggle centimetres or inches
        for reference measurements.
      </p>

      <div className="flex gap-2 mb-8">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm border ${unit === "cm" ? "border-[color:var(--ink)] bg-[color:var(--ink)] text-white" : "border-[color:var(--line)]"}`}
          onClick={() => setUnit("cm")}
        >
          cm
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm border ${unit === "in" ? "border-[color:var(--ink)] bg-[color:var(--ink)] text-white" : "border-[color:var(--line)]"}`}
          onClick={() => setUnit("in")}
        >
          inches
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {sizes.map((s) => (
          <div key={s.cm} className="border border-[color:var(--line)] p-4 bg-white/50">
            <p className="font-medium">
              {unit === "cm" ? `${s.cm} cm` : `${(s.cm / 2.54).toFixed(1)} in`} diameter
            </p>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              Typical height ≈ {unit === "cm" ? `${Math.round(s.cm * 0.7)} cm` : `${((s.cm * 0.7) / 2.54).toFixed(1)} in`}
            </p>
          </div>
        ))}
      </div>

      {step < STEPS.length && (
        <div>
          <p className="text-sm text-[color:var(--muted)] mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="font-display text-3xl mb-6">{STEPS[step].title}</h2>
          <div className="space-y-3">
            {STEPS[step].options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                className="w-full text-left border border-[color:var(--line)] p-4 hover:border-[color:var(--bronze)] bg-white/60"
              >
                <p className="font-medium">{o.label}</p>
                <p className="text-sm text-[color:var(--muted)]">{o.hint}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="border border-[color:var(--line)] p-6 bg-white/70 mt-4">
          <h2 className="font-display text-3xl mb-3">Our suggestion</h2>
          <p className="prose-muted mb-6">
            Start with a <strong>{result.size.replace("cm", " cm")}</strong>{" "}
            <strong>{result.shape}</strong> shade. You can refine fabric and fitting in the
            configurator.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/shop/lampshades?shape=${result.shape}`}
              className="btn-primary"
            >
              Shop {result.shape} shades
            </Link>
            <Link href="/design-your-shade" className="btn-secondary">
              Design your shade
            </Link>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setStep(0);
                setAnswers([]);
              }}
            >
              Restart wizard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

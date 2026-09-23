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

export function SizeGuideWizard() {
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
    <>
      <div className="flex gap-2 mb-8">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm border ${unit === "cm" ? "border-ink bg-ink text-ivory" : "border-line"}`}
          onClick={() => setUnit("cm")}
        >
          cm
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm border ${unit === "in" ? "border-ink bg-ink text-ivory" : "border-line"}`}
          onClick={() => setUnit("in")}
        >
          inches
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {sizes.map((s) => (
          <div key={s.cm} className="surface-panel p-4">
            <p className="font-medium">
              {unit === "cm" ? `${s.cm} cm` : `${(s.cm / 2.54).toFixed(1)} in`} diameter
            </p>
            <p className="text-sm text-muted mt-1">
              Typical height ≈{" "}
              {unit === "cm"
                ? `${Math.round(s.cm * 0.7)} cm`
                : `${((s.cm * 0.7) / 2.54).toFixed(1)} in`}
            </p>
          </div>
        ))}
      </div>

      {step < STEPS.length && (
        <div>
          <p className="text-sm text-muted mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="font-display text-3xl tracking-tight mb-6">{STEPS[step].title}</h2>
          <div className="space-y-3">
            {STEPS[step].options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                className="studio-option w-full"
              >
                <p className="font-medium">{o.label}</p>
                <p className="text-sm text-muted mt-1">{o.hint}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="surface-panel p-6 md:p-8 mt-4">
          <p className="eyebrow mb-2">Suggestion</p>
          <h2 className="font-display text-3xl tracking-tight mb-3">Our suggestion</h2>
          <div className="lux-rule" />
          <p className="prose-muted mb-6">
            Start with a <strong>{result.size.replace("cm", " cm")}</strong>{" "}
            <strong>{result.shape}</strong> shade. Refine fabric, lining and fitting in the studio.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/design-your-shade?shape=${result.shape}&step=1`}
              className="btn-primary"
            >
              Open studio with {result.shape}
            </Link>
            <Link href={`/shop/lampshades?shape=${result.shape}`} className="btn-secondary">
              Shop {result.shape} shades
            </Link>
            <button
              type="button"
              className="btn-quiet"
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
    </>
  );
}

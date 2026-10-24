import type { CriterionScore, VivaEval } from "../api/types";

const labels: Record<CriterionScore["name"], string> = {
  core_concepts: "Core concepts",
  technical_correctness: "Technical correctness",
  reasoning: "Reasoning",
  clarity: "Clarity",
};

const statusStyle = {
  demonstrated: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  missing: "bg-accent-light text-accent",
};

export default function RubricScoreCard({ ev, total, max }: { ev: VivaEval; total: number; max: number }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink/60">Score for this answer</p>
          <p className="text-4xl font-extrabold text-primary">
            {total}
            <span className="text-xl text-ink/40">/{max}</span>
          </p>
        </div>
        <p className="max-w-[12rem] text-right text-xs text-ink/50">
          AI estimate from a fixed rubric. Use it as practice feedback, not official marks.
        </p>
      </div>

      <div className="space-y-4">
        {ev.criteria.map((c) => (
          <div key={c.name}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>{labels[c.name]}</span>
              <span className="text-primary">
                {c.score}/{c.max_score}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-lavender">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-primary to-primary-light transition-all"
                style={{ width: `${(c.score / c.max_score) * 100}%` }}
              />
            </div>
            {c.evidence.map((e, i) => (
              <p key={i} className="mt-1 border-l-2 border-primary/20 pl-3 text-xs italic text-ink/60">
                “{e}”
              </p>
            ))}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Concepts</p>
        <div className="flex flex-wrap gap-2">
          {ev.concept_statuses.map((s) => (
            <span key={s.concept_id} className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[s.status]}`}>
              {s.concept_id.replace(/_/g, " ")} · {s.status}
            </span>
          ))}
        </div>
      </div>

      <p className="rounded-2xl bg-lavender p-4 text-sm leading-relaxed">{ev.feedback}</p>
    </div>
  );
}

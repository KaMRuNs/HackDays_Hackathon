import { Lightbulb, Sparkles, BookMarked } from "lucide-react";
import type { Explanation, Strategy } from "../api/types";

const strategyLabel: Record<Strategy, string> = {
  analogy: "Analogy",
  example: "Worked example",
  step_by_step: "Step by step",
};

export default function ExplanationCard({ data, strategy }: { data: Explanation; strategy: Strategy }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="card border-t-4 border-primary">
        <div className="mb-2 flex items-center gap-2 font-bold text-primary">
          <Sparkles size={18} /> In simple words
        </div>
        <p className="leading-relaxed text-ink/80">{data.simple}</p>
      </section>
      <section className="card border-t-4 border-accent">
        <div className="mb-2 flex items-center gap-2 font-bold text-accent">
          <Lightbulb size={18} /> {strategyLabel[strategy]}
        </div>
        <p className="whitespace-pre-line leading-relaxed text-ink/80">{data.analogy}</p>
      </section>
      <section className="card border-t-4 border-primary-light">
        <div className="mb-2 flex items-center gap-2 font-bold text-primary-light">
          <BookMarked size={18} /> Viva-ready definition
        </div>
        <p className="leading-relaxed text-ink/80">{data.technical_definition}</p>
      </section>
    </div>
  );
}

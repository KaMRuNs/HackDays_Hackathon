import { BookOpen, Mic, Search, Wrench, BadgeCheck } from "lucide-react";

const steps = [
  { icon: BookOpen, title: "Learn", text: "Get a concept explained simply." },
  { icon: Mic, title: "Prove", text: "Answer a viva question in your own words." },
  { icon: Search, title: "Diagnose", text: "See exactly which concepts are missing." },
  { icon: Wrench, title: "Repair", text: "Study only the gaps, a new way." },
  { icon: BadgeCheck, title: "Verify", text: "Beat a fresh question on the same idea." },
];

export default function LoopSteps() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s, i) => (
        <div key={s.title} className="card relative">
          <span className="absolute right-5 top-4 text-4xl font-extrabold text-lavender">0{i + 1}</span>
          <s.icon className="mb-3 text-accent" />
          <h3 className="text-lg font-bold text-primary">{s.title}</h3>
          <p className="mt-1 text-sm text-ink/70">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

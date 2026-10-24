import { Network, Code2, type LucideIcon } from "lucide-react";
import type { Subject } from "../api/types";

const styles: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  computer_networks: { icon: Network, bg: "bg-primary", fg: "text-white" },
  software_engineering: { icon: Code2, bg: "bg-accent", fg: "text-white" },
};

export default function SubjectTile({ subject, onClick, disabled }: { subject: Subject; onClick: () => void; disabled?: boolean }) {
  const s = styles[subject.id] ?? styles.computer_networks;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${s.bg} ${s.fg} group flex flex-col items-start rounded-2xl p-6 text-left shadow-soft transition hover:-translate-y-1 disabled:opacity-60`}
    >
      <s.icon size={36} className="mb-6 opacity-90" />
      <h3 className="text-xl font-bold">{subject.title}</h3>
      <p className="mt-1 text-sm opacity-80">
        {subject.question_count} questions · {Object.keys(subject.concepts).length} concepts
      </p>
      <span className="mt-4 rounded-full bg-white/20 px-4 py-1 text-sm font-semibold group-hover:bg-white/30">
        Start viva →
      </span>
    </button>
  );
}

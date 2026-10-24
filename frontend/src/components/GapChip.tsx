import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function GapChip({ conceptId, meaning, subject }: { conceptId: string; meaning: string; subject: string }) {
  const navigate = useNavigate();
  const go = () => {
    const params = new URLSearchParams({ concept: meaning, concept_id: conceptId, subject, strategy: "example" });
    navigate(`/learn?${params}`);
  };
  return (
    <button
      onClick={go}
      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-95"
    >
      <BookOpen size={16} /> Learn: {conceptId.replace(/_/g, " ")}
    </button>
  );
}

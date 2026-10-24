import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Gap, GapStatus, Subject } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";
import GapChip from "../components/GapChip";

const columns: { status: GapStatus; title: string; hint: string; style: string }[] = [
  { status: "open", title: "Open", hint: "Found in a viva. Learn it next.", style: "bg-accent-light text-accent" },
  { status: "practiced", title: "Practiced", hint: "Passed the check. Prove it on a new question.", style: "bg-amber-100 text-amber-700" },
  { status: "resolved", title: "Resolved", hint: "Demonstrated on an unseen question.", style: "bg-emerald-100 text-emerald-700" },
];

export default function GapsPage() {
  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.gaps(), api.subjects()])
      .then(([g, s]) => { setGaps(g); setSubjects(s); })
      .catch((e) => setError((e as Error).message));
  }, []);

  const subjectOf = (conceptId: string) => subjects.find((s) => conceptId in s.concepts)?.id ?? "computer_networks";
  const resolved = gaps?.filter((g) => g.status === "resolved").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold text-primary">My gaps</h1>
        <p className="mt-2 text-ink/60">Every concept a viva caught you on, and how far you've come.</p>
      </div>
      {error && <ErrorBanner message={error} />}

      {gaps && gaps.length > 0 && (
        <div className="card">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span>Progress</span>
            <span className="text-primary">{resolved}/{gaps.length} resolved</span>
          </div>
          <div className="h-3 rounded-full bg-lavender">
            <div className="h-3 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(resolved / gaps.length) * 100}%` }} />
          </div>
        </div>
      )}

      {gaps && gaps.length === 0 && (
        <div className="card text-center">
          <p className="text-ink/70">No gaps yet. Take a mock viva to find out what to study.</p>
          <Link to="/viva" className="btn-primary mt-4">Start a viva</Link>
        </div>
      )}

      {gaps && gaps.length > 0 && (
        <div className="grid gap-5 md:grid-cols-3">
          {columns.map((col) => (
            <section key={col.status} className="rounded-2xl bg-lavender p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${col.style}`}>{col.title}</span>
                <span className="text-sm text-ink/50">{gaps.filter((g) => g.status === col.status).length}</span>
              </div>
              <p className="mb-4 text-xs text-ink/50">{col.hint}</p>
              <div className="space-y-3">
                {gaps.filter((g) => g.status === col.status).map((g) => (
                  <div key={g.concept_id} className="card space-y-2 p-4">
                    <p className="font-bold capitalize">{g.concept_id.replace(/_/g, " ")}</p>
                    <p className="text-sm text-ink/60">{g.meaning}</p>
                    <p className="text-xs text-ink/40">Attempts: {g.attempt_count}</p>
                    {g.status === "open" && <GapChip conceptId={g.concept_id} meaning={g.meaning} subject={subjectOf(g.concept_id)} />}
                    {g.status === "practiced" && (
                      <Link className="btn-primary px-4 py-2 text-sm" to={`/viva?subject=${subjectOf(g.concept_id)}&concepts=${g.concept_id}`}>
                        Verify now →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

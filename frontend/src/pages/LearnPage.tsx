import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCw, Send, Sparkles, XCircle } from "lucide-react";
import { api } from "../api/client";
import type { CheckResult, Explanation, Strategy } from "../api/types";
import ExplanationCard from "../components/ExplanationCard";
import ErrorBanner from "../components/ErrorBanner";
import Loader from "../components/Loader";

const suggestions = ["What is a nonce in computer security?", "Subnet mask", "Unit vs integration testing"];

export default function LearnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const conceptId = params.get("concept_id") ?? undefined;
  const subject = params.get("subject") ?? undefined;

  const [concept, setConcept] = useState(params.get("concept") ?? "");
  const [strategy, setStrategy] = useState<Strategy>((params.get("strategy") as Strategy) ?? "analogy");
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [answer, setAnswer] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState<"explain" | "check" | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);

  const explain = async (text: string, strat?: Strategy) => {
    if (!text.trim()) return;
    setLoading("explain");
    setError(null);
    setCheck(null);
    setAnswer("");
    try {
      setExplanation(await api.explain(text.trim(), strat));
      setStrategy(strat ?? "analogy");
    } catch (e) {
      setError({ message: (e as Error).message, retry: () => explain(text, strat) });
    } finally {
      setLoading(null);
    }
  };

  const submitCheck = async () => {
    if (!explanation || !answer.trim()) return;
    setLoading("check");
    setError(null);
    try {
      setCheck(await api.check(concept, explanation.check_question, answer.trim(), conceptId));
    } catch (e) {
      setError({ message: (e as Error).message, retry: submitCheck });
    } finally {
      setLoading(null);
    }
  };

  const reexplain = () => {
    if (!check) return;
    const next = check.next_strategy === strategy
      ? (["analogy", "example", "step_by_step"] as Strategy[]).find((s) => s !== strategy)!
      : check.next_strategy;
    explain(concept, next);
  };

  // Arriving from a gap chip: explain straight away, using a different strategy.
  const autoRan = useRef("");
  useEffect(() => {
    if (autoRan.current === params.toString()) return;
    autoRan.current = params.toString();
    if (params.get("concept")) explain(params.get("concept")!, (params.get("strategy") as Strategy) ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Learn a concept</h1>
        <p className="mt-2 text-ink/60">Type any technical term or question. We'll explain it simply, then check that you really got it.</p>
      </div>

      {conceptId && (
        <div className="rounded-2xl bg-accent-light p-4 text-sm">
          <b className="text-accent">Repairing a gap:</b> {conceptId.replace(/_/g, " ")}. Pass the check below, then retry the viva on a new question.
        </div>
      )}

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          explain(concept);
        }}
      >
        <input
          className="input"
          placeholder="e.g. What is a nonce in computer security?"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          maxLength={200}
        />
        <button className="btn-primary shrink-0" disabled={!!loading || !concept.trim()}>
          <Sparkles size={18} /> Explain
        </button>
      </form>
      {!explanation && !loading && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} className="rounded-full bg-lavender px-4 py-2 text-sm text-primary hover:bg-primary/10"
              onClick={() => { setConcept(s); explain(s); }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorBanner message={error.message} onRetry={error.retry} />}
      {loading === "explain" && <Loader label="Preparing your explanation…" />}

      {explanation && loading !== "explain" && (
        <>
          <ExplanationCard data={explanation} strategy={strategy} />

          <section className="card space-y-4 bg-lavender shadow-none">
            <h2 className="text-lg font-bold text-primary">Quick check</h2>
            <p className="font-medium">{explanation.check_question}</p>
            <textarea
              className="input min-h-[110px]"
              placeholder="Answer in your own words. Simple English is fine."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!!check}
            />
            {!check && (
              <button className="btn-primary" onClick={submitCheck} disabled={!!loading || !answer.trim()}>
                <Send size={18} /> Check my answer
              </button>
            )}
            {loading === "check" && <Loader label="Checking your understanding…" />}

            {check && (
              <div className={`rounded-2xl bg-white p-5 ${check.correct ? "border-2 border-emerald-300" : "border-2 border-accent/40"}`}>
                <div className="mb-2 flex items-center gap-2 font-bold">
                  {check.correct ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-accent" />}
                  {check.correct ? "You've got it!" : "Not quite yet"}
                </div>
                <p className="text-sm leading-relaxed text-ink/80">{check.feedback}</p>
                {check.misconception && (
                  <p className="mt-2 text-sm"><b>Misconception:</b> {check.misconception}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {!check.correct && (
                    <button className="btn-accent" onClick={reexplain}>
                      <RefreshCw size={18} /> Explain it another way
                    </button>
                  )}
                  {check.correct && conceptId && subject && (
                    <button className="btn-primary"
                      onClick={() => navigate(`/viva?subject=${subject}&concepts=${conceptId}`)}>
                      Verify in a new viva question →
                    </button>
                  )}
                  <button className="btn-ghost" onClick={() => { setCheck(null); setAnswer(""); }}>
                    Answer again
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

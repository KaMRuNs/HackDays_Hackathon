import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Send, UserRound } from "lucide-react";
import { api } from "../api/client";
import type { Subject, VivaTurnResult } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";
import GapChip from "../components/GapChip";
import Loader from "../components/Loader";
import RubricScoreCard from "../components/RubricScoreCard";
import SpeakButton, { canSpeak, speak } from "../components/SpeakButton";
import SubjectTile from "../components/SubjectTile";

interface Turn {
  question: string;
  answer?: string;
  result?: VivaTurnResult;
}

export default function VivaPage() {
  const [params] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryMode = params.get("concepts");
  const [voiceOn, setVoiceOn] = useState(false);

  // Examiner voice: automatically read each new question aloud when enabled.
  const latestQuestion = turns.length ? turns[turns.length - 1].question : "";
  useEffect(() => {
    if (voiceOn && latestQuestion) speak(latestQuestion);
  }, [voiceOn, latestQuestion]);

  const start = async (s: Subject, conceptIds?: string[]) => {
    setSubject(s);
    setError(null);
    setTurns([]);
    try {
      const res = await api.startViva(s.id, conceptIds);
      setSessionId(res.session_id);
      setTurns([{ question: res.question }]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    api.subjects().then((list) => {
      setSubjects(list);
      const fromGap = list.find((s) => s.id === params.get("subject"));
      if (fromGap && retryMode) start(fromGap, retryMode.split(","));
    }).catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!sessionId || !draft.trim()) return;
    const text = draft.trim();
    setLoading(true);
    setError(null);
    try {
      const result = await api.answerViva(sessionId, text);
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = { ...copy[copy.length - 1], answer: text, result };
        if (!result.done && result.next_question) copy.push({ question: result.next_question });
        return copy;
      });
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const last = turns[turns.length - 1];
  const done = !!last?.result?.done;
  const answered = turns.filter((t) => t.result);
  const avg = answered.length ? answered.reduce((a, t) => a + t.result!.total, 0) / answered.length : 0;
  // Final concept status = the latest turn's judgement for each concept.
  const gapIds = done
    ? last.result!.eval.concept_statuses.filter((s) => s.status !== "demonstrated").map((s) => s.concept_id)
    : [];

  if (!subject) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Mock viva</h1>
          <p className="mt-2 text-ink/60">Pick a lab. The examiner asks a question, grades your explanation and probes your weakest point.</p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-5 sm:grid-cols-2">
          {subjects.map((s) => <SubjectTile key={s.id} subject={s} onClick={() => start(s)} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent">{retryMode ? "Verify round · new question" : "Mock viva"}</p>
          <h1 className="text-3xl font-extrabold text-primary">{subject.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSpeak && (
            <button
              className={voiceOn ? "btn-primary" : "btn-ghost"}
              onClick={() => { if (voiceOn) window.speechSynthesis.cancel(); setVoiceOn(!voiceOn); }}
            >
              {voiceOn ? "🔊 Examiner voice on" : "🔈 Examiner voice off"}
            </button>
          )}
          <button className="btn-ghost" onClick={() => { setSubject(null); setSessionId(null); setTurns([]); }}>
            Change subject
          </button>
        </div>
      </div>

      {turns.map((t, i) => (
        <div key={i} className="space-y-4">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">
              <UserRound size={20} />
            </span>
            <div className="rounded-2xl rounded-tl-none bg-primary p-4 font-medium text-white">
              {i > 0 && <span className="mb-1 block text-xs uppercase opacity-70">Follow-up</span>}
              {t.question}
              <div><SpeakButton text={t.question} /></div>
            </div>
          </div>
          {t.answer && <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-lavender p-4">{t.answer}</div>}
          {t.result && <RubricScoreCard ev={t.result.eval} total={t.result.total} max={t.result.max_total} />}
        </div>
      ))}

      {error && <ErrorBanner message={error} onRetry={sessionId ? submit : undefined} />}
      {loading && <Loader label="The examiner is grading your answer…" />}

      {sessionId && !done && !loading && (
        <div className="card space-y-3">
          <textarea
            className="input min-h-[130px]"
            placeholder="Explain in your own words, as you would to your lab teacher."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
            <Send size={18} /> Submit answer
          </button>
        </div>
      )}

      {done && (
        <div className="card space-y-4 border-2 border-primary/10">
          <h2 className="text-2xl font-extrabold text-primary">Viva complete · average {avg.toFixed(1)}/10</h2>
          {gapIds.length ? (
            <>
              <p className="text-ink/70">These concepts need work. Learn each one, then prove it on a new question.</p>
              <div className="flex flex-wrap gap-2">
                {gapIds.map((id) => (
                  <GapChip key={id} conceptId={id} meaning={subject.concepts[id] ?? id} subject={subject.id} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-emerald-700">Every concept was demonstrated. Great work!</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button className="btn-ghost" onClick={() => start(subject)}>Another question</button>
            <Link className="btn-ghost" to="/gaps">See all my gaps</Link>
          </div>
        </div>
      )}
    </div>
  );
}
